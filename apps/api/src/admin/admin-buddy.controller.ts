import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuddyEnabledGuard } from '../common/guards/buddy-enabled.guard';
import { AdminAuditInterceptor } from './admin-audit.interceptor';
import { AdminGuard } from './admin.guard';
import { AdminBuddyService } from './admin-buddy.service';
import { AdminBuddyLevelDto } from './dto/admin-buddy-level.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard, BuddyEnabledGuard)
@UseInterceptors(AdminAuditInterceptor)
@Controller('admin/buddy')
export class AdminBuddyController {
  constructor(private buddy: AdminBuddyService) {}

  @Get()
  overview() {
    return this.buddy.overview();
  }

  @Patch(':buddyId/level')
  setLevel(@Param('buddyId') buddyId: string, @Body() dto: AdminBuddyLevelDto) {
    return this.buddy.setLevel(buddyId, dto.level);
  }

  @Post(':buddyId/items/:itemId')
  unlockItem(@Param('buddyId') buddyId: string, @Param('itemId') itemId: string) {
    return this.buddy.unlockItem(buddyId, itemId);
  }

  @Delete(':buddyId/items/:itemId')
  lockItem(@Param('buddyId') buddyId: string, @Param('itemId') itemId: string) {
    return this.buddy.lockItem(buddyId, itemId);
  }
}
