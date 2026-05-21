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
- [ ] `ShopItem` Prisma model + seed data (all 30+ items)
- [ ] `BuddyInventory` Prisma model
- [ ] `BuddySpecies` Prisma model + seed data (all 12 species)
- [ ] `GET /buddy/shop/catalog` — full shop with ownership status
- [ ] `GET /buddy/shop/daily` — daily rotation (4 items)
- [ ] `POST /buddy/shop/purchase` — spend dewdrops
- [ ] `PATCH /buddy` — update `equippedItems` JSON
- [ ] `PATCH /buddy` — update `terrariumLayout` JSON
- [ ] Species unlock logic (check unlock conditions)
- [ ] Item ownership validation on equip

**Frontend:**
- [ ] Shop hub screen
- [ ] Clothing shop by category (hats, tops, accessories)
- [ ] Pot shop
- [ ] Terrarium shop (backgrounds + furniture)
- [ ] `AccessoryPicker` component — grid of owned items
- [ ] `TerrariumView` component — interactive terrarium
- [ ] Species selector in style tab
- [ ] Dewdrops balance display + spending confirmation
- [ ] Daily rotation banner in shop

**Definition of Done:**
Users can browse the shop, purchase items, equip them on their buddy, and place furniture in their terrarium.

---

## Phase 3 — Activities & Quests

**Goal:** Structured in-app care experiences and goal tracking.

**Backend:**
- [ ] `BuddyActivity` Prisma model
- [ ] Activity endpoints for all 10 activity types
- [ ] Activity-to-task integration (creates Task records)
- [ ] Activity-to-journal integration (creates JournalEntry records)
- [ ] Activity-to-diagnosis integration (opens DiagnosisConversation)
- [ ] `Quest` Prisma model + seed all achievement and daily quest definitions
- [ ] `BuddyQuestProgress` Prisma model
- [ ] `GET /buddy/quests` — active daily + achievement quests
- [ ] Quest progress tracking (listen to task/activity/journey events)
- [ ] `POST /buddy/quests/:id/claim` — claim reward
- [ ] Daily quest rotation logic (seeded by date)
- [ ] `MonthlyChallenge` Prisma model + seed Jan–Dec challenges
- [ ] Monthly challenge step tracking

**Frontend:**
- [ ] Activity library screen
- [ ] Watering Check flow (multi-step form)
- [ ] Sunlight Audit flow
- [ ] Pest Inspection flow (with Dr. Plant integration button)
- [ ] Plant Journal flow (buddy prompt + entry)
- [ ] Repotting Guide flow (step-by-step)
- [ ] Season Check flow (weather integration)
- [ ] Progress Photo flow (camera + upload)
- [ ] Humidity Check flow
- [ ] Pruning Guide flow
- [ ] Propagation Log flow
- [ ] Quests screen (daily + achievements + monthly challenge)
- [ ] `QuestCard` component
- [ ] Monthly challenge path display

**Definition of Done:**
Users can complete guided activities, track quest progress, and work through the monthly challenge.

---

## Phase 4 — Social / Garden Town

**Goal:** Friends can connect, visit each other's terrariums, and send sunshine.

**Backend:**
- [ ] `BuddyFriendship` Prisma model
- [ ] `SunshineEvent` Prisma model
- [ ] Garden code generation on buddy creation
- [ ] `POST /buddy/social/friends/add` — add by garden code
- [ ] `DELETE /buddy/social/friends/:id` — remove friend
- [ ] `GET /buddy/social/friends` — list with buddy info
- [ ] `POST /buddy/social/sunshine/:id` — send sunshine (once per friend per day)
- [ ] Sunshine daily reset cron job
- [ ] Friendship level calculation
- [ ] `GET /buddy/social/friends/:id/terrarium` — read-only terrarium view
- [ ] `GET /buddy/social/feed` — activity feed events
- [ ] Push notifications for received sunshine and friend milestones

**Frontend:**
- [ ] Garden Town screen
- [ ] `FriendCard` component (buddy display + shine button)
- [ ] Friend terrarium view (read-only)
- [ ] Add friend modal (garden code input)
- [ ] Remove friend confirmation
- [ ] Activity feed section
- [ ] Garden code display + copy + share
- [ ] Friendship level progress indicator

**Definition of Done:**
Users can connect with friends, visit their terrariums, and send/receive sunshine with Dewdrop rewards.

---

## Phase 5 — Polish & Premium

**Goal:** Weather-aware messages, personality system, seasonal events, premium gating.

**Backend:**
- [ ] `BuddyService.getDailyGreeting()` — weather-flavored message
- [ ] Personality blend calculation (based on personalityChoices history)
- [ ] Species-specific dialogue selection based on trait
- [ ] Seasonal event system (event start/end dates, exclusive items)
- [ ] `ShopItem.requiresPremium` gating in purchase endpoint
- [ ] Bloom Token mechanic for Rose species (perfect day detection)
- [ ] Journey shortcut minute-reduction logic (tasks during journey)
- [ ] Advanced push notification scheduling (mood degradation nudges)
- [ ] Analytics events (journey completion rate, task type distribution)

**Frontend:**
- [ ] Dynamic buddy greeting using weather data
- [ ] Personality-influenced dialogue in Discovery modals
- [ ] Seasonal event banner + event quest UI
- [ ] Premium badge on locked items in shop
- [ ] Bloom Token display for Rose users
- [ ] Journey shortcut progress indicator ("Tasks completed: saves 30 min")
- [ ] Mood degradation visual effects (wilting animations)
- [ ] First Aid shortcut on buddy home (launches Dr. Plant)
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
