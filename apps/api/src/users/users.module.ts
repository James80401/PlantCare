import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UploadModule } from '../upload/upload.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [UploadModule, WeatherModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
