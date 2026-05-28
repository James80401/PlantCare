import { Module } from '@nestjs/common';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminRegistrationsService } from './admin-registrations.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminRegistrationsController],
  providers: [AdminRegistrationsService, AdminGuard],
})
export class AdminModule {}
