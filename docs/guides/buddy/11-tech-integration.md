# Plant Buddy — Technical Integration Guide

## Module Structure

```
apps/api/src/buddy/
├── buddy.module.ts
├── buddy.controller.ts
├── buddy.service.ts
├── buddy-journey.service.ts
├── buddy-shop.service.ts
├── buddy-social.service.ts
├── buddy-quest.service.ts
├── buddy-activity.service.ts
├── buddy-scheduler.service.ts
├── dto/
│   ├── create-buddy.dto.ts
│   ├── update-buddy.dto.ts
│   ├── start-journey.dto.ts
│   ├── purchase-item.dto.ts
│   └── add-friend.dto.ts
├── events/
│   └── buddy-events.ts
└── constants/
    ├── sunlight-awards.ts
    ├── discoveries.ts
    ├── shop-seed-data.ts
    └── quest-definitions.ts
```

---

## buddy.module.ts

```typescript
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BuddyController } from './buddy.controller';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { BuddyShopService } from './buddy-shop.service';
import { BuddySocialService } from './buddy-social.service';
import { BuddyQuestService } from './buddy-quest.service';
import { BuddySchedulerService } from './buddy-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    WeatherModule,
    EventEmitterModule,
  ],
  controllers: [BuddyController],
  providers: [
    BuddyService,
    BuddyJourneyService,
    BuddyShopService,
    BuddySocialService,
    BuddyQuestService,
    BuddySchedulerService,
  ],
  exports: [BuddyService],
})
export class BuddyModule {}
```

Register in `app.module.ts`:
```typescript
import { BuddyModule } from './buddy/buddy.module';

@Module({
  imports: [
    // ... existing modules
    BuddyModule,
  ],
})
export class AppModule {}
```

---

## buddy.controller.ts

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BuddyService } from './buddy.service';
import { BuddyJourneyService } from './buddy-journey.service';
import { BuddyShopService } from './buddy-shop.service';
import { BuddySocialService } from './buddy-social.service';
import { BuddyQuestService } from './buddy-quest.service';
import { CreateBuddyDto } from './dto/create-buddy.dto';
import { UpdateBuddyDto } from './dto/update-buddy.dto';
import { StartJourneyDto } from './dto/start-journey.dto';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { AddFriendDto } from './dto/add-friend.dto';

@Controller('buddy')
@UseGuards(JwtAuthGuard)
export class BuddyController {
  constructor(
    private buddyService: BuddyService,
    private journeyService: BuddyJourneyService,
    private shopService: BuddyShopService,
    private socialService: BuddySocialService,
    private questService: BuddyQuestService,
  ) {}

  // ── Buddy Core ──────────────────────────────────────────────────────────

  @Post()
  create(@Req() req, @Body() dto: CreateBuddyDto) {
    return this.buddyService.create(req.user.id, dto);
  }

  @Get()
  findMine(@Req() req) {
    return this.buddyService.findByUserId(req.user.id);
  }

  @Patch()
  update(@Req() req, @Body() dto: UpdateBuddyDto) {
    return this.buddyService.update(req.user.id, dto);
  }

  // ── Journey ─────────────────────────────────────────────────────────────

  @Get('journey')
  getJourney(@Req() req) {
    return this.journeyService.getActiveJourney(req.user.id);
  }

  @Post('journey/start')
  startJourney(@Req() req, @Body() dto: StartJourneyDto) {
    return this.journeyService.startJourney(req.user.id, dto);
  }

  @Post('journey/respond')
  respondToDiscovery(@Req() req, @Body() body: { journeyId: string; choice: number }) {
    return this.journeyService.recordDiscoveryChoice(req.user.id, body.journeyId, body.choice);
  }

  // ── Shop ────────────────────────────────────────────────────────────────

  @Get('shop/daily')
  getDailyShop(@Req() req) {
    return this.shopService.getDailyRotation();
  }

  @Get('shop/catalog')
  getCatalog(@Req() req) {
    return this.shopService.getFullCatalog(req.user.id);
  }

  @Post('shop/purchase')
  purchase(@Req() req, @Body() dto: PurchaseItemDto) {
    return this.shopService.purchaseItem(req.user.id, dto.itemId);
  }

  // ── Quests ──────────────────────────────────────────────────────────────

  @Get('quests')
  getQuests(@Req() req) {
    return this.questService.getActiveQuests(req.user.id);
  }

  @Post('quests/:id/claim')
  claimQuest(@Req() req, @Param('id') id: string) {
    return this.questService.claimReward(req.user.id, id);
  }

  // ── Social ──────────────────────────────────────────────────────────────

  @Get('social/friends')
  getFriends(@Req() req) {
    return this.socialService.getFriends(req.user.id);
  }

  @Post('social/friends/add')
  addFriend(@Req() req, @Body() dto: AddFriendDto) {
    return this.socialService.addFriend(req.user.id, dto.gardenCode);
  }

