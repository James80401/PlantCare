import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  PlanTier,
  RecommendationPriority,
  RecommendationStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { effectivePlanTier } from '../config/premium-policy';
import {
  getLocalDateKey,
  getLocalDayStart,
  getLocalHour,
} from '../weather/weather-cache.util';
import { EmailService } from '../email/email.service';
import { resolveFcmTransport, sendFcmNotification } from './fcm.client';
import { resolveSmsTransport, sendSmsNotification } from './sms.client';
import { buildCareReminderPush, type TaskReminderRow } from './task-reminder-copy';

type DeliveryStatus = 'SENT' | 'FAILED' | 'SKIPPED' | 'UNCONFIGURED';

interface DeliveryResult {
  status: DeliveryStatus;
  provider: string;
  errorCode?: string;
  errorMessage?: string;
}

interface ReminderUser {
  id: string;
  email: string;
  planTier: PlanTier;
  notifyEmail: boolean;
  notifyPush: boolean;
  notifySms: boolean;
  phone: string | null;
  timezone: string | null;
  reminderHour: number | null;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

const DELIVERY_CLAIM_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  isQuietHours(
    user: {
      quietHoursStart: number | null;
      quietHoursEnd: number | null;
      timezone: string | null;
    },
    now = new Date(),
  ): boolean {
    if (user.quietHoursStart == null || user.quietHoursEnd == null) return false;
    const hour = getLocalHour(user.timezone || 'UTC', now);
    if (user.quietHoursStart <= user.quietHoursEnd) {
      return hour >= user.quietHoursStart && hour < user.quietHoursEnd;
    }
    return hour >= user.quietHoursStart || hour < user.quietHoursEnd;
  }

  isReminderHourDue(
    user: { reminderHour: number | null; timezone: string | null },
    now = new Date(),
  ): boolean {
    return (user.reminderHour ?? 9) === getLocalHour(user.timezone || 'UTC', now);
  }

  async sendDueTaskReminders() {
    const count = await this.sendTaskRemindersForWindow({ overdue: false });
    this.logger.log(`Processed due-today reminders for ${count} users`);
  }

  async sendOverdueTaskReminders() {
    const count = await this.sendTaskRemindersForWindow({ overdue: true });
    this.logger.log(`Processed overdue reminders for ${count} users`);
  }

