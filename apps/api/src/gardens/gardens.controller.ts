import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateGardenDto } from './dto/create-garden.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { SharePlantDto } from './dto/share-plant.dto';
import { GardensService } from './gardens.service';

@ApiTags('gardens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gardens')
export class GardensController {
  constructor(private gardens: GardensService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateGardenDto) {
    return this.gardens.create(user.sub, dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: JwtPayload) {
    return this.gardens.findMine(user.sub);
  }

  @Get('summaries')
  summaries(@CurrentUser() user: JwtPayload) {
    return this.gardens.getSummaries(user.sub);
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') gardenId: string) {
    return this.gardens.getDetail(user.sub, gardenId);
  }

  @Post('invites/accept')
  acceptInvite(@CurrentUser() user: JwtPayload, @Body() dto: AcceptInviteDto) {
    return this.gardens.acceptInvite(user.sub, dto);
  }

  @Post(':id/invites')
  createInvite(
    @CurrentUser() user: JwtPayload,
    @Param('id') gardenId: string,
    @Body() dto: CreateInviteDto,
  ) {
    return this.gardens.createInvite(user.sub, gardenId, dto);
  }

  @Post(':id/plants')
  sharePlant(
    @CurrentUser() user: JwtPayload,
    @Param('id') gardenId: string,
    @Body() dto: SharePlantDto,
  ) {
    return this.gardens.sharePlant(user.sub, gardenId, dto);
  }

  @Get(':id/invites')
  invites(@CurrentUser() user: JwtPayload, @Param('id') gardenId: string) {
    return this.gardens.getInvites(user.sub, gardenId);
  }

  @Delete(':id/members/:memberUserId')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') gardenId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.gardens.removeMember(user.sub, gardenId, memberUserId);
  }

  @Get(':id/activity')
  activity(@CurrentUser() user: JwtPayload, @Param('id') gardenId: string) {
    return this.gardens.getActivity(user.sub, gardenId);
  }
}
