# Plant Buddy — Feature Overview

## What Is Plant Buddy?

Plant Buddy is a companion gamification layer built on top of Dr. Plant. It is inspired by the self-care app Finch, but reimagined entirely around plant care instead of personal wellness. The user adopts a small animated plant character, cares for it by completing real plant-care tasks, earns XP and currency, customizes their buddy, sends it on adventures, and connects with friends.

Plant Buddy is **not** a replacement for the existing plant tracker. It is an additive layer that sits on top of the existing task, journal, diagnosis, weather, and billing systems already built into Dr. Plant.

---

## Core Loop

```
User completes plant-care tasks
        ↓
Buddy earns Sunlight (XP bar fills)
        ↓
Sunlight bar full → Grow Journey unlocks
        ↓
Buddy goes on a timed adventure (4–8 hrs in production, seconds in demo)
        ↓
Buddy returns with a Discovery story + earns Dewdrops (currency)
        ↓
Dewdrops spent in Shop → clothing, accessories, terrarium items
        ↓
Buddy grows through 6 growth stages over time
        ↓
New stages unlock new biomes, accessories, and species
```

---

## Branch

All Plant Buddy work lives on:

```
feature/plant-buddy
```

Branched from `main`. Never merged until all Phase 1–3 features are complete and tested.

---

## Tech Stack Integration

| Layer | Technology | Notes |
|---|---|---|
| Backend | NestJS module | New `buddy` module alongside existing modules |
| Database | Prisma + PostgreSQL | New models added to existing schema.prisma |
| Frontend | React + TypeScript | New pages under `apps/web/src/pages/buddy/` |
| Auth | Existing JWT guards | Reuse existing `@UseGuards(JwtAuthGuard)` pattern |
| Notifications | Existing module | Buddy nudges use existing DeviceToken system |
| Billing | Existing Stripe setup | Premium items gated by existing PlanTier enum |
| Weather | Existing module | Buddy daily message flavored by local weather |
| Tasks | Existing module | Task completions emit events buddy listens to |
| Journal | Existing module | Buddy journal activity writes to existing JournalEntry |
| Diagnosis | Existing Dr. Plant | Buddy First Aid shortcut opens DiagnosisConversation |

---

## Five Development Phases

| Phase | Focus | Key Deliverables |
|---|---|---|
| 1 | Core Loop | Buddy model, XP from tasks, Grow Journey timer, basic UI |
| 2 | Customization | Shop, inventory, clothing, pot skins, terrarium |
| 3 | Activities & Quests | Guided activities, daily quests, monthly events |
| 4 | Social | Garden Town, friend codes, sunshine system |
| 5 | Polish | Personality system, weather messages, premium gating, seasonal events |

---

## Key Design Principles

- **Non-punishing.** Buddy mood degrades gently when neglected but never penalizes the user. Recovery is easy.
- **Plant-grounded.** Every task, activity, and quest is tied to real plant care, not abstract self-improvement.
- **Additive, not duplicative.** Buddy consumes existing app data — it never creates parallel systems for things already built.
- **Supportive social.** Garden Town has no leaderboards, no competition. Only encouragement.
- **Premium optional.** Core experience is fully free. Premium unlocks cosmetic extras only — never paywalls progression.
