import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(private notifications: NotificationsService) {}

  /** Runs every hour so each user's reminders fire at their own chosen
   *  reminderHour (default 9am) instead of a single fixed time for everyone. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDailyReminders() {
    this.logger.log('Running hourly task reminder sweep');
    await this.notifications.sendDueTaskReminders();
    await this.notifications.sendOverdueTaskReminders();
    await this.notifications.sendRecommendationReminders();
  }
}
