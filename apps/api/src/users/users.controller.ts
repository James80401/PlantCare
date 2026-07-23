import { Body, Controller, Delete, Get, Put, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { clearRefreshCookie } from '../auth/refresh-cookie';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { UpdateCarePreferencesDto } from './dto/update-care-preferences.dto';
import { UsersService } from './users.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.sub);
  }

  @Put('me/care-preferences')
  updateCarePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() body: UpdateCarePreferencesDto,
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
  async deleteAccount(
    @CurrentUser() user: JwtPayload,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.deleteAccount(user.sub, dto.password);
    clearRefreshCookie(response, this.config);
    return result;
  }
}
