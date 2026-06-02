import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminGuard } from './admin.guard';
import { AdminObservabilityService } from './admin-observability.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin/observability')
export class AdminObservabilityController {
  constructor(private observability: AdminObservabilityService) {}

  @Get()
  overview() {
    return this.observability.overview();
  }
}
