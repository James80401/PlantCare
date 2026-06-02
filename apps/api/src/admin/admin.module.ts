import { Module } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminAuditService } from './admin-audit.service';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminRegistrationsService } from './admin-registrations.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminRegistrationsController, AdminAuditController],
  providers: [AdminRegistrationsService, AdminAuditService, AdminAuditInterceptor, AdminGuard],
})
export class AdminModule {}
