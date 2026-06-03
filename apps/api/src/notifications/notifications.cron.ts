import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(private notifications: NotificationsService) {}

  @Cron('0 9 * * *')
  async handleDailyReminders() {
    this.logger.log('Running daily task reminders');
    await this.notifications.sendDueTaskReminders();
    await this.notifications.sendOverdueTaskReminders();
  }
}
