# Plant Buddy — Progression & XP System

## Core Currency: Sunlight ☀️

Sunlight is the daily XP bar. It is **not** a persistent currency — it resets to 0 each day at midnight local time. Sunlight is earned by completing tasks throughout the day. When the bar reaches 100, the buddy is eligible to go on a Grow Journey.

### Sunlight Awards by Task Type

| Task Type | Sunlight Awarded |
|---|---|
| Quick task (mist, rotate) | 5–7 ☀️ |
| Medium task (water, check soil) | 8–12 ☀️ |
| Long task (journal entry, pest inspection) | 12–15 ☀️ |
| Guided activity completion | 15–20 ☀️ |
| Quest completion | 20–30 ☀️ |

### Species Sunlight Bonuses
- **Sunny (Sunflower):** +20% on all sunlight earned
- **Rosie (Succulent):** +25% on light-related tasks only
- **Bam (Bamboo):** Streak bonus sunlight (see streaks section)

---

## Growth Stages

There are 6 growth stages. Advancement is based on cumulative **Grow Journeys completed**, not raw XP.

| Stage | Name | Journeys Required | Unlocks |
|---|---|---|---|
| 1 | 🌰 Seed | 0 (starting stage) | Seed Garden biome, basic accessories |
| 2 | 🌱 Sprout | 5 journeys | Forest Floor biome, Tier 1 shop items |
| 3 | 🪴 Seedling | 15 journeys | Desert Oasis biome, Tier 2 shop items |
| 4 | 🌿 Young Plant | 30 journeys | Coastal Cliffs biome, Tier 3 shop items |
| 5 | 🌳 Established | 60 journeys | Autumn Hollow biome, companion slots |
| 6 | 🌲 Ancient | 100 journeys | All biomes, Tier 4 items, Ancient stage badge |

### Stage Advancement Behavior
- On stage advancement, a special animation plays (buddy visually transforms)
- A push notification is sent: "{Name} just grew into a {Stage}!"
- Stage badge updates in the header and on the Garden Town profile card
- New unlocks are displayed in a celebratory modal

---

## Grow Journeys

A Grow Journey is the core advancement mechanism. It works like this:

1. User fills the daily Sunlight bar to 100
2. Journey button becomes available
3. User taps "Send {Name} on a Journey"
4. Journey timer starts — duration depends on stage:
   - Seed: 4 hours
   - Sprout: 5 hours
   - Seedling: 6 hours
   - Young Plant: 6 hours
   - Established: 7 hours
   - Ancient: 8 hours
5. Buddy is "away" — the home screen shows a traveling state
6. User can continue completing tasks while buddy is away — these award extra Dewdrops but do not fill another Sunlight bar until buddy returns
7. When journey completes, buddy returns with:
   - A **Discovery** story (short narrative event)
   - A **Dewdrop** reward (25–50 depending on stage)
   - Possibly a terrarium furniture item (rare drop, ~15% chance)
   - Possibly a companion creature (very rare, ~5% chance in certain biomes)

### Journey Shortcutting
Extra tasks completed while buddy is on a journey reduce the remaining timer. Each task completed shaves approximately 10 minutes off the remaining time. This rewards users who stay engaged even while the journey is running.

---

## Dewdrops 💧

Dewdrops are the persistent in-app currency. Unlike Sunlight, they never reset. They accumulate over time and are spent in the shop.

### Earning Dewdrops

| Source | Amount |
|---|---|
| Task completed (any) | +3 💧 |
| Journey return reward | +25–50 💧 (scales with stage) |
| Daily login bonus | +5 💧 |
| 7-day streak bonus | +50 💧 |
| 30-day streak bonus | +200 💧 |
| Quest completion | +15–40 💧 |
| Sending sunshine to a friend | +3 💧 |
| Receiving sunshine from a friend | +3 💧 |
| Friendship level up | +25 💧 |
| Terrarium furniture journey drop | Converted to 30 💧 if already owned |
| Monthly event completion | +150–300 💧 |

