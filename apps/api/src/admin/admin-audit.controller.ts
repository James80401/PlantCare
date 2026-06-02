import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminAuditService } from './admin-audit.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin/audit')
export class AdminAuditController {
  constructor(private audit: AdminAuditService) {}

  @Get()
  list(@Query('limit') limit?: string) {
    const parsed = limit ? Number.parseInt(limit, 10) : 100;
    return this.audit.listRecent(Number.isFinite(parsed) ? parsed : 100);
  }

  @Get('summary')
  summary() {
    return this.audit.summary();
  }
}