  async sendRecommendationReminders() {
    const now = new Date();
    const recommendations = await this.prisma.recommendation.findMany({
      where: {
        status: RecommendationStatus.ACTIVE,
        priority: {
          in: [RecommendationPriority.HIGH, RecommendationPriority.MEDIUM],
        },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
      include: { user: true },
      orderBy: { priority: 'desc' },
    });

    const byUser = new Map<string, typeof recommendations>();
    for (const recommendation of recommendations) {
      if (!byUser.has(recommendation.userId)) byUser.set(recommendation.userId, []);
      byUser.get(recommendation.userId)!.push(recommendation);
    }

    let processedUsers = 0;
    for (const [userId, userRecommendations] of byUser) {
      const user = userRecommendations[0].user;
      if (
        this.isQuietHours(user, now) ||
        !this.isReminderHourDue(user, now)
      ) {
        continue;
      }

      const ids = userRecommendations.map((recommendation) => recommendation.id);
      const logs = await this.prisma.notificationLog.findMany({
        where: {
          userId,
          channel: NotificationChannel.PUSH,
          relatedEntity: 'recommendation',
          relatedId: { in: ids },
        },
        select: { relatedId: true, status: true },
      });
      const statusById = new Map(
        logs.map((log) => [log.relatedId, log.status.toUpperCase()]),
      );
      const pending = userRecommendations.filter((recommendation) => {
        const status = statusById.get(recommendation.id);
        if (status === 'SENT') return false;
        return !(recommendation.notifiedAt && status == null);
      });
      if (!pending.length) continue;

      const initialCopy = this.buildRecommendationPush(pending);
      const claimedIds = await this.claimDeliveries({
        userId,
        channel: NotificationChannel.PUSH,
        entities: pending.map((recommendation) => ({
          id: recommendation.id,
          dedupeKey: `recommendation:${recommendation.id}`,
        })),
        relatedEntity: 'recommendation',
        message: `[recommendation] ${initialCopy.title}: ${initialCopy.body}`,
      });
      const claimed = pending.filter((item) => claimedIds.has(item.id));
      if (!claimed.length) continue;

      const { title, body } = this.buildRecommendationPush(claimed);
      const result = user.notifyPush
        ? await this.sendPush(userId, title, body, {
            tag: 'recommendation',
            route: '/garden',
          })
        : this.skipped('fcm', 'PREFERENCE_DISABLED', 'Push notifications are disabled.');
      await this.recordDeliveries({
        userId,
        channel: NotificationChannel.PUSH,
        entities: claimed.map((recommendation) => ({
          id: recommendation.id,
          dedupeKey: `recommendation:${recommendation.id}`,
        })),
        relatedEntity: 'recommendation',
        message: `[recommendation] ${title}: ${body}`,
        result,
      });
      if (result.status === 'SENT') {
        await this.prisma.recommendation.updateMany({
          where: {
            id: { in: claimed.map((recommendation) => recommendation.id) },
          },
          data: { notifiedAt: now },
        });
      }
      processedUsers += 1;
    }

    this.logger.log(
      `Processed recommendation reminders for ${processedUsers} users`,
    );
  }

  private buildRecommendationPush(
    recommendations: { title: string }[],
  ): { title: string; body: string } {
    if (recommendations.length === 1) {
      return {
        title: 'Plant recommendation',
        body: recommendations[0].title,
      };
    }
    const lines = recommendations.slice(0, 3).map((item) => item.title);
    const extra =
      recommendations.length > 3
        ? ` +${recommendations.length - 3} more`
        : '';
    return {
      title: `${recommendations.length} plant recommendations`,
      body: `${lines.join(', ')}${extra}`,
    };
  }

  private async sendTaskRemindersForWindow(options: {
    overdue: boolean;
  }): Promise<number> {
    const now = new Date();
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        planTier: true,
        notifyEmail: true,
        notifyPush: true,
        notifySms: true,
        phone: true,
        timezone: true,
        reminderHour: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    let processedUsers = 0;
    for (const user of users as ReminderUser[]) {
      if (
        this.isQuietHours(user, now) ||
        !this.isReminderHourDue(user, now)
      ) {
        continue;
      }

      const timezone = user.timezone || 'UTC';
      const todayStart = getLocalDayStart(timezone, 0, now);
      const tomorrowStart = getLocalDayStart(timezone, 1, now);
      const tasks = await this.prisma.task.findMany({
        where: {
          status: TaskStatus.PENDING,
          plant: { userId: user.id },
          dueDate: options.overdue
            ? { lt: todayStart }
            : { gte: todayStart, lt: tomorrowStart },
        },
        include: {
          plant: { include: { species: true } },
        },
        orderBy: { dueDate: 'asc' },
      });
      if (!tasks.length) continue;

      const ids = tasks.map((task) => task.id);
      const logs = await this.prisma.notificationLog.findMany({
        where: {
          userId: user.id,
          relatedEntity: 'task',
          relatedId: { in: ids },
        },
        select: { channel: true, relatedId: true, status: true },
      });
      const statusByChannelAndId = new Map(
        logs.map((log) => [
          `${log.channel}:${log.relatedId}`,
          log.status.toUpperCase(),
        ]),
      );
      const candidates = tasks.filter((task) => {
        const hasLedger = logs.some((log) => log.relatedId === task.id);
        return !(task.notifiedAt && !hasLedger);
      });
      if (!candidates.length) continue;

      const sentTaskIds = new Set<string>();
      for (const channel of [
        NotificationChannel.EMAIL,
        NotificationChannel.PUSH,
        NotificationChannel.SMS,
      ]) {
        const pending = candidates.filter(
          (task) =>
            statusByChannelAndId.get(`${channel}:${task.id}`) !== 'SENT',
        );
        if (!pending.length) continue;

        const initialRows = this.taskReminderRows(pending);
        const initialPush = buildCareReminderPush(initialRows, {
          overdue: options.overdue,
        });
        const emailSubject = options.overdue
          ? 'Overdue plant care'
          : 'Plant care due today';
        const initialEmailBody = pending
          .map(
            (task) =>
              `${task.taskType}: ${
                task.plant.nickname || task.plant.species.commonName
              } (due ${this.formatLocalDate(task.dueDate, timezone)})`,
          )
          .join('\n');
        const initialMessage =
          channel === NotificationChannel.EMAIL
            ? `${emailSubject}\n${initialEmailBody}`
            : `${initialPush.title}: ${initialPush.body}`;
        const claimedIds = await this.claimDeliveries({
          userId: user.id,
          channel,
          entities: pending.map((task) => ({
            id: task.id,
            dedupeKey: `task:${task.id}:care`,
          })),
          relatedEntity: 'task',
          message: initialMessage,
        });
        const claimed = pending.filter((task) => claimedIds.has(task.id));
        if (!claimed.length) continue;

        const rows = this.taskReminderRows(claimed);
        const push = buildCareReminderPush(rows, {
          overdue: options.overdue,
        });
        const emailBody = claimed
          .map(
            (task) =>
              `${task.taskType}: ${
                task.plant.nickname || task.plant.species.commonName
              } (due ${this.formatLocalDate(task.dueDate, timezone)})`,
          )
          .join('\n');

        const result = await this.deliverTaskChannel({
          channel,
          user,
          title: channel === NotificationChannel.EMAIL ? emailSubject : push.title,
          body: channel === NotificationChannel.EMAIL ? emailBody : push.body,
          overdue: options.overdue,
          route: push.route,
          taskCount: claimed.length,
        });
        const message =
          channel === NotificationChannel.EMAIL
            ? `${emailSubject}\n${emailBody}`
            : `${push.title}: ${push.body}`;
        await this.recordDeliveries({
          userId: user.id,
          channel,
          entities: claimed.map((task) => ({
            id: task.id,
            dedupeKey: `task:${task.id}:care`,
          })),
          relatedEntity: 'task',
          message,
          result,
        });
        if (result.status === 'SENT') {
          claimed.forEach((task) => sentTaskIds.add(task.id));
        }
      }

      if (sentTaskIds.size) {
        await this.prisma.task.updateMany({
          where: { id: { in: [...sentTaskIds] } },
          data: { notifiedAt: now },
        });
      }
      processedUsers += 1;
    }

    return processedUsers;
  }

  private taskReminderRows(
    tasks: Array<{
      taskType: string;
      plantId: string;
      dueDate: Date;
      plant: {
        nickname: string | null;
        species: { commonName: string };
      };
    }>,
  ): TaskReminderRow[] {
    return tasks.map((task) => ({
      taskType: task.taskType,
      plantId: task.plantId,
      dueDate: task.dueDate,
      plant: {
        nickname: task.plant.nickname,
        species: { commonName: task.plant.species.commonName },
      },
    }));
  }

  private async deliverTaskChannel(input: {
    channel: NotificationChannel;
    user: ReminderUser;
    title: string;
    body: string;
    overdue: boolean;
    route: string;
    taskCount: number;
  }): Promise<DeliveryResult> {
    const { channel, user } = input;
    if (channel === NotificationChannel.EMAIL) {
      if (!user.notifyEmail) {
        return this.skipped(
          'smtp',
          'PREFERENCE_DISABLED',
          'Email notifications are disabled.',
        );
      }
      return this.sendEmail(user.email, input.title, input.body);
    }

    if (channel === NotificationChannel.PUSH) {
      if (!user.notifyPush) {
        return this.skipped(
          'fcm',
          'PREFERENCE_DISABLED',
          'Push notifications are disabled.',
        );
      }
      return this.sendPush(user.id, input.title, input.body, {
        tag: input.overdue ? 'overdue' : 'due',
        route: input.route,
      });
    }

    if (!user.notifySms) {
      return this.skipped(
        'twilio',
        'PREFERENCE_DISABLED',
        'SMS notifications are disabled.',
      );
    }
    if (!this.isSmsEligible(user)) {
      return this.skipped(
        'twilio',
        'PLAN_NOT_ELIGIBLE',
        'SMS reminders require Premium.',
      );
    }
    const taskWord = input.taskCount === 1 ? 'plant needs' : 'plants need';
    const smsBody = `Dr. Plant: ${input.taskCount} ${taskWord} care${
      input.overdue ? ' (overdue)' : ' today'
    }. Open the app for details.`;
    return this.sendSms(user.id, user.phone, smsBody);
  }

  async registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { userId_token: { userId, token } },
      create: { userId, token, platform },
      update: { platform },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    const result = await this.prisma.deviceToken.deleteMany({
      where: { userId, token },
    });
    return { removed: result.count };
  }

