import { Module } from '@nestjs/common';
import { BuddyController } from './buddy.controller';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { BuddySchedulerService } from './buddy-scheduler.service';
import { BuddyShopService } from './buddy-shop.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BuddyController],
  providers: [BuddyService, BuddyJourneyService, BuddySchedulerService, BuddyShopService],
  exports: [BuddyService],
})
export class BuddyModule {}
