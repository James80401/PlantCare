# Plant Buddy — Prisma Schema Additions

## Instructions

Append all of the following to the bottom of your existing `prisma/schema.prisma` file. Do not modify existing models. These are additive only.

---

## Full Schema Block

```prisma
// ─────────────────────────────────────────────────────────────────────────────
// PLANT BUDDY MODELS
// Added: feature/plant-buddy branch
// ─────────────────────────────────────────────────────────────────────────────

model Buddy {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Identity
  name            String
  speciesId       String      @default("monstera")
  trait           BuddyTrait  @default(RESILIENT)

  // Progression
  growthStage     GrowthStage @default(SEED)
  journeyCount    Int         @default(0)
  dewdrops        Int         @default(0)

  // Daily state (reset at midnight by scheduler)
  sunlightToday   Int         @default(0)
  tasksToday      Int         @default(0)
  lastResetDate   DateTime?

  // Mood
  mood            BuddyMood   @default(HAPPY)
  lastTaskDate    DateTime?

  // Streak
  streakDays      Int         @default(0)
  longestStreak   Int         @default(0)
  lastActiveDate  DateTime?

  // Customization — JSON object of equipped item IDs per slot
  equippedItems   Json        @default("{}")

  // Species collection
  unlockedSpecies String[]    @default(["monstera"])

  // Biome progress
  currentBiome    String      @default("seed_garden")
  unlockedBiomes  String[]    @default(["seed_garden"])

  // Personality — array of { journeyId, choice } records
  personalityChoices Json     @default("[]")

  // Terrarium — JSON layout of placed furniture
  terrariumLayout Json        @default("{}")
  terrariumBackground String  @default("sunny_windowsill")

  // Garden Town
  gardenCode      String      @unique
  showLastActive  Boolean     @default(true)

  // Relations
  journeys        BuddyJourney[]
  inventory       BuddyInventory[]
  activities      BuddyActivity[]
  questProgress   BuddyQuestProgress[]
  challengeProgress BuddyChallengeProgress[]
  friendshipsFrom BuddyFriendship[] @relation("FriendshipFrom")
  friendshipsTo   BuddyFriendship[] @relation("FriendshipTo")

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model BuddyJourney {
  id              String    @id @default(cuid())
  buddyId         String
  buddy           Buddy     @relation(fields: [buddyId], references: [id], onDelete: Cascade)

  biomeId         String
  startedAt       DateTime  @default(now())
  endsAt          DateTime
  completedAt     DateTime?
  completed       Boolean   @default(false)

  // Discovery
  discoveryId     String?
  choiceMade      Int?      // 0 = choice A, 1 = choice B

  // Rewards
  dewdropsEarned  Int       @default(0)
  itemDropped     String?   // ShopItem id
  companionDropped String?  // companion id

  // Shortcut tracking (tasks completed during journey)
  tasksCompletedDuring Int  @default(0)
  minutesSaved         Int  @default(0)
}

model BuddySpecies {
  id                    String      @id  // slug: "monstera", "cactus", etc.
  displayName           String
  description           String
  emoji                 String
  defaultColor          String
  darkColor             String
  lightColor            String
  traitPool             BuddyTrait[]
  unlockType            UnlockType
  unlockValue           Int?
  unlockCondition       String?
  isDefault             Boolean     @default(false)
  isSeasonal            Boolean     @default(false)
  seasonMonths          Int[]
  growStageDescriptions Json        // string[6]
  idleAnimationKeys     Json        // string[]
  uniqueMechanic        String
  dialogueSamples       Json        // string[]
  sortOrder             Int         @default(0)
}

model ShopItem {
  id              String          @id @default(cuid())
  name            String
  description     String
  category        ItemCategory
  tier            Int             // 1–4
  cost            Int             // Dewdrops (0 = free, -1 = not purchasable directly)
  requiresPremium Boolean         @default(false)
  isSeasonalOnly  Boolean         @default(false)
  seasonMonths    Int[]
  speciesLocked   String?         // species id or null
  unlockType      ItemUnlockType  @default(PURCHASE)
  unlockCondition String?
  imageKey        String
  isActive        Boolean         @default(true)
  sortOrder       Int             @default(0)
  createdAt       DateTime        @default(now())

  inventory       BuddyInventory[]
}

model BuddyInventory {
  id            String    @id @default(cuid())
  buddyId       String
  buddy         Buddy     @relation(fields: [buddyId], references: [id], onDelete: Cascade)
  itemId        String
  item          ShopItem  @relation(fields: [itemId], references: [id])
  acquiredAt    DateTime  @default(now())
  acquireMethod String    // "purchase" | "quest" | "journey" | "event" | "default"

  @@unique([buddyId, itemId])
}

model BuddyActivity {
  id              String        @id @default(cuid())
  buddyId         String
  buddy           Buddy         @relation(fields: [buddyId], references: [id], onDelete: Cascade)
  userId          String

  activityType    ActivityType
  completedAt     DateTime      @default(now())
  durationSeconds Int?
  sunlightEarned  Int
  dewdropsEarned  Int

  // References to data created by this activity
  taskId          String?
  journalEntryId  String?
  diagnosisId     String?
  plantId         String?
  notes           String?
}

model Quest {
  id              String        @id @default(cuid())
  type            QuestType
  title           String
  description     String
  requirement     Json          // { type, count, taskType, etc. }
  rewardDewdrops  Int
  rewardItemId    String?
  rewardBadgeId   String?
  expiresAt       DateTime?     // null = permanent
  isActive        Boolean       @default(true)
  sortOrder       Int           @default(0)
  createdAt       DateTime      @default(now())

  progress        BuddyQuestProgress[]
}

model BuddyQuestProgress {
  id            String    @id @default(cuid())
  buddyId       String
  buddy         Buddy     @relation(fields: [buddyId], references: [id], onDelete: Cascade)
  questId       String
  quest         Quest     @relation(fields: [questId], references: [id])
  progress      Int       @default(0)
  completed     Boolean   @default(false)
  completedAt   DateTime?
  rewardClaimed Boolean   @default(false)

  @@unique([buddyId, questId])
}

model MonthlyChallenge {
  id              String    @id @default(cuid())
  month           Int       // 1–12
  year            Int
  title           String
  description     String
  steps           Json      // ChallengeStep[]
  rewardDewdrops  Int
  rewardItemId    String?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())

  progress        BuddyChallengeProgress[]

  @@unique([month, year])
}

model BuddyChallengeProgress {
  id                String           @id @default(cuid())
  buddyId           String
  buddy             Buddy            @relation(fields: [buddyId], references: [id], onDelete: Cascade)
  challengeId       String
  challenge         MonthlyChallenge @relation(fields: [challengeId], references: [id])
  stepsCompleted    Int              @default(0)
  completedStepIds  String[]
  completedAt       DateTime?
  startedAt         DateTime         @default(now())

  @@unique([buddyId, challengeId])
}

model BuddyFriendship {
  id                  String    @id @default(cuid())
  fromBuddyId         String
  toBuddyId           String
  fromBuddy           Buddy     @relation("FriendshipFrom", fields: [fromBuddyId], references: [id], onDelete: Cascade)
  toBuddy             Buddy     @relation("FriendshipTo",   fields: [toBuddyId],   references: [id], onDelete: Cascade)

  level               Int       @default(1)
  points              Int       @default(0)

  lastSunshineSentAt  DateTime?
  totalSunshineSent   Int       @default(0)

  connectedAt         DateTime  @default(now())
  isActive            Boolean   @default(true)

  @@unique([fromBuddyId, toBuddyId])
}

model SunshineEvent {
  id              String    @id @default(cuid())
  fromUserId      String
  toUserId        String
  sentAt          DateTime  @default(now())
  dewdropsAwarded Int       @default(3)
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum GrowthStage {
  SEED
  SPROUT
  SEEDLING
  YOUNG_PLANT
  ESTABLISHED
  ANCIENT
}

enum BuddyTrait {
  RESILIENT
  SUN_SEEKER
  NIGHT_BLOOMER
  WILD
  TENDER
}

enum BuddyMood {
  THRIVING
  HAPPY
  CONTENT
  WILTING
  THIRSTY
  DORMANT
}

enum UnlockType {
  DEFAULT
  DEWDROPS
  STREAK
  QUEST
  JOURNEY_COUNT
  SEASONAL
  TASK_CONDITION
}

enum ItemCategory {
  HAT
  TOP
  SHOES
  GLASSES
  HELD_ITEM
  POT_SKIN
  BODY_COLOR
  BODY_PATTERN
  COMPANION
  WINGS
  BACKGROUND
  FURNITURE
}

enum ItemUnlockType {
  PURCHASE
  QUEST_REWARD
  JOURNEY_DROP
  ACHIEVEMENT
  SEASONAL_EVENT
  SPECIES_UNLOCK
  DEFAULT_ITEM
}

enum ActivityType {
  WATERING_CHECK
  SUNLIGHT_AUDIT
  PEST_INSPECTION
  PLANT_JOURNAL
  REPOTTING_GUIDE
  SEASON_CHECK
  PROGRESS_PHOTO
  HUMIDITY_CHECK
  PRUNING_GUIDE
  PROPAGATION_LOG
}

enum QuestType {
  DAILY
  MONTHLY_CHALLENGE
  ACHIEVEMENT
  SEASONAL_EVENT
  FRIENDSHIP
}
```

---

## Migration Command

```bash
npx prisma migrate dev --name add_plant_buddy
npx prisma generate
```

## Relation to Add on User Model

Add this line to the existing `User` model in schema.prisma:

```prisma
buddy     Buddy?
```
