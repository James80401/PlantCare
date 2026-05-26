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

Acceptance check:

- [x] Plant profile care guide is easier to scan.
- [x] Task instructions modal remains accessible and mobile-friendly.
- [x] No backend schema changes required for this slice.

### Section 4 - Task feedback MVP

Goal: start collecting why users skip or complete care so future schedules can adapt.

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

Continue with **Section 10+ backlog** (task snooze, richer care metadata, deploy/UAT sign-off) or native packaging polish.

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

- [ ] Split care into consistent sections:
  - [ ] Water
  - [ ] Light
  - [ ] Soil
  - [ ] Humidity
  - [ ] Temperature
  - [ ] Fertilizer
  - [ ] Pruning
  - [ ] Repotting
  - [ ] Propagation
  - [ ] Pests and diseases
  - [ ] Toxicity and safety
- [ ] Add beginner and advanced versions of instructions.
- [ ] Add "why this matters" explanations to care sections.
- [ ] Add warning blocks for common mistakes.
- [ ] Tailor guidance by indoor/outdoor location.
- [ ] Tailor guidance by pot size and drainage.
- [ ] Tailor guidance by season and weather.
- [ ] Tailor guidance by growth stage.

## Phase 3 - More detailed plant data

### Species catalog expansion

- [ ] Expand houseplant coverage.
- [ ] Expand succulents and cacti.
- [ ] Expand herbs and edible plants.
- [ ] Expand vegetables and fruiting plants.
- [ ] Expand outdoor ornamentals, shrubs, and trees.
- [ ] Add native/pollinator-friendly plant metadata where available.

### Species attributes

- [ ] Add or normalize common names and scientific names.
- [ ] Add difficulty level.
- [ ] Add growth rate.
- [ ] Add mature size.
- [ ] Add bloom season.
- [ ] Add dormancy season.
- [ ] Add USDA/climate zone guidance.
- [ ] Add pet and child toxicity details.
- [ ] Add common pests.
- [ ] Add common diseases.
- [ ] Add propagation methods.
- [ ] Add soil pH and soil type guidance.
- [ ] Add humidity and temperature thresholds.

### Search and discovery

- [ ] Search by common name and scientific name.
- [ ] Add filters for pet-safe, low-light, beginner-friendly, edible, drought-tolerant, indoor, and outdoor plants.
- [ ] Add recommended plants based on user location and experience.
- [x] Add "complete your plant profile" suggestions when species data is missing.

## Phase 4 - Adaptive care intelligence

### Better task model

- [ ] Add task types for rotate, clean leaves, inspect pests, check soil moisture, harvest, stake/support, move indoors/outdoors, and flush soil.
- [ ] Add task feedback model:
  - [ ] soil still wet
  - [ ] soil very dry
  - [ ] plant looked healthy
  - [ ] plant looked stressed
  - [ ] rain handled outdoor watering
  - [ ] user was unavailable
- [ ] Add snooze and reschedule support.
- [ ] Add task completion notes.

### Adaptive scheduling

- [ ] Adjust watering when users repeatedly skip because soil is wet.
- [ ] Increase watering suggestions when users report dry soil.
- [ ] Delay outdoor watering after rain.
- [ ] Add heatwave and frost adjustments.
- [ ] Reduce fertilizer during dormancy.
- [ ] Add explicit user approval before applying major schedule changes.

## Phase 5 - Diagnosis and Dr. Plant

### Guided diagnosis

- [ ] Ask structured follow-up questions before diagnosis when useful.
- [ ] Capture symptom duration.
- [ ] Capture recent care changes.
- [ ] Capture environment changes.
- [ ] Capture pest visibility and leaf/root symptoms.
- [ ] Show confidence and alternative causes.
- [ ] Create recovery tasks from a diagnosis result.
- [ ] Track diagnosis resolution status.

### Dr. Plant context

- [ ] Include plant species and location context in chat prompts.
- [ ] Include recent tasks and skipped tasks.
- [ ] Include journal entries and diagnosis history.
- [ ] Let chat create tasks or journal notes through explicit actions.
- [ ] Add a recovery follow-up workflow.

## Phase 6 - Journal, progress, and engagement

### Journal timeline

- [ ] Build a richer plant journal timeline.
- [ ] Show photos, care actions, notes, diagnoses, and treatments together.
- [ ] Add growth measurements such as height, spread, and leaf count.
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
- [ ] Include targeted aggregates rather than duplicating large plant/task payloads.
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
