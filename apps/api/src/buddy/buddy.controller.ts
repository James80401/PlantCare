import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BuddyShopService } from './buddy-shop.service';
import { BuddyActivityService } from './buddy-activity.service';
import { BuddyQuestService } from './buddy-quest.service';
import { BuddySeasonalService } from './buddy-seasonal.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuddyEnabledGuard } from '../common/guards/buddy-enabled.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { CreateBuddyDto } from './dto/create-buddy.dto';
import { UpdateBuddyDto } from './dto/update-buddy.dto';
import { StartJourneyDto } from './dto/start-journey.dto';
import { JourneyRespondDto } from './dto/journey-respond.dto';

@ApiTags('buddy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BuddyEnabledGuard)
@Controller('buddy')
export class BuddyController {
  constructor(
    private buddyService: BuddyService,
    private journeyService: BuddyJourneyService,
    private shopService: BuddyShopService,
    private activityService: BuddyActivityService,
    private questService: BuddyQuestService,
    private seasonalService: BuddySeasonalService,
  ) {}

  @Get('seasonal')
  seasonalStatus(@CurrentUser() user: JwtPayload) {
    return this.seasonalService.getStatus(user.sub);
  }

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

  @Get('companion-line')
  companionLine(@CurrentUser() user: JwtPayload) {
    return this.buddyService.getCompanionLine(user.sub);
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

  @Get('shop/catalog')
  shopCatalog(@CurrentUser() user: JwtPayload) {
    return this.shopService.getCatalog(user.sub);
  }

  @Get('shop/daily')
  shopDaily(@CurrentUser() user: JwtPayload) {
    return this.shopService.getDailyRotation(user.sub);
  }

  @Get('shop/inventory')
  shopInventory(@CurrentUser() user: JwtPayload) {
    return this.shopService.getInventory(user.sub);
  }

  @Post('shop/purchase')
  shopPurchase(@CurrentUser() user: JwtPayload, @Body() dto: PurchaseItemDto) {
    return this.shopService.purchase(user.sub, dto);
  }

  @Get('species')
  listSpecies(@CurrentUser() user: JwtPayload) {
    return this.shopService.getSpecies(user.sub);
  }

  @Get('activities')
  activityLibrary() {
    return this.activityService.getLibrary();
  }

  @Post('activities/complete')
  completeActivity(@CurrentUser() user: JwtPayload, @Body() dto: CompleteActivityDto) {
    return this.activityService.complete(user.sub, dto);
  }

  @Get('quests')
  getQuests(@CurrentUser() user: JwtPayload) {
    return this.questService.getQuests(user.sub);
  }

  @Post('quests/:id/claim')
  claimQuest(@CurrentUser() user: JwtPayload, @Param('id') questId: string) {
    return this.questService.claim(user.sub, questId);
  }
}
