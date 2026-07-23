import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadModule } from '../upload/upload.module';
import { WeatherModule } from '../weather/weather.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [UploadModule, WeatherModule, BillingModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