  @Delete('social/friends/:friendBuddyId')
  removeFriend(@Req() req, @Param('friendBuddyId') friendId: string) {
    return this.socialService.removeFriend(req.user.id, friendId);
  }

  @Post('social/sunshine/:friendBuddyId')
  sendSunshine(@Req() req, @Param('friendBuddyId') friendId: string) {
    return this.socialService.sendSunshine(req.user.id, friendId);
  }

  @Get('social/feed')
  getActivityFeed(@Req() req) {
    return this.socialService.getActivityFeed(req.user.id);
  }

  @Get('social/friends/:friendBuddyId/terrarium')
  viewFriendTerrarium(@Req() req, @Param('friendBuddyId') friendId: string) {
    return this.socialService.getFriendTerrarium(req.user.id, friendId);
  }
}
```

---

## Existing Module Integrations

### Tasks Module Hook

Add to `apps/api/src/tasks/tasks.service.ts`:

```typescript
// Add to constructor
private eventEmitter: EventEmitter2

// Add to completeTask method after prisma update:
this.eventEmitter.emit('task.completed', new TaskCompletedEvent(
  userId, task.id, task.taskType, task.plantId
));
```

### Weather Integration

```typescript
// In buddy.service.ts
async getDailyGreeting(userId: string): Promise<string> {
  const buddy = await this.findByUserId(userId);
  const weather = await this.weatherService.getCurrentWeather(userId);

  if (weather.isRaining) {
    return `${buddy.name} loves the sound of rain on the leaves today 🌧️`;
  }
  if (weather.tempCelsius > 28) {
    return `It's a hot one! ${buddy.name} is making sure the roots stay cool ☀️`;
  }
  if (weather.tempCelsius < 5) {
    return `${buddy.name} is bundled up — perfect day to check on your drafty plants ❄️`;
  }
  return `${buddy.name} is having a great day in the garden 🌿`;
}
```

### Notifications Integration

```typescript
// In buddy-journey.service.ts
async notifyJourneyComplete(userId: string, buddyName: string, biomeName: string) {
  await this.notificationsService.sendPush(userId, {
    title: `${buddyName} returned!`,
    body: `Your buddy is back from ${biomeName} with a discovery 🌿`,
    data: { type: 'JOURNEY_COMPLETE', route: '/buddy/journey' },
  });
}
```

### Billing / Premium Gating

```typescript
// In buddy-shop.service.ts
async purchaseItem(userId: string, itemId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  const item = await this.prisma.shopItem.findUnique({ where: { id: itemId } });

  if (item.requiresPremium && user.subscription?.planTier !== 'PREMIUM') {
    throw new ForbiddenException('This item requires a premium subscription');
  }

  // ... rest of purchase logic
}
```

---

## Frontend File Structure

```
apps/web/src/
├── pages/
│   └── buddy/
│       ├── index.tsx              // BuddyHome — main buddy screen
│       ├── journey.tsx            // Journey screen + biome map
│       ├── shop.tsx               // Shop hub
│       ├── shop/
│       │   ├── clothing.tsx
│       │   ├── pots.tsx
│       │   └── terrarium.tsx
│       ├── quests.tsx
│       ├── garden-town.tsx
│       └── onboarding.tsx         // First-time buddy setup
├── components/
│   └── buddy/
│       ├── BuddySprite.tsx        // Animated buddy character
│       ├── SunlightBar.tsx        // XP bar component
│       ├── MoodIndicator.tsx      // Mood face/status
│       ├── TerrariumView.tsx      // Full terrarium display
│       ├── AccessoryPicker.tsx    // Clothing/hat selector
│       ├── BiomeCard.tsx          // Individual biome display
│       ├── DiscoveryModal.tsx     // Post-journey story modal
│       ├── FriendCard.tsx         // Garden Town friend card
│       └── QuestCard.tsx          // Individual quest display
└── hooks/
    └── buddy/
        ├── useBuddy.ts            // Core buddy state
        ├── useJourney.ts          // Journey polling/state
        ├── useBuddyShop.ts        // Shop state
        └── useSocialBuddy.ts      // Garden Town state
```

---

## Environment Variables

No new environment variables are required. Buddy uses all existing infrastructure:
- `DATABASE_URL` — existing PostgreSQL
- `JWT_SECRET` — existing auth
- Push notification tokens — existing notification module
- Stripe keys — existing billing
- Weather API key — existing weather module

---

## Prisma Migration Plan

Run migrations in order:

```bash
# 1. Add buddy models
npx prisma migrate dev --name add_buddy_models

# 2. Seed shop items
npx ts-node prisma/seeds/buddy-shop.seed.ts

# 3. Seed quest definitions
npx ts-node prisma/seeds/buddy-quests.seed.ts

# 4. Seed species data
npx ts-node prisma/seeds/buddy-species.seed.ts
```
