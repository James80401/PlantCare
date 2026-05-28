# Plant Care improvement checklist

> Status: living implementation plan. Check items off as code, data, tests, and
> documentation land in the repository.

## Product north star

Plant Care should feel like a personalized daily plant assistant: it should tell
users what matters today, explain why each action matters, adapt to their
plants and environment, and make progress visible over time.

## How we will work through this

Use these sections as the implementation queue. Each section should be small
enough to finish, verify, and review independently before starting the next one.

For a **research-backed prioritized backlog** (impact, effort, code paths, and
shipped-vs-gap reconciliation), see [improvement-recommendations.md](improvement-recommendations.md).

### Section 0 - Completed foundation

Status: completed in the current branch.

- Mobile packaging and phone-preview workflow.
- Mobile-safe app shell and bottom navigation.
- First-pass `/garden` dashboard redesign.
- First-pass task row action improvements.
- Roadmap/checklist documentation.

Acceptance check:

- [x] Web build passes.
- [x] Existing web tests pass.
- [x] Full monorepo build passes.

### Section 1 - Dashboard polish and reliability

Goal: make the new dashboard reliable, testable, and easier to trust before
building more features on top of it.

- [x] Extract dashboard helper logic into small pure functions.
- [x] Add focused tests for:
  - [x] overdue task calculation
  - [x] garden score calculation
  - [x] attention plant selection
  - [x] suggested action selection
  - [x] seven-day preview counts
- [x] Fix any dashboard edge cases discovered by tests. No additional issues were found in Section 1 verification.
- [x] Add a short mobile QA checklist for dashboard states.

Mobile QA checklist:

- [x] Empty garden: hero copy, add-plant CTA, empty task state, and empty plant state are visible without horizontal scroll.
- [x] Active garden: metrics wrap cleanly, today care appears before attention cards, and bottom navigation does not cover final content.
- [x] Overdue state: overdue metric and urgent attention card are visually distinct from normal upcoming tasks.
- [x] All-caught-up state: dashboard explains that nothing is due and still offers a useful next action.
- [x] Weather note state: rain/weather messaging remains readable and does not dominate the dashboard.

Acceptance check:

- [x] `npm run test -w @plant-care/web` passes with dashboard tests.
- [x] `npm run build -w @plant-care/web` passes.
- [x] Empty garden, active garden, overdue task, and all-caught-up states are covered.

### Section 2 - Plant profile information architecture

Goal: make plant detail pages easier to navigate on mobile.

- [x] Convert the long plant profile page into clear sections.
- [x] Add compact top summary with:
  - [x] next task
  - [x] location
  - [x] base watering cadence
  - [x] sunlight
  - [x] toxicity warning when present
- [x] Add section navigation or tab-like anchors:
  - [x] Overview
  - [x] Care
  - [x] Tasks
  - [x] Journal
  - [x] Diagnosis
- [x] Improve empty states inside each profile section.

Acceptance check:

- [x] Plant detail remains build-safe.
- [x] Existing task completion and journal entry flows still work.
- [x] Mobile scroll path is clearer than the current long page.

### Section 3 - Care guide readability

Goal: improve care instructions using the data already returned by the API.

- [x] Standardize care section cards.
- [x] Add "what to do now" and "why this matters" presentation where content supports it.
- [x] Improve task instruction modal hierarchy.
- [x] Add warning/tip styling consistency.
- [x] Identify missing care-guide data that needs future content work. Future content work should add explicit structured fields for beginner/expert guidance and separate "why this matters" copy instead of deriving it from section headings.
- [x] Seed task care guides with structured fields for all 12 task types (B1/B2, 2026-05); verify with `scripts/verify-care-guides.mjs`.

Acceptance check:

- [x] Plant profile care guide is easier to scan.
- [x] Task instructions modal remains accessible and mobile-friendly; beginner/advanced toggle when structured sections are present.
- [x] No backend schema changes required for the original Section 3 slice (structured fields live in `sectionsJson`).

### Section 4 - Task feedback MVP

Goal: start collecting why users skip or complete care so future schedules can adapt.

