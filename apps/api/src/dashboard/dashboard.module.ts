import { Module } from '@nestjs/common';
import { PlantMilestonesModule } from '../milestones/plant-milestones.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { WeatherModule } from '../weather/weather.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [SchedulerModule, WeatherModule, PlantMilestonesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
