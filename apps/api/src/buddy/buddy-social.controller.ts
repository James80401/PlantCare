import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuddyEnabledGuard } from '../common/guards/buddy-enabled.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { BuddySocialService } from './buddy-social.service';
import { AddFriendDto } from './dto/add-friend.dto';

@ApiTags('buddy-social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BuddyEnabledGuard)
@Controller('buddy/social')
export class BuddySocialController {
  constructor(private social: BuddySocialService) {}

  @Get('friends')
  listFriends(@CurrentUser() user: JwtPayload) {
    return this.social.listFriends(user.sub);
  }

  @Post('friends/add')
  addFriend(@CurrentUser() user: JwtPayload, @Body() dto: AddFriendDto) {
    return this.social.addFriend(user.sub, dto);
  }

  @Delete('friends/:friendBuddyId')
  removeFriend(
    @CurrentUser() user: JwtPayload,
    @Param('friendBuddyId') friendBuddyId: string,
  ) {
    return this.social.removeFriend(user.sub, friendBuddyId);
  }

  @Post('sunshine/:friendBuddyId')
  sendSunshine(
    @CurrentUser() user: JwtPayload,
    @Param('friendBuddyId') friendBuddyId: string,
  ) {
    return this.social.sendSunshine(user.sub, friendBuddyId);
  }

  @Get('sunshine/today')
  sunshineToday(@CurrentUser() user: JwtPayload) {
    return this.social.sunshineToday(user.sub);
  }

  @Get('friends/:friendBuddyId/terrarium')
  viewTerrarium(
    @CurrentUser() user: JwtPayload,
    @Param('friendBuddyId') friendBuddyId: string,
  ) {
    return this.social.viewTerrarium(user.sub, friendBuddyId);
  }

  @Get('feed')
  activityFeed(@CurrentUser() user: JwtPayload) {
    return this.social.activityFeed(user.sub);
  }
}