### Spending Dewdrops

| Category | Cost Range |
|---|---|
| Tier 1 accessories / hats | 30–60 💧 |
| Tier 2 accessories / pots | 60–120 💧 |
| Tier 3 rare items | 120–200 💧 |
| Tier 4 premium items | 250–400 💧 |
| New species (purchasable) | 500 💧 (Rose only) |
| New biome travel ticket (after first visit) | 300 💧 |
| Streak repair (one use per month) | 100 💧 |
| Body color variant | 80–300 💧 |
| Body pattern | 60–200 💧 |
| Terrarium furniture | 30–150 💧 |
| Terrarium background | 100–300 💧 |

---

## Streaks

A streak is maintained by completing at least one task per day.

| Milestone | Reward |
|---|---|
| 3 days | +10 💧 bonus |
| 7 days | +50 💧 bonus + Sunny species unlock |
| 14 days | +75 💧 bonus |
| 30 days | +200 💧 bonus + Bam species unlock |
| 60 days | +300 💧 bonus + special hat unlock |
| 100 days | +500 💧 bonus + Gold Laurel Wreath hat |
| 365 days | +1000 💧 bonus + Diamond Crown hat |

### Streak Repair
If a user misses a day, they can repair their streak once per month by spending 100 Dewdrops. This is intentionally limited — the goal is gentle encouragement, not punishing misses.

### Bam Streak Bonus
Bamboo buddy users earn double Dewdrops on all streak milestones and double the bonus Sunlight on the day after a milestone.

---

## Mood System

Buddy has a daily mood that changes based on care. Mood affects buddy's facial expression, idle animations, and dialogue.

| Mood | Trigger | Visual Effect |
|---|---|---|
| Thriving | All tasks complete, recent journey | Big smile, bouncy, rosy cheeks |
| Happy | Most tasks complete | Normal smile, gentle animations |
| Content | Some tasks done | Neutral expression |
| Wilting | No tasks in 24 hours | Slight droop, softer colors |
| Thirsty | No watering task in 48 hours | Dry look, downturned expression |
| Dormant | No activity in 5+ days | Sleeping face, minimal animation |

### Mood Recovery
Mood never permanently degrades. Completing any task immediately improves mood by one level. Completing a watering task moves mood from Thirsty to Content in one step regardless of gap.

---

## Personality System

On first launch, the user picks a Plant Trait for their buddy. This trait subtly influences dialogue and discovery reaction text throughout the buddy's life.

| Trait | Character Flavor |
|---|---|
| RESILIENT | Tough, bounces back, matter-of-fact |
| SUN_SEEKER | Optimistic, energized, light-focused |
| NIGHT_BLOOMER | Contemplative, nocturnal, mysterious |
| WILD | Adventurous, unpredictable, free |
| TENDER | Gentle, caring, emotionally expressive |

### Personality Evolution
After each Grow Journey, a Discovery event presents two response options. The user's choice nudges the personality over time. After 20+ journeys, buddies develop compound personality blends reflected in more nuanced dialogue.

---

## Database: Progression Models

```prisma
model Buddy {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id])

  // Identity
  name            String
  speciesId       String      @default("monstera")
  trait           BuddyTrait  @default(RESILIENT)

  // Progression
  growthStage     GrowthStage @default(SEED)
  journeyCount    Int         @default(0)
  dewdrops        Int         @default(0)

  // Daily state (resets at midnight)
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

  // Customization
  equippedItems   Json        @default("{}")
  unlockedSpecies String[]    @default(["monstera"])
  currentBiome    String      @default("seed_garden")

  // Personality
  personalityChoices Json     @default("[]")  // array of choice records

  // Terrarium
  terrariumLayout Json        @default("{}")

  // Relations
  journeys        BuddyJourney[]
  inventory       BuddyInventory[]

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

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
```
