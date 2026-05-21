import { Module } from '@nestjs/common';
import { BuddyController } from './buddy.controller';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { BuddySchedulerService } from './buddy-scheduler.service';
import { BuddyShopService } from './buddy-shop.service';
import { BuddyActivityService } from './buddy-activity.service';
import { BuddyQuestService } from './buddy-quest.service';
import { BuddySocialService } from './buddy-social.service';
import { BuddySocialController } from './buddy-social.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WeatherModule } from '../weather/weather.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, WeatherModule, TasksModule],
  controllers: [BuddyController],
  providers: [
    BuddyService,
    BuddyJourneyService,
    BuddySchedulerService,
    BuddyShopService,
    BuddyActivityService,
    BuddyQuestService,
    BuddySocialService,
  ],
  exports: [BuddyService],
})
export class BuddyModule {}
