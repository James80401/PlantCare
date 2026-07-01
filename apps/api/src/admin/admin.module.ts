import { Module } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminAuditService } from './admin-audit.service';
import { AdminBuddyController } from './admin-buddy.controller';
import { AdminBuddyService } from './admin-buddy.service';
import { AdminObservabilityController } from './admin-observability.controller';
import { AdminObservabilityService } from './admin-observability.service';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminRegistrationsService } from './admin-registrations.service';
import { AdminSpeciesController } from './admin-species.controller';
import { AdminSpeciesService } from './admin-species.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [
    AdminRegistrationsController,
    AdminAuditController,
    AdminObservabilityController,
    AdminBuddyController,
    AdminSpeciesController,
  ],
  providers: [
    AdminRegistrationsService,
    AdminAuditService,
    AdminBuddyService,
    AdminObservabilityService,
    AdminSpeciesService,
    AdminAuditInterceptor,
    AdminGuard,
  ],
})
export class AdminModule {}
