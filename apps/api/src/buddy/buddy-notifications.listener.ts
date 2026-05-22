import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BuddyMood } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JourneyCompletedEvent } from './events/journey-completed.event';
import { SunshineSentEvent } from './events/sunshine-sent.event';

@Injectable()
export class BuddyNotificationsListener {
  private readonly logger = new Logger(BuddyNotificationsListener.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @OnEvent('journey.completed')
  async onJourneyCompleted(event: JourneyCompletedEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;
    await this.notifications.notifyBuddy(
      event.userId,
      `${buddy.name} is back!`,
      'Your grow journey finished — open Plant Buddy to see what they discovered.',
    );
  }

  @OnEvent('sunshine.sent')
  async onSunshineReceived(event: SunshineSentEvent) {
    if (!event.toUserId) return;
    const senderBuddy = await this.prisma.buddy.findUnique({
      where: { id: event.fromBuddyId },
      select: { name: true },
    });
    const name = senderBuddy?.name ?? 'A garden friend';
    await this.notifications.notifyBuddy(
      event.toUserId,
      'Sunshine received ☀️',
      `${name}'s buddy sent you sunshine — +3 dewdrops in Garden Town.`,
    );
  }

  /** Called from buddy scheduler for buddies that missed care. */
  async sendMoodNudges() {
    const buddies = await this.prisma.buddy.findMany({
      where: { mood: { in: [BuddyMood.WILTING, BuddyMood.DORMANT, BuddyMood.THIRSTY] } },
      select: { id: true, userId: true, name: true, mood: true },
      take: 100,
    });

    for (const buddy of buddies) {
      const already = await this.notifications.hasBuddyNudgeToday(buddy.userId, 'mood');
      if (already) continue;

      const title =
        buddy.mood === BuddyMood.DORMANT
          ? `${buddy.name} is resting`
          : `${buddy.name} misses you`;
      const body =
        buddy.mood === BuddyMood.DORMANT
          ? 'A quick check-in will wake your buddy up — complete a care task today.'
          : 'Complete a plant task to cheer up your buddy and fill their sunlight bar.';

      await this.notifications.notifyBuddy(buddy.userId, title, body, 'mood');
    }

    this.logger.log(`Mood nudges processed for ${buddies.length} buddies`);
  }
}
