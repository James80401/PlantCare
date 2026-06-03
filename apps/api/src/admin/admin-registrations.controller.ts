import { Controller, Get, Param, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminGuard } from './admin.guard';
import { AdminRegistrationsService } from './admin-registrations.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin/registrations')
export class AdminRegistrationsController {
  constructor(private registrations: AdminRegistrationsService) {}

  @Get('pending')
  listPending() {
    return this.registrations.listPending();
  }

  @Get('users')
  listUsers() {
    return this.registrations.listUsers();
  }

  @Post(':userId/approve')
  approve(@Param('userId') userId: string) {
    return this.registrations.approve(userId);
  }

  @Post(':userId/reject')
  reject(@Param('userId') userId: string) {
    return this.registrations.reject(userId);
  }

  @Post(':userId/disable')
  disable(@Param('userId') userId: string) {
    return this.registrations.disable(userId);
  }

  @Post(':userId/ai/unpause')
  unpauseAi(@Param('userId') userId: string) {
    return this.registrations.unpauseAi(userId);
  }
}
