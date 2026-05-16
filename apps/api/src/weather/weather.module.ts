import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [SchedulerModule],
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