> **2026-05:** Complete-time reasons shipped (A1); see Phase 4 adaptive scheduling for scheduler wiring.

- [x] Design minimal skip reason choices.
- [x] Add API/data model for task feedback.
- [x] Add skip reason UI.
- [x] Preserve current one-tap skip path where appropriate.
- [x] Add service/controller tests.

Acceptance check:

- [x] Skip reasons persist.
- [x] Existing task complete/skip flows still pass.
- [x] Dashboard can later use feedback without another schema redesign.

### Section 5 - Journal timeline upgrade

Goal: turn journal entries into a plant progress history.

- [x] Improve plant journal layout.
- [x] Show photos, notes, care actions, and diagnoses in one timeline when data is available.
- [x] Add stronger prompts for useful observations.
- [x] Add groundwork for growth measurements without requiring them yet. Implemented as guided note prompts; structured fields remain a later data-model enhancement.

Acceptance check:

- [x] Existing journal creation still works.
- [x] Empty and populated journal states are clear.
- [x] Timeline can later accept additional event types.

### Section 6 - Diagnosis context and recovery

Goal: make diagnosis feel connected to the plant profile and care history.

- [x] Improve diagnosis history presentation.
- [x] Add recovery/status affordances.
- [x] Identify prompt/context changes needed for Dr. Plant.
- [x] Add follow-up task creation design, then implementation. Implemented recovery status and journal follow-up notes now; documented the dedicated follow-up task API/data-model design for the next backend slice.

Acceptance check:

- [x] Diagnosis history is easy to review from a plant profile.
- [x] The next backend/API changes are explicit before implementation.

### Section 7 - Species data and discovery

Goal: make plant content richer and easier to browse/search.

- [x] Audit current species catalog fields and coverage.
- [x] Pick one plant category to expand first. Section 7 uses discovery facets derived from stable existing fields before adding new schema.
- [x] Add missing attributes in a structured way. Added repeatable catalog verification for core fields and discovery-filter coverage.
- [x] Improve search/discovery UI after data shape is stable.

Acceptance check:

- [x] Data additions have validation/verification scripts.
- [x] Search behavior remains fast enough for local testing.

### Section 8 - Adaptive scheduling

Goal: make recommendations change based on plant context, task history, feedback,
weather, and season.

- [x] Define schedule adjustment rules.
- [x] Add user-visible explanation for adjustments.
- [x] Require user approval for major changes.
- [x] Add scheduler tests around rule behavior.

Acceptance check:

- [x] Existing scheduler behavior is preserved where no feedback exists.
- [x] Adjustments are explainable and reversible.

### Section 9 - Engagement and shareability

Goal: make progress rewarding without making care feel punitive.

- [x] Add positive milestones.
- [x] Refine garden score into an encouraging signal.
- [x] Add gentle streaks.
- [x] Add shareable plant cards.

Acceptance check:

- [x] Engagement states are encouraging and optional.
- [x] No core care workflow depends on gamification.

### Current next slice

**Shipped (2026-05):** structured task care guides (B1/B2), complete-time feedback + water-accelerate suggestions (A1), weather-driven outdoor water postpone (A2).

Continue with **Dr. Plant context (C4)**, **FCM v1 + deploy sign-off (G1/G3)**, or **species catalog Phase 3 (B3)**. **C2** and **D1** shipped 2026-05. See [improvement-recommendations.md](improvement-recommendations.md) for the **Now** horizon.

## Phase 1 - Mobile-first shell and dashboard foundation

### Mobile shell

- [x] Add a mobile packaging path for the existing web app.
- [x] Add mobile web manifest and app metadata.
- [x] Support public preview/tunnel hosts for phone testing.
- [x] Add safe-area padding for top and bottom app chrome.
- [x] Make bottom navigation the primary mobile navigation pattern.
- [x] Add clear active states and accessible labels to navigation items.
- [x] Keep subscription/upgrade navigation discoverable on mobile (beta: upgrade hidden; Community on mobile nav).
- [x] Move repeated page bottom padding into shared layout rules where practical.
- [x] Review all tap targets for a minimum comfortable mobile hit area.

### User dashboard

