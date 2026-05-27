import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, TaskStatus } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { resolveFcmTransport, sendFcmNotification } from './fcm.client';

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 2);

    const tasks = await this.prisma.task.findMany({
      where: {
        status: TaskStatus.PENDING,
        dueDate: { gte: today, lt: tomorrow },
        notifiedAt: null,
      },
      include: {
        plant: { include: { species: true, user: true } },
      },
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

      const lines = userTasks.map(
        (t) =>
          `${t.taskType}: ${t.plant.nickname || t.plant.species.commonName} (due ${t.dueDate.toLocaleDateString()})`,
      );
      const message = `Plant care reminders:\n${lines.join('\n')}`;

      if (user.notifyEmail) {
        await this.sendEmail(user.email, 'Plant Care Reminders', message);
        await this.log(userId, NotificationChannel.EMAIL, message);
      }

      if (user.notifyPush) {
        await this.sendPush(userId, 'Plant Care', lines[0]);
      }

      await this.prisma.task.updateMany({
        where: { id: { in: userTasks.map((t) => t.id) } },
        data: { notifiedAt: new Date() },
      });
    }

    this.logger.log(`Processed reminders for ${byUser.size} users`);
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
      await this.sendPush(userId, title, body, tag);
    }
    if (user.notifyEmail) {
      await this.sendEmail(user.email, title, body);
      await this.log(userId, NotificationChannel.EMAIL, `[${tag}] ${title}: ${body}`);
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

  private async sendPush(userId: string, title: string, body: string, tag = 'push') {
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
        { route: this.pushRouteForTag(tag) },
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

  private pushRouteForTag(tag: string): string {
    switch (tag) {
      case 'buddy':
        return '/garden/buddy/journey';
      case 'mood':
        return '/garden/buddy';
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
