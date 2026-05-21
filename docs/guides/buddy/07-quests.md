# Plant Buddy — Quests System

## Overview

Quests give users structured goals beyond daily tasks. There are three quest tiers: Daily Quests, Monthly Challenges, and Achievement Quests. All quests reward Dewdrops and some reward exclusive items.

---

## Daily Quests

Three quests rotate every day at midnight UTC. They are short, completable within a single day's care session.

### Daily Quest Examples

| Quest | Requirement | Reward |
|---|---|---|
| Water & Wonder | Complete a watering task | 15 💧 |
| Eyes on the Leaves | Complete a pest inspection | 15 💧 |
| Let There Be Light | Complete a sunlight audit or rotation task | 12 💧 |
| Word by Word | Write a journal entry of 30+ words | 20 💧 |
| Full Sun Day | Fill the entire sunlight bar | 25 💧 |
| Snapshot | Take a progress photo | 12 💧 |
| Misty Morning | Complete a misting task | 10 💧 |
| Grounded | Check soil moisture for 2+ plants | 15 💧 |
| First Steps | Send buddy on a journey | 20 💧 |
| Community Gardener | Send sunshine to a friend | 10 💧 |
| Helping Hand | Receive sunshine from a friend | 10 💧 |
| Green Thumb | Complete 3 different task types today | 30 💧 |

The daily rotation is seeded by date — all users see the same 3 daily quests, which enables friends to work toward the same goals.

---

## Monthly Challenge

Each month has a 14-step challenge themed around real plant care seasons. Each step is one task or activity.

### Monthly Challenge Structure

The challenge is displayed as a path (like a trail on a map). Steps unlock sequentially — complete step 1 to see step 2.

**Rewards per step:** 5–15 Dewdrops
**Completion reward:** 150 Dewdrops + an exclusive item (hat or accessory) only available that month

### Example Monthly Challenges

**January — "Deep Winter Care"**
1. Check all your plants for drafts near windows
2. Reduce watering frequency — log it
3. Complete a humidity check
4. Write a journal entry about your plant goals for the year
5. Take a progress photo of each plant
6. Check for any pests hiding in winter
7. Dust the leaves of a large-leafed plant
8. Research one plant's dormancy needs
9. Order or plan any new plants for spring
10. Complete a sunlight audit — winter light is weaker
11. Log your heating habits and how they affect your plants
12. Write a note to your buddy about the month
13. Complete any guided activity
14. Send sunshine to a friend

**April — "Spring Awakening"**
1. Check for new growth on each plant
2. Begin increasing watering frequency
3. Start fertilizing after winter pause — log it
4. Repot any rootbound plants
5. Complete a propagation log — start a new cutting
...and so on.

### Monthly Challenge Database

```prisma
model MonthlyChallenge {
  id          String   @id @default(cuid())
  month       Int      // 1–12
  year        Int
  title       String
  description String
  steps       Json     // array of ChallengeStep objects
  rewardDewdrops Int
  rewardItemId   String? // exclusive item id
  isActive    Boolean  @default(true)
}

model BuddyChallengeProgress {
  id                String           @id @default(cuid())
  buddyId           String
  challengeId       String
  stepsCompleted    Int              @default(0)
  completedStepIds  String[]
  completedAt       DateTime?
  startedAt         DateTime         @default(now())

  @@unique([buddyId, challengeId])
}
```

---

## Achievement Quests

Achievements are permanent quests that reward players for hitting milestones. They never expire.

### Progression Achievements

| Achievement | Condition | Reward |
|---|---|---|
| First Leaf | Complete first Grow Journey | 20 💧 + Sprout badge |
| Getting Rooted | Complete 10 journeys | 50 💧 |
| Growing Strong | Complete 25 journeys | 100 💧 + special hat |
| Deep Roots | Complete 50 journeys | 200 💧 |
| Ancient Grove | Reach Ancient stage | 500 💧 + Diamond Crown hat |

### Care Achievements

| Achievement | Condition | Reward |
|---|---|---|
| Hydrated | Complete 10 watering tasks | 30 💧 |
| Pest Patrol | Complete 10 pest inspections | 30 💧 |
| Green Writer | Write 10 journal entries | 50 💧 |
| Propagator | Complete 5 propagation logs | 80 💧 + Propagation badge |
| Repotter | Repot 3 plants | 60 💧 |
| Photo Diary | Take 20 progress photos | 50 💧 |
| All-Rounder | Complete all 10 activity types | 150 💧 + All-Rounder hat |

### Streak Achievements

| Achievement | Condition | Reward |
|---|---|---|
| Consistent | 7-day streak | 50 💧 + unlocks Sunny species |
| Committed | 30-day streak | 200 💧 + unlocks Bam species |
| Dedicated | 60-day streak | 300 💧 + special hat |
| Legend | 100-day streak | 500 💧 + Gold Laurel Wreath |
| Eternal | 365-day streak | 1000 💧 + Diamond Crown |

### Social Achievements

| Achievement | Condition | Reward |
|---|---|---|
| Neighborly | Add first friend | 20 💧 |
| Garden Party | Add 5 friends | 50 💧 |
| Sunshine Sender | Send 10 sunshine messages | 30 💧 |
| Community Garden | Reach friendship level 5 with any friend | 80 💧 |

### Explorer Achievements

| Achievement | Condition | Reward |
|---|---|---|
| First Journey | Complete Seed Garden journey | 20 💧 |
| Forest Walker | Complete Forest Floor journey | 30 💧 |
| Desert Survivor | Complete Desert Oasis journey | 40 💧 |
| Ocean Breeze | Complete Coastal Cliffs journey | 40 💧 |
| Harvest Moon | Complete Autumn Hollow journey | 50 💧 |
| Night Wanderer | Complete Moonlit Meadow journey | 60 💧 |
| World Traveler | Complete all biomes | 200 💧 + constellation crown |

---

## Quest Database Models

```prisma
model Quest {
  id          String        @id @default(cuid())
  type        QuestType
  title       String
  description String
  requirement Json          // structured requirement object
  rewardDewdrops Int
  rewardItemId   String?
  rewardBadgeId  String?
  expiresAt   DateTime?     // null = permanent
  isActive    Boolean       @default(true)
  sortOrder   Int           @default(0)
}

model BuddyQuestProgress {
  id          String      @id @default(cuid())
  buddyId     String
  buddy       Buddy       @relation(fields: [buddyId], references: [id])
  questId     String
  quest       Quest       @relation(fields: [questId], references: [id])
  progress    Int         @default(0)  // current progress toward requirement
  completed   Boolean     @default(false)
  completedAt DateTime?
  rewardClaimed Boolean   @default(false)

  @@unique([buddyId, questId])
}

enum QuestType {
  DAILY
  MONTHLY_CHALLENGE
  ACHIEVEMENT
  SEASONAL_EVENT
  FRIENDSHIP
}
```