- [x] Redesign `/garden` as the user command center.
- [x] Add a personalized greeting with date and garden status.
- [x] Show today's care as the first actionable section.
- [x] Surface overdue and urgent care separately from routine upcoming work.
- [ ] Add garden summary cards:
  - [x] total plants
  - [x] tasks due today
  - [x] overdue tasks
  - [x] completed tasks in the current range
  - [x] plants needing attention
- [x] Add plant attention cards for:
  - [x] missed/overdue care
  - [x] plants with no upcoming task
  - [x] plants with recent diagnosis issues
  - [x] plants missing useful profile data
- [x] Add a seven-day upcoming care preview.
- [x] Add a suggested next action section.
- [x] Add weather-aware messaging when weather data is available.
- [x] Add high-quality empty states for new users.

### Task experience

- [x] Make task rows easier to scan on mobile.
- [x] Use stronger visual hierarchy for plant, task type, due date, and status.
- [x] Make "how to do this" feel like a primary help action.
- [x] Make skip a button with an obvious affordance.
- [x] Add skip reasons in a later API iteration.
- [x] Add snooze/reschedule in a later API iteration.

## Phase 2 - Plant profile and care guide upgrades

### Plant profile information architecture

- [x] Convert plant profile into clear sections or tabs:
  - [x] Overview
  - [x] Care
  - [x] Tasks
  - [x] Journal
  - [x] Health (Diagnosis)
- [x] Keep the top summary compact on mobile.
- [x] Add next task, last care action, and health state near the hero.
- [x] Add clear edit affordances for location, pot size, notes, and image.
- [x] Add a sticky or compact section index if the profile remains long.

### Granular care guide structure

- [x] Split care into consistent sections:
  - [x] Water
  - [x] Light
  - [x] Soil
  - [x] Humidity
  - [x] Temperature
  - [x] Fertilizer
  - [x] Pruning
  - [x] Repotting
  - [x] Propagation
  - [x] Pests and diseases
  - [x] Toxicity and safety
- [x] Add beginner and advanced versions of instructions.
- [x] Add "why this matters" explanations to care sections.
- [x] Add warning blocks for common mistakes.
- [x] Tailor guidance by indoor/outdoor location.
- [x] Tailor guidance by pot size and drainage.
- [x] Tailor guidance by season and weather.
- [x] Tailor guidance by growth stage.

## Phase 3 - More detailed plant data

### Species catalog expansion

- [ ] Expand houseplant coverage.
- [ ] Expand succulents and cacti.
- [ ] Expand herbs and edible plants.
- [ ] Expand vegetables and fruiting plants.
- [ ] Expand outdoor ornamentals, shrubs, and trees.
- [ ] Add native/pollinator-friendly plant metadata where available.

### Species attributes

- [x] Add or normalize common names and scientific names (catalog seed).
- [x] Add difficulty level (inferred + browse tags).
- [x] Add growth rate, mature size, bloom/dormancy, propagation, soil type (inferred metadata).
- [x] Add USDA/climate zone guidance (hardiness zones in growing profile).
- [x] Add pet and child toxicity details (toxicity field + summary).
- [x] Add common pests and diseases (inferred metadata).
- [x] Add humidity and temperature thresholds (growing profile).

### Search and discovery

- [x] Search by common name and scientific name.
- [x] Discovery filters including high humidity, blooms indoors, pollinator-friendly.
- [x] Recommended plants based on experience and light (settings); bloom/pollinator scoring added.
- [x] Add "complete your plant profile" suggestions when species data is missing.

## Phase 4 - Adaptive care intelligence

> **Note:** Section 8 implemented much of this. Remaining Phase 4 items are tracked in [improvement-recommendations.md](improvement-recommendations.md) (A5, heat/frost rules).

### Better task model

- [x] Add task types for rotate, clean leaves, inspect pests, check soil moisture (see Prisma `TaskType`; harvest/move/flush still open).
- [x] Add task feedback model (skip reasons shipped via `TaskFeedback`):
  - [x] soil still wet
  - [x] soil very dry (complete-time on `PATCH /tasks/:id/complete`)
  - [x] plant looked healthy
  - [x] plant looked stressed (complete-time)
  - [x] rain handled outdoor watering
  - [x] user was unavailable (too busy / other)
