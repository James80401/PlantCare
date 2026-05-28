import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminRegistrationsService } from './admin-registrations.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/registrations')
export class AdminRegistrationsController {
  constructor(private registrations: AdminRegistrationsService) {}

  @Get('pending')
  listPending() {
    return this.registrations.listPending();
  }

  @Post(':userId/approve')
  approve(@Param('userId') userId: string) {
    return this.registrations.approve(userId);
  }

  @Post(':userId/reject')
  reject(@Param('userId') userId: string) {
    return this.registrations.reject(userId);
  }
}
