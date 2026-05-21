# Plant Buddy — Grow Journeys

## Overview

A Grow Journey is the primary progression event in Plant Buddy. When a user fills the daily Sunlight bar to 100, they can send their buddy on a timed adventure to one of several biomes. When the buddy returns, it has grown, earned Dewdrops, and experienced a Discovery — a short narrative event that the user responds to.

---

## Biomes

| Biome | Unlock Stage | Journey Duration | Discovery Themes |
|---|---|---|---|
| 🌱 Seed Garden | Seed (default) | 4 hours | First steps, tiny finds, soil discoveries |
| 🌲 Forest Floor | Sprout (5 journeys) | 5 hours | Woodland creatures, mosses, dappled light |
| 🏜️ Desert Oasis | Seedling (15 journeys) | 5 hours | Heat, resilience, rare blooms, hidden water |
| 🌊 Coastal Cliffs | Young Plant (30 journeys) | 6 hours | Ocean air, salt spray, tidal pools |
| 🍂 Autumn Hollow | Established (60 journeys) | 7 hours | Fallen leaves, harvest, change, letting go |
| ❄️ Winter Greenhouse | Established (60 journeys) | 7 hours | Warmth indoors, frost outside, dormancy |
| 🌸 Cherry Blossom Grove | Young Plant (30 journeys) — Spring event only | 6 hours | Transience, beauty, renewal |
| 🌋 Volcanic Hotspring | Ancient (100 journeys) | 8 hours | Power, minerals, extremes, survival |
| 🌌 Moonlit Meadow | Ancient (100 journeys) | 8 hours | Night blooms, stars, silence, wonder |
| ☁️ Sky Garden | Airy species only + Established | 7 hours | Freedom, altitude, clouds, wind |

---

## Journey Flow

### 1. Sunlight Bar Full

When `buddy.sunlightToday >= 100`, the frontend shows:
- Journey button becomes active (was greyed out)
- Buddy animation changes to "excited" state
- Optional push notification: "{Name} is ready for a journey!"

### 2. Biome Selection (Phase 3 feature)

In Phase 1, the journey goes to the most recently unlocked biome automatically.

In Phase 3, a biome selection screen appears showing:
- All unlocked biomes (tappable)
- All locked biomes (greyed out with unlock requirement shown)
- Journey duration displayed per biome
- Estimated Dewdrop reward range

### 3. Journey Starts

```typescript
// POST /buddy/journey/start
{
  biomeId: "forest_floor"
}
```

The backend:
1. Validates the buddy has 100 sunlight
2. Validates the biome is unlocked for this stage
3. Creates a `BuddyJourney` record with `endsAt = now + duration`
4. Sets `buddy.sunlightToday = 0` (consumed by the journey)
5. Returns the journey record

The frontend:
1. Transitions to "traveling" state on home screen
2. Shows the biome name and a progress bar
3. Shows estimated return time

### 4. While Traveling

The buddy is "away." The home screen shows:
- Biome illustration
- Progress bar (updates via polling or WebSocket)
- Return time countdown
- Motivational message: "Keep caring for your plants while {Name} explores!"

Users can still complete tasks while buddy is away. These tasks:
- Award Dewdrops normally (+3 per task)
- Do NOT fill another sunlight bar (bar is locked while traveling)
- Each task completed reduces the journey timer by 10 minutes

### 5. Journey Completes

When `endsAt <= now`:

The backend:
1. Marks `BuddyJourney.completed = true`
2. Awards Dewdrops: base amount + stage bonus
3. Selects a random Discovery from the biome's discovery pool
4. Checks for rare drops (furniture item or companion creature)
5. Increments `buddy.journeyCount`
6. Checks for stage advancement (if journeyCount crosses a threshold)
7. Sends push notification: "{Name} returned from the {Biome}!"

The frontend:
1. Transitions home screen to "returned" state
2. Shows the Discovery story card
3. Shows response options (two choices that affect personality)
4. Shows Dewdrop reward
5. Shows any rare item drop
6. If stage advanced: shows advancement celebration modal

---

## Discovery Events

Each biome has a pool of ~20 Discovery stories. A Discovery is a short 2–3 sentence narrative describing what the buddy encountered, followed by two response choices.

### Example — Forest Floor Discovery

> While exploring the mossy floor of the forest, {Name} found a perfect circle of tiny mushrooms growing around an old stone. A beetle was resting at the center, very still, as if guarding something.

**Choice A:** "How exciting! {Name} looked closer."
**Choice B:** "{Name} gave the beetle some space and moved on."

Both choices are valid. Choice A nudges the personality toward WILD or SUN_SEEKER. Choice B nudges toward RESILIENT or TENDER.

### Example — Desert Oasis Discovery

> The desert was blazing, but {Name} found a small spring hidden between two rocks. A cactus wren was drinking from it. {Name} waited quietly until the bird finished before approaching.

**Choice A:** "{Name} cupped some water and felt immediately refreshed."
**Choice B:** "{Name} decided not to drink — saving it for the next traveler."

---

## Discovery Database

```typescript
// apps/api/src/buddy/constants/discoveries.ts
export const BIOME_DISCOVERIES: Record<string, Discovery[]> = {
  seed_garden: [
    {
      id: 'sg_01',
      narrative: 'While exploring near the compost pile, {name} found a perfectly round smooth pebble. It fits exactly in one hand.',
      choiceA: { text: '{name} kept the pebble as a treasure.', traitNudge: 'TENDER' },
      choiceB: { text: '{name} left it for someone else to find.', traitNudge: 'WILD' },
      rewardItem: null,
      isRare: false,
    },
    // ... 19 more
  ],
  forest_floor: [
    // 20 discoveries
  ],
  // ... all biomes
};
```

---

## Rare Drops

| Drop Type | Chance | Biome Source |
|---|---|---|
| Terrarium furniture item | ~15% | Any biome (biome-themed item) |
| Companion creature | ~5% | Specific biomes only |
| Exclusive hat | ~3% | Specific biomes only |
| Extra Dewdrops (+15 bonus) | ~25% | Any biome |
| Body pattern unlock | ~8% | Any biome |

If the user already owns a dropped item, it converts to 30 Dewdrops instead.

---

## Journey Database Model

```prisma
model BuddyJourney {
  id            String    @id @default(cuid())
  buddyId       String
  buddy         Buddy     @relation(fields: [buddyId], references: [id])

  biomeId       String
  startedAt     DateTime  @default(now())
  endsAt        DateTime
  completedAt   DateTime?
  completed     Boolean   @default(false)

  // Discovery
  discoveryId   String?
  choiceMade    Int?      // 0 = choice A, 1 = choice B, null = not yet responded

  // Rewards
  dewdropsEarned  Int     @default(0)
  itemDropped     String? // ShopItem id if something dropped
  companionDropped String? // companion id if one dropped

  // Journey shortcut tracking
  tasksCompletedDuring Int @default(0)
  minutesSaved         Int @default(0)
}
```

---

## Dewdrop Rewards by Stage

| Growth Stage | Base Dewdrops | Bonus Range |
|---|---|---|
| Seed | 20 | +0–10 (random) |
| Sprout | 25 | +0–15 |
| Seedling | 30 | +0–20 |
| Young Plant | 35 | +0–25 |
| Established | 40 | +0–30 |
| Ancient | 50 | +0–40 |
