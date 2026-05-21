# Plant Buddy — Development Phases

## Overview

Development is split into 5 phases. Each phase is a self-contained, shippable increment. Users can start using Plant Buddy after Phase 1 is complete.

---

## Phase 1 — Core Loop (MVP)

**Goal:** A working buddy that grows when you complete tasks.

**Backend:**
- [ ] Create `buddy.module.ts` and register in `app.module.ts`
- [ ] Create `Buddy` Prisma model and run migration
- [ ] Create `BuddyJourney` Prisma model
- [ ] `POST /buddy` — create a buddy (onboarding)
- [ ] `GET /buddy` — fetch buddy state
- [ ] `PATCH /buddy` — update name, trait
- [ ] Add `EventEmitter2` to `TasksService.completeTask()`
- [ ] `BuddyService.handleTaskCompleted()` — award sunlight + dewdrops
- [ ] Daily sunlight reset cron job
- [ ] Streak tracking cron job
- [ ] `POST /buddy/journey/start` — start a journey
- [ ] `GET /buddy/journey` — get active journey status
- [ ] Journey completion logic + dewdrop award
- [ ] Stage advancement logic (journeyCount thresholds)
- [ ] Push notification on journey complete

**Frontend:**
- [ ] Buddy onboarding screen (name + species + trait selection)
- [ ] `BuddyHome` page — buddy display + sunlight bar + mood
- [ ] `SunlightBar` component
- [ ] Journey screen — progress bar + return timer
- [ ] Stage advancement modal
- [ ] Nav bar with 5 tabs (Home, Tasks, Style, Journey, Town)
- [ ] `useBuddy` hook — fetches and caches buddy state
- [ ] `useJourney` hook — polls journey status every 30s

**Definition of Done:**
A user can create a buddy, complete tasks, fill the sunlight bar, send their buddy on a journey, and watch it grow through the first two stages.

---

## Phase 2 — Customization

**Goal:** Users can spend Dewdrops to customize their buddy.

**Backend:**
- [x] `ShopItem` Prisma model + seed data (all 30+ items)
- [x] `BuddyInventory` Prisma model
- [x] `BuddySpecies` Prisma model + seed data (7 species in Phase 2 catalog)
- [x] `GET /buddy/shop/catalog` — full shop with ownership status
- [x] `GET /buddy/shop/daily` — daily rotation (4 items)
- [x] `POST /buddy/shop/purchase` — spend dewdrops
- [x] `PATCH /buddy` — update `equippedItems` JSON
- [x] `PATCH /buddy` — update `terrariumLayout` JSON
- [x] Species unlock logic (check unlock conditions)
- [x] Item ownership validation on equip

**Frontend:**
- [x] Shop hub screen
- [x] Clothing shop by category (hats, tops, accessories)
- [x] Pot shop
- [x] Terrarium shop (backgrounds + furniture)
- [x] `AccessoryPicker` component — grid of owned items
- [x] `TerrariumView` component — interactive terrarium
- [x] Species selector in style tab
- [x] Dewdrops balance display + spending confirmation
- [x] Daily rotation banner in shop

**Definition of Done:**
Users can browse the shop, purchase items, equip them on their buddy, and place furniture in their terrarium.

---

## Phase 3 — Activities & Quests

**Goal:** Structured in-app care experiences and goal tracking.

**Backend:**
- [x] `BuddyActivity` Prisma model
- [x] Activity endpoints for all 10 activity types (`GET /buddy/activities`, `POST /buddy/activities/complete`)
- [x] Activity-to-task integration (watering, repot, prune, pest inspect complete pending tasks)
- [x] Activity-to-journal integration (creates JournalEntry records for journal/photo activities)
- [ ] Activity-to-diagnosis integration (opens DiagnosisConversation)
- [x] `Quest` Prisma model + seed daily + achievement definitions
- [x] `BuddyQuestProgress` Prisma model
- [x] `GET /buddy/quests` — active daily + achievement quests
- [x] Quest progress tracking (listen to task/activity/journey events)
- [x] `POST /buddy/quests/:id/claim` — claim reward
- [x] Daily quest rotation logic (seeded by date)
- [x] `MonthlyChallenge` Prisma model + seed (May 2026 starter challenge)
- [x] Monthly challenge step tracking (increments on care actions)

