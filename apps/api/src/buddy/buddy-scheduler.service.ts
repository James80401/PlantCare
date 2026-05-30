import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { BuddyNotificationsListener } from './buddy-notifications.listener';

@Injectable()
export class BuddySchedulerService {
  private readonly logger = new Logger(BuddySchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private buddyService: BuddyService,
    private journeyService: BuddyJourneyService,
    private buddyNotifications: BuddyNotificationsListener,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailySunlight() {
    const buddies = await this.prisma.buddy.findMany({ select: { id: true } });
    for (const { id } of buddies) {
      await this.buddyService.resetDailyIfNeeded(id);
    }
    this.logger.log(`Buddy daily reset checked for ${buddies.length} buddies`);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async completeFinishedJourneys() {
    const due = await this.prisma.buddyJourney.findMany({
      where: { completed: false, endsAt: { lte: new Date() } },
      include: { buddy: { select: { userId: true } } },
      take: 50,
    });

    for (const row of due) {
      try {
        await this.journeyService.completeJourney(row.buddy.userId, row.id);
      } catch (err) {
        this.logger.warn(`Journey auto-complete failed ${row.id}: ${err}`);
      }
    }
  }

  @Cron('0 10 * * *')
  async sendBuddyMoodNudges() {
    await this.buddyNotifications.sendMoodNudges();
  }
}
