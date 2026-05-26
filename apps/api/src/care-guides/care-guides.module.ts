import { Module } from '@nestjs/common';
import { CareGuidesService } from './care-guides.service';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [WeatherModule],
  providers: [CareGuidesService],
  exports: [CareGuidesService],
})
export class CareGuidesModule {}
