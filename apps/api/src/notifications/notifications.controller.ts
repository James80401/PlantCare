import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devices')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Post()
  register(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string; platform: string },
  ) {
    return this.notifications.registerDevice(user.sub, body.token, body.platform);
  }

  @Delete()
  unregister(@CurrentUser() user: JwtPayload, @Body() body: { token: string }) {
    return this.notifications.unregisterDevice(user.sub, body.token);
  }
}