  async notifyBuddy(
    userId: string,
    title: string,
    body: string,
    tag = 'buddy',
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || this.isQuietHours(user)) return;

    const dedupeKey = `buddy:${tag}:${getLocalDateKey(
      user.timezone || 'UTC',
    )}`;
    const existing = await this.prisma.notificationLog.findMany({
      where: { userId, dedupeKey },
      select: { channel: true, status: true },
    });
    const sentChannels = new Set(
      existing
        .filter((row) => row.status.toUpperCase() === 'SENT')
        .map((row) => row.channel),
    );
    const deliveries: Array<{
      channel: NotificationChannel;
      result: DeliveryResult;
    }> = [];
    const message = `[${tag}] ${title}: ${body}`;
    const claimChannel = async (channel: NotificationChannel) => {
      if (sentChannels.has(channel)) return false;
      const claimed = await this.claimDeliveries({
        userId,
        channel,
        entities: [{ id: tag, dedupeKey }],
        relatedEntity: 'buddy',
        message,
      });
      return claimed.has(tag);
    };
    if (await claimChannel(NotificationChannel.PUSH)) {
      deliveries.push({
        channel: NotificationChannel.PUSH,
        result: user.notifyPush
          ? await this.sendPush(userId, title, body, { tag })
          : this.skipped(
              'fcm',
              'PREFERENCE_DISABLED',
              'Push notifications are disabled.',
            ),
      });
    }
    if (await claimChannel(NotificationChannel.EMAIL)) {
      deliveries.push({
        channel: NotificationChannel.EMAIL,
        result: user.notifyEmail
          ? await this.sendEmail(user.email, title, body)
          : this.skipped(
              'smtp',
              'PREFERENCE_DISABLED',
              'Email notifications are disabled.',
            ),
      });
    }
    if (await claimChannel(NotificationChannel.SMS)) {
      deliveries.push({
        channel: NotificationChannel.SMS,
        result:
          user.notifySms && this.isSmsEligible(user)
            ? await this.sendSms(userId, user.phone, `${title}: ${body}`)
            : this.skipped(
                'twilio',
                user.notifySms ? 'PLAN_NOT_ELIGIBLE' : 'PREFERENCE_DISABLED',
                user.notifySms
                  ? 'SMS reminders require Premium.'
                  : 'SMS notifications are disabled.',
              ),
      });
    }

