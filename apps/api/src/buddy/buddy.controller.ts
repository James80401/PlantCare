import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { CreateBuddyDto } from './dto/create-buddy.dto';
import { UpdateBuddyDto } from './dto/update-buddy.dto';
import { StartJourneyDto } from './dto/start-journey.dto';
import { JourneyRespondDto } from './dto/journey-respond.dto';

@ApiTags('buddy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('buddy')
export class BuddyController {
  constructor(
    private buddyService: BuddyService,
    private journeyService: BuddyJourneyService,
  ) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBuddyDto) {
    return this.buddyService.create(user.sub, dto);
  }

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.buddyService.findByUserId(user.sub);
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateBuddyDto) {
    return this.buddyService.update(user.sub, dto);
  }

  @Get('greeting')
  greeting(@CurrentUser() user: JwtPayload) {
    return this.buddyService.getDailyGreeting(user.sub);
  }

  @Get('journey')
  getJourney(@CurrentUser() user: JwtPayload) {
    return this.journeyService.getActiveJourney(user.sub);
  }

  @Post('journey/start')
  startJourney(@CurrentUser() user: JwtPayload, @Body() dto: StartJourneyDto) {
    return this.journeyService.startJourney(user.sub, dto);
  }

  @Post('journey/respond')
  respondToDiscovery(@CurrentUser() user: JwtPayload, @Body() body: JourneyRespondDto) {
    return this.journeyService.recordDiscoveryChoice(user.sub, body.journeyId, body.choice);
  }
}
