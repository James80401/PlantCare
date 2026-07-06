import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
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

  @Put('me/care-preferences')
  updateCarePreferences(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      experienceLevel?: string;
      defaultLightLevel?: string;
    },
  ) {
    return this.usersService.updateCarePreferences(user.sub, body);
  }

  @Put('me/notification-settings')
  updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(user.sub, body);
  }

  @Get('me/export')
  exportData(@CurrentUser() user: JwtPayload) {
    return this.usersService.exportData(user.sub);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }
}
