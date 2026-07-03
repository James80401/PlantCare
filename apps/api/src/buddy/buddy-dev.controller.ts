import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DevOnlyGuard } from '../common/guards/dev-only.guard';
import { BuddyEnabledGuard } from '../common/guards/buddy-enabled.guard';
import { BuddyNotificationsListener } from './buddy-notifications.listener';
import { BuddySchedulerService } from './buddy-scheduler.service';

@ApiTags('buddy-dev')
@ApiBearerAuth()
@Controller('buddy/dev')
@UseGuards(JwtAuthGuard, DevOnlyGuard, BuddyEnabledGuard)
export class BuddyDevController {
  constructor(
    private scheduler: BuddySchedulerService,
    private buddyNotifications: BuddyNotificationsListener,
  ) {}

  @Post('scheduler/complete-journeys')
  @ApiOperation({ summary: 'Dev only — run journey auto-complete cron once' })
  async completeJourneys() {
    await this.scheduler.completeFinishedJourneys();
    return { ok: true, job: 'completeFinishedJourneys' };
  }

  @Post('scheduler/reset-daily-sunlight')
  @ApiOperation({ summary: 'Dev only — run daily sunlight reset cron once' })
  async resetDailySunlight() {
    await this.scheduler.resetDailySunlight();
    return { ok: true, job: 'resetDailySunlight' };
  }

  @Post('scheduler/mood-nudges')
  @ApiOperation({ summary: 'Dev only — send mood nudge push/email once' })
  async moodNudges() {
    await this.buddyNotifications.sendMoodNudges();
    return { ok: true, job: 'sendMoodNudges' };
  }
}
