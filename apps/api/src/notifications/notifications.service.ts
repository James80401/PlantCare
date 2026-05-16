import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel, TaskStatus } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

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

  private async sendPush(userId: string, title: string, body: string) {
    const tokens = await this.prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) {
      this.logger.log(`[push mock] ${userId}: ${title} - ${body}`);
      return;
    }
    this.logger.log(`[push] Would send to ${tokens.length} devices: ${title}`);
    await this.log(userId, NotificationChannel.PUSH, `${title}: ${body}`);
  }

  private async log(userId: string, channel: NotificationChannel, message: string) {
    await this.prisma.notificationLog.create({
      data: { userId, channel, message },
    });
  }
}