**Frontend:**
- [x] Activity library screen
- [x] Shared activity completion flow (all 10 types; notes + plant picker)
- [x] Per-activity multi-step wizards (watering, season check, progress photo, sunlight audit)
- [x] Pest Inspection — Dr. Plant link from activity flow
- [x] Plant Journal — notes saved to journal entry
- [x] Season Check flow (weather integration)
- [x] Progress Photo flow (camera + upload)
- [x] Dedicated multi-step guides (repotting, pruning, propagation, pest inspection)
- [x] Quests screen (daily + achievements + monthly challenge)
- [x] `QuestCard` component
- [x] Monthly challenge path display

**Definition of Done:**
Users can complete guided activities, track quest progress, and work through the monthly challenge.

---

## Phase 4 — Social / Garden Town

**Goal:** Friends can connect, visit each other's terrariums, and send sunshine.

**Backend:**
- [x] `BuddyFriendship` Prisma model
- [x] `SunshineEvent` Prisma model
- [x] Garden code generation on buddy creation
- [x] `POST /buddy/social/friends/add` — add by garden code
- [x] `DELETE /buddy/social/friends/:id` — remove friend
- [x] `GET /buddy/social/friends` — list with buddy info
- [x] `POST /buddy/social/sunshine/:id` — send sunshine (once per friend per day)
- [x] Sunshine daily reset (date check on `lastSunshineSentAt`)
- [x] Friendship level calculation
- [x] `GET /buddy/social/friends/:id/terrarium` — read-only terrarium view
- [x] `GET /buddy/social/feed` — activity feed events
- [ ] Push notifications for received sunshine and friend milestones

**Frontend:**
- [x] Garden Town screen
- [x] `FriendCard` component (buddy display + shine button)
- [x] Friend terrarium view (read-only)
- [x] Add friend (garden code input)
- [x] Remove friend confirmation UI
- [x] Activity feed section
- [x] Garden code display + copy
- [x] Friendship level progress indicator (level name + points on card)

**Definition of Done:**
Users can connect with friends, visit their terrariums, and send/receive sunshine with Dewdrop rewards.

---

## Phase 5 — Polish & Premium

**Goal:** Weather-aware messages, personality system, seasonal events, premium gating.

**Backend:**
- [x] `BuddyService.getDailyGreeting()` — weather-flavored message
- [x] Personality choices recorded on discovery response + trait-based reaction
- [x] Trait-based discovery dialogue reactions
- [ ] Seasonal event system (event start/end dates, exclusive items)
- [x] `ShopItem.requiresPremium` gating in purchase endpoint
- [ ] Bloom Token mechanic for Rose species (perfect day detection)
- [x] Journey shortcut minute-reduction logic (tasks during journey — already live; UI shows progress)
- [ ] Advanced push notification scheduling (mood degradation nudges)
- [ ] Analytics events (journey completion rate, task type distribution)

**Frontend:**
- [x] Dynamic buddy greeting using weather data
- [x] Personality-influenced dialogue after discovery choices
- [x] Seasonal banner (spring stub until full event system)
- [x] Premium badge on locked items in shop
- [ ] Bloom Token display for Rose users
- [x] Journey shortcut progress indicator ("Tasks completed: saves 30 min")
- [x] Mood degradation visual effects (wilting / dormant styling)
- [x] First Aid shortcut on buddy home (care tasks entry)
- [ ] Onboarding improvements (tutorial overlay, tips)

**Definition of Done:**
The full feature set is live. Seasonal events run on schedule. Premium items are correctly gated. Personality system influences all dialogue.

---

## Testing Checklist (per phase)

Before merging any phase to main:

- [ ] All new API endpoints have unit tests
- [ ] Prisma models have integration tests
- [ ] Event listeners (task.completed) tested in isolation
- [ ] Cron jobs have manual trigger endpoints (dev-only) for testing
- [ ] Frontend components have Storybook stories
- [ ] Journey timer tested with accelerated time (config flag)
- [ ] Shop purchase tested for insufficient funds edge case
- [ ] Streak break logic tested across midnight boundary
- [ ] Mobile layout tested on iOS and Android
- [ ] All text reviewed for tone consistency (warm, plant-focused, non-pressuring)