    for (const delivery of deliveries) {
      await this.recordDeliveries({
        userId,
        channel: delivery.channel,
        entities: [{ id: tag, dedupeKey }],
        relatedEntity: 'buddy',
        message,
        result: delivery.result,
      });
    }
  }

  async hasBuddyNudgeToday(userId: string, tag: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const timezone = user?.timezone || 'UTC';
    const today = getLocalDayStart(timezone, 0);
    const row = await this.prisma.notificationLog.findFirst({
      where: {
        userId,
        channel: NotificationChannel.PUSH,
        status: { in: ['SENT', 'sent'] },
        OR: [
          { dedupeKey: `buddy:${tag}:${getLocalDateKey(timezone)}` },
          {
            message: { contains: `[${tag}]` },
            createdAt: { gte: today },
          },
        ],
      },
    });
    return Boolean(row);
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
  ): Promise<DeliveryResult> {
    const result = await this.email.sendNotificationEmail(to, subject, text);
    if (result.success) return { status: 'SENT', provider: 'smtp' };
    if (result.skipped) {
      return {
        status: 'UNCONFIGURED',
        provider: 'smtp',
        errorCode: 'SMTP_NOT_CONFIGURED',
        errorMessage: result.error,
      };
    }
    return {
      status: 'FAILED',
      provider: 'smtp',
      errorCode: 'SMTP_SEND_FAILED',
      errorMessage: result.error,
    };
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    options: string | { tag?: string; route?: string } = 'push',
  ): Promise<DeliveryResult> {
    const tag =
      typeof options === 'string' ? options : options.tag ?? 'push';
    const route =
      typeof options === 'string'
        ? this.pushRouteForTag(options)
        : options.route ?? this.pushRouteForTag(tag);
    const rows = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!rows.length) {
      return this.skipped(
        'fcm',
        'NO_DEVICE_TOKEN',
        'No registered push device.',
      );
    }

    const transport = resolveFcmTransport((key) =>
      this.config.get<string>(key),
    );
    if (transport.mode === 'none') {
      return {
        status: 'UNCONFIGURED',
        provider: 'fcm',
        errorCode: 'FCM_NOT_CONFIGURED',
        errorMessage: 'Firebase delivery is not configured.',
      };
    }

    try {
      const result = await sendFcmNotification(
        transport,
        rows.map((row) => row.token),
        title,
        body,
        {
          route,
          plantId: route.startsWith('/garden/plants/')
            ? route.split('/').pop()!
            : '',
        },
      );
      if (result.invalidTokens.length) {
        await this.prisma.deviceToken.deleteMany({
          where: { userId, token: { in: result.invalidTokens } },
        });
      }
      if (result.sent > 0) {
        return {
          status: 'SENT',
          provider: `fcm-${transport.mode}`,
          ...(result.failed
            ? {
                errorCode: 'PARTIAL_FAILURE',
                errorMessage: `${result.failed} of ${rows.length} device deliveries failed.`,
              }
            : {}),
        };
      }
      return {
        status: 'FAILED',
        provider: `fcm-${transport.mode}`,
        errorCode: 'FCM_DELIVERY_FAILED',
        errorMessage: `No device accepted the notification (${result.failed} failed).`,
      };
    } catch (error) {
      this.logger.warn(`FCM failed for ${userId}: ${error}`);
      return {
        status: 'FAILED',
        provider: `fcm-${transport.mode}`,
        errorCode: 'FCM_REQUEST_FAILED',
        errorMessage: this.errorMessage(error),
      };
    }
  }

  private isSmsEligible(user: { planTier: PlanTier }): boolean {
    return (
      effectivePlanTier(this.config, user.planTier) === PlanTier.PREMIUM
    );
  }

  private async sendSms(
    userId: string,
    phone: string | null | undefined,
    body: string,
  ): Promise<DeliveryResult> {
    if (!phone) {
      return this.skipped(
        'twilio',
        'NO_PHONE',
        'No phone number is saved.',
      );
    }
    const transport = resolveSmsTransport((key) =>
      this.config.get<string>(key),
    );
    if (transport.mode === 'none') {
      return {
        status: 'UNCONFIGURED',
        provider: 'twilio',
        errorCode: 'TWILIO_NOT_CONFIGURED',
        errorMessage: 'Twilio delivery is not configured.',
      };
    }

    try {
      const result = await sendSmsNotification(transport, phone, body);
      if (result.sent) return { status: 'SENT', provider: 'twilio' };
      return {
        status: 'FAILED',
        provider: 'twilio',
        errorCode: String(result.errorCode ?? 'TWILIO_SEND_FAILED'),
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      this.logger.warn(`Twilio SMS threw for ${userId}: ${error}`);
      return {
        status: 'FAILED',
        provider: 'twilio',
        errorCode: 'TWILIO_REQUEST_FAILED',
        errorMessage: this.errorMessage(error),
      };
    }
  }

  private async recordDeliveries(input: {
    userId: string;
    channel: NotificationChannel;
    entities: Array<{ id: string; dedupeKey: string }>;
    relatedEntity: string;
    message: string;
    result: DeliveryResult;
  }) {
    const attemptedAt = new Date();
    await this.prisma.$transaction(
      input.entities.map((entity) =>
        this.prisma.notificationLog.upsert({
          where: {
            userId_channel_dedupeKey: {
              userId: input.userId,
              channel: input.channel,
              dedupeKey: entity.dedupeKey,
            },
          },
          create: {
            userId: input.userId,
            channel: input.channel,
            dedupeKey: entity.dedupeKey,
            relatedEntity: input.relatedEntity,
            relatedId: entity.id,
            message: input.message,
            status: input.result.status,
            provider: input.result.provider,
            errorCode: input.result.errorCode,
            errorMessage: input.result.errorMessage,
            attemptedAt,
          },
          update: {
            message: input.message,
            status: input.result.status,
            provider: input.result.provider,
            errorCode: input.result.errorCode ?? null,
            errorMessage: input.result.errorMessage ?? null,
            attemptedAt,
          },
        }),
      ),
    );
  }

  private async claimDeliveries(input: {
    userId: string;
    channel: NotificationChannel;
    entities: Array<{ id: string; dedupeKey: string }>;
    relatedEntity: string;
    message: string;
  }): Promise<Set<string>> {
    const claimed = new Set<string>();
    for (const entity of input.entities) {
      const attemptedAt = new Date();
      const data = {
        userId: input.userId,
        channel: input.channel,
        dedupeKey: entity.dedupeKey,
        relatedEntity: input.relatedEntity,
        relatedId: entity.id,
        message: input.message,
        status: 'ATTEMPTING',
        attemptedAt,
      };
      try {
        await this.prisma.notificationLog.create({ data });
        claimed.add(entity.id);
        continue;
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) throw error;
      }

      const existing = await this.prisma.notificationLog.findUnique({
        where: {
          userId_channel_dedupeKey: {
            userId: input.userId,
            channel: input.channel,
            dedupeKey: entity.dedupeKey,
          },
        },
        select: {
          id: true,
          status: true,
          attemptedAt: true,
        },
      });
      if (!existing || existing.status.toUpperCase() === 'SENT') continue;
      if (
        existing.status.toUpperCase() === 'ATTEMPTING' &&
        attemptedAt.getTime() - existing.attemptedAt.getTime() <
          DELIVERY_CLAIM_TTL_MS
      ) {
        continue;
      }

      const result = await this.prisma.notificationLog.updateMany({
        where: {
          id: existing.id,
          status: existing.status,
          attemptedAt: existing.attemptedAt,
        },
        data: {
          ...data,
          errorCode: null,
          errorMessage: null,
          provider: null,
        },
      });
      if (result.count === 1) claimed.add(entity.id);
    }
    return claimed;
  }

  private skipped(
    provider: string,
    errorCode: string,
    errorMessage: string,
  ): DeliveryResult {
    return { status: 'SKIPPED', provider, errorCode, errorMessage };
  }

  private formatLocalDate(value: Date, timezone: string): string {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(value);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private pushRouteForTag(tag: string): string {
    switch (tag) {
      case 'buddy':
        return '/garden/buddy/journey';
      case 'mood':
        return '/garden/buddy';
      case 'overdue':
      case 'due':
        return '/garden/tasks';
      default:
        return '/garden/tasks';
    }
  }
}
