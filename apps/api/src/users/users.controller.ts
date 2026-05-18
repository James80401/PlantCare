import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me/notification-settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      notifyPush?: boolean;
      notifyEmail?: boolean;
      notifySms?: boolean;
      quietHoursStart?: number | null;
      quietHoursEnd?: number | null;
      timezone?: string;
      latitude?: number;
      longitude?: number;
      locationLabel?: string | null;
      locationQuery?: string;
    },
  ) {
    return this.usersService.updateNotificationSettings(user.sub, body);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }
}
