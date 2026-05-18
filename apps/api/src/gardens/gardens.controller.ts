import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
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

  @Get(':id/activity')
  activity(@CurrentUser() user: JwtPayload, @Param('id') gardenId: string) {
    return this.gardens.getActivity(user.sub, gardenId);
  }
}
