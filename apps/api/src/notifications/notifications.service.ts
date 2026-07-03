import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  PlanTier,
  RecommendationPriority,
  RecommendationStatus,
  TaskStatus,
} from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { effectivePlanTier } from '../config/premium-policy';
import { resolveFcmTransport, sendFcmNotification } from './fcm.client';
import { resolveSmsTransport, sendSmsNotification } from './sms.client';
import { buildCareReminderPush, type TaskReminderRow } from './task-reminder-copy';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  isQuietHours(user: { quietHoursStart: number | null; quietHoursEnd: number | null }): boolean {
    if (user.quietHoursStart == null || user.quietHoursEnd == null) return false;
    const hour = new Date().getHours();
    if (user.quietHoursStart <= user.quietHoursEnd) {
      return hour >= user.quietHoursStart && hour < user.quietHoursEnd;
    }
    return hour >= user.quietHoursStart || hour < user.quietHoursEnd;
  }

  async sendDueTaskReminders() {
    const count = await this.sendTaskRemindersForWindow({ overdue: false });
    this.logger.log(`Processed due-today reminders for ${count} users`);
  }

  async sendOverdueTaskReminders() {
    const count = await this.sendTaskRemindersForWindow({ overdue: true });
    this.logger.log(`Processed overdue reminders for ${count} users`);
  }

  /** Push-only nudge for active recommendations (e.g. routine plant check-ins) — these
   *  are softer "worth a look" suggestions, not overdue-care urgency, so unlike tasks
   *  they don't escalate to email/SMS. Scoped to HIGH/MEDIUM priority so this restores
   *  reminders for what used to be task-backed check-ins without newly notifying about
   *  low-priority nudges (soil flush, harvest timing) that were never reminded before. */
  async sendRecommendationReminders() {
    const now = new Date();
    const recommendations = await this.prisma.recommendation.findMany({
      where: {
        status: RecommendationStatus.ACTIVE,
        notifiedAt: null,
        priority: { in: [RecommendationPriority.HIGH, RecommendationPriority.MEDIUM] },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
      include: { user: true },
      orderBy: { priority: 'desc' },
    });

    const byUser = new Map<string, typeof recommendations>();
    for (const rec of recommendations) {
      if (!byUser.has(rec.userId)) byUser.set(rec.userId, []);
      byUser.get(rec.userId)!.push(rec);
    }

    for (const [userId, userRecs] of byUser) {
      const user = userRecs[0].user;
      if (this.isQuietHours(user)) continue;

      if (user.notifyPush) {
        const { title, body } = this.buildRecommendationPush(userRecs);
        await this.sendPush(userId, title, body, { tag: 'recommendation', route: '/garden' });
      }

      await this.prisma.recommendation.updateMany({
        where: { id: { in: userRecs.map((r) => r.id) } },
        data: { notifiedAt: now },
      });
    }

    this.logger.log(`Processed recommendation reminders for ${byUser.size} users`);
  }

  private buildRecommendationPush(recs: { title: string }[]): { title: string; body: string } {
    if (recs.length === 1) {
      return { title: 'Plant recommendation', body: recs[0].title };
    }
    const lines = recs.slice(0, 3).map((r) => r.title);
    const extra = recs.length > 3 ? ` +${recs.length - 3} more` : '';
    return {
      title: `${recs.length} plant recommendations`,
      body: `${lines.join(', ')}${extra}`,
    };
  }

  private async sendTaskRemindersForWindow(options: { overdue: boolean }): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const tasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        notifiedAt: null,
        dueDate: options.overdue ? { lt: today } : { gte: today, lt: tomorrow },
      },
      include: {
        plant: { include: { species: true, user: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const byUser = new Map<string, typeof tasks>();
    for (const task of tasks) {
      const userId = task.plant.userId;
      if (!byUser.has(userId)) byUser.set(userId, []);
      byUser.get(userId)!.push(task);
    }

    for (const [userId, userTasks] of byUser) {
      const user = userTasks[0].plant.user;
      if (this.isQuietHours(user)) continue;

      const rows: TaskReminderRow[] = userTasks.map((t) => ({
        taskType: t.taskType,
        plantId: t.plantId,
        dueDate: t.dueDate,
        plant: {
          nickname: t.plant.nickname,
          species: { commonName: t.plant.species.commonName },
        },
      }));
      const push = buildCareReminderPush(rows, { overdue: options.overdue });
      const emailSubject = options.overdue ? 'Overdue plant care' : 'Plant care due today';
      const emailBody = userTasks
        .map(
          (t) =>
            `${t.taskType}: ${t.plant.nickname || t.plant.species.commonName} (due ${t.dueDate.toLocaleDateString()})`,
        )
        .join('\n');

      if (user.notifyEmail) {
        await this.sendEmail(user.email, emailSubject, emailBody);
        await this.log(userId, NotificationChannel.EMAIL, `${emailSubject}\n${emailBody}`);
      }

      if (user.notifyPush) {
        await this.sendPush(userId, push.title, push.body, {
          tag: options.overdue ? 'overdue' : 'due',
          route: push.route,
        });
      }

      if (user.notifySms && this.isSmsEligible(user)) {
        const taskWord = userTasks.length === 1 ? 'plant needs' : 'plants need';
        const smsBody = `PlantCare: ${userTasks.length} ${taskWord} care${options.overdue ? ' (overdue)' : ' today'}. Open the app for details.`;
        await this.sendSms(userId, user.phone, smsBody, options.overdue ? 'overdue' : 'due');
      }

      await this.prisma.task.updateMany({
        where: { id: { in: userTasks.map((t) => t.id) } },
        data: { notifiedAt: new Date() },
      });
    }

    return byUser.size;
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

  private async sendEmail(to: string, subject: string, text: string) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    const from = this.config.get<string>('SENDGRID_FROM_EMAIL', 'noreply@plantcare.app');
    if (!apiKey) {
      this.logger.log(`[email mock] To: ${to} - ${subject}: ${text}`);
      return;
    }
    try {
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from },
          subject,
          content: [{ type: 'text/plain', value: text }],
        },
        { headers: { Authorization: `Bearer ${apiKey}` } },
      );
    } catch (err) {
      this.logger.warn(`SendGrid failed: ${err}`);
    }
  }

  async notifyBuddy(userId: string, title: string, body: string, tag = 'buddy') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (this.isQuietHours(user)) return;

    if (user.notifyPush) {
      await this.sendPush(userId, title, body, { tag });
    }
    if (user.notifyEmail) {
      await this.sendEmail(user.email, title, body);
      await this.log(userId, NotificationChannel.EMAIL, `[${tag}] ${title}: ${body}`);
    }
    if (user.notifySms && this.isSmsEligible(user)) {
      await this.sendSms(userId, user.phone, `${title}: ${body}`, tag);
    }
  }

  async hasBuddyNudgeToday(userId: string, tag: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const row = await this.prisma.notificationLog.findFirst({
      where: {
        userId,
        channel: NotificationChannel.PUSH,
        message: { contains: `[${tag}]` },
        createdAt: { gte: today },
      },
    });
    return Boolean(row);
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    options: string | { tag?: string; route?: string } = 'push',
  ) {
    const tag = typeof options === 'string' ? options : (options.tag ?? 'push');
    const route =
      typeof options === 'string'
        ? this.pushRouteForTag(options)
        : (options.route ?? this.pushRouteForTag(tag));

    const rows = await this.prisma.deviceToken.findMany({ where: { userId } });
    const message = `${title}: ${body}`;
    const logTag = `[${tag}] ${message}`;

    if (!rows.length) {
      this.logger.log(`[push mock] ${userId}: ${message}`);
      await this.log(userId, NotificationChannel.PUSH, logTag);
      return;
    }

    const transport = resolveFcmTransport((key) => this.config.get<string>(key));
    if (transport.mode === 'none') {
      this.logger.log(`[push mock] ${userId} (${rows.length} devices): ${message}`);
      await this.log(userId, NotificationChannel.PUSH, logTag);
      return;
    }

    try {
      const result = await sendFcmNotification(
        transport,
        rows.map((r) => r.token),
        title,
        body,
        { route, plantId: route.startsWith('/garden/plants/') ? route.split('/').pop()! : '' },
      );
      if (result.invalidTokens.length) {
        await this.prisma.deviceToken.deleteMany({
          where: { userId, token: { in: result.invalidTokens } },
        });
        this.logger.warn(
          `Removed ${result.invalidTokens.length} invalid FCM token(s) for user ${userId}`,
        );
      }
      this.logger.log(
        `FCM ${transport.mode} sent ${result.sent}/${rows.length} to user ${userId} (${result.failed} failed)`,
      );
      await this.log(userId, NotificationChannel.PUSH, logTag);
    } catch (err) {
      this.logger.warn(`FCM failed for ${userId}: ${err}`);
      await this.log(userId, NotificationChannel.PUSH, `${logTag} (FCM error)`);
    }
  }

  /** SMS is a premium perk (matches the "SMS (Premium)" Settings label) — gated
   *  server-side, not just hidden in the UI, so API clients can't bypass it. */
  private isSmsEligible(user: { planTier: PlanTier }): boolean {
    return effectivePlanTier(this.config, user.planTier) === PlanTier.PREMIUM;
  }

  private async sendSms(userId: string, phone: string | null | undefined, body: string, tag = 'sms') {
    const logTag = `[${tag}] ${body}`;

    if (!phone) {
      this.logger.log(`[sms mock] ${userId}: no phone number on file`);
      await this.log(userId, NotificationChannel.SMS, logTag);
      return;
    }

    const transport = resolveSmsTransport((key) => this.config.get<string>(key));
    if (transport.mode === 'none') {
      this.logger.log(`[sms mock] ${userId} (${phone}): ${body}`);
      await this.log(userId, NotificationChannel.SMS, logTag);
      return;
    }

    try {
      const result = await sendSmsNotification(transport, phone, body);
      if (result.sent) {
        this.logger.log(`Twilio SMS sent to user ${userId}`);
        await this.log(userId, NotificationChannel.SMS, logTag);
      } else {
        this.logger.warn(
          `Twilio SMS failed for ${userId}: ${result.errorCode ?? ''} ${result.errorMessage ?? ''}`,
        );
        await this.log(userId, NotificationChannel.SMS, `${logTag} (SMS error)`);
      }
    } catch (err) {
      this.logger.warn(`Twilio SMS threw for ${userId}: ${err}`);
      await this.log(userId, NotificationChannel.SMS, `${logTag} (SMS error)`);
    }
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

  private async log(userId: string, channel: NotificationChannel, message: string) {
    await this.prisma.notificationLog.create({
      data: { userId, channel, message },
    });
  }
}