- [x] Add snooze and reschedule support (`PATCH /tasks/:id/snooze`).
- [x] Add task completion notes (optional note on complete for all task types).

### Adaptive scheduling

- [x] Adjust watering when users repeatedly skip because soil is wet (schedule suggestions).
- [x] Increase watering suggestions when users report dry soil (repeated `SOIL_VERY_DRY` / `PLANT_LOOKS_STRESSED` on WATER complete → `water-accelerate` suggestion).
- [x] Delay outdoor watering after rain (manual skip + `autoPostponeOutdoorWateringFromWeather` when forecast cache ≥60% rain).
- [ ] Add heatwave and frost adjustments.
- [x] Reduce fertilizer during dormancy (suggestions).
- [x] Add explicit user approval before applying major schedule changes.

## Phase 5 - Diagnosis and Dr. Plant

### Guided diagnosis

- [ ] Ask structured follow-up questions before diagnosis when useful.
- [ ] Capture symptom duration.
- [ ] Capture recent care changes.
- [ ] Capture environment changes.
- [ ] Capture pest visibility and leaf/root symptoms.
- [ ] Show confidence and alternative causes.
- [x] Create recovery tasks from a diagnosis result (C2: confirm suggested tasks from `immediateActions`).
- [ ] Track diagnosis resolution status.

### Dr. Plant context

- [ ] Include plant species and location context in chat prompts.
- [ ] Include recent tasks and skipped tasks.
- [ ] Include journal entries and diagnosis history.
- [ ] Let chat create tasks or journal notes through explicit actions.
- [ ] Add a recovery follow-up workflow.

## Phase 6 - Journal, progress, and engagement

### Journal timeline

- [x] Build a richer plant journal timeline (`GET /plants/:id/timeline` + profile journal tab).
- [ ] Show photos, care actions, notes, diagnoses, and treatments together.
- [x] Add growth measurements such as height, spread, and leaf count (journal form + growth panel with trends).
- [ ] Add photo comparison views.
- [ ] Add prompts for useful observations after care tasks.

### Engagement

- [ ] Add plant milestones:
  - [ ] first plant added
  - [ ] first new leaf
  - [ ] first bloom
  - [ ] 30 days cared for
  - [ ] recovered from issue
  - [ ] successful propagation
- [ ] Add encouraging garden score.
- [ ] Add streaks without punishing missed days.
- [ ] Add shareable plant cards.

## Phase 7 - API and data architecture

### Dashboard aggregation

- [x] Add `GET /api/v1/dashboard` when the frontend dashboard outgrows client-side aggregation.
- [x] Include targeted aggregates rather than duplicating large plant/task payloads (`plants`, `sharedPlants`, `pendingTasks` on `GET /dashboard`).
- [ ] Add recent journal and diagnosis summaries across all user plants.
- [ ] Add care streak and garden score calculations server-side.

### Persistence additions

- [ ] Add `PlantEnvironment` or equivalent fields for light, humidity, drainage, soil, and growth stage.
- [ ] Add `TaskFeedback`.
- [ ] Add `TaskSnooze` or reschedule metadata.
- [ ] Add `PlantHealthLog`.
- [ ] Add `GrowthMeasurement`.
- [ ] Add `PlantMilestone`.
- [ ] Add `CarePreference` for beginner/advanced mode.

## Phase 8 - Quality gates

- [ ] Add focused component tests for dashboard summary calculations.
- [ ] Add API tests for any dashboard endpoint.
- [ ] Add mobile viewport QA checklist.
- [ ] Verify keyboard navigation and screen reader labels.
- [ ] Verify color contrast for warning/success states.
- [ ] Verify empty, loading, and error states.
- [ ] Verify public preview/mobile testing workflow stays documented.

## First implementation slice

- [x] Improve the existing `/garden` dashboard using current plant, task, user, and weather APIs.
- [x] Improve the authenticated layout for mobile-safe bottom navigation.
- [x] Improve task row action affordances.
- [x] Keep database/API additions for later phases unless a frontend improvement truly requires them.
