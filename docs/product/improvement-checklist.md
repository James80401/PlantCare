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

- [ ] Extract dashboard helper logic into small pure functions.
- [ ] Add focused tests for:
  - [ ] overdue task calculation
  - [ ] garden score calculation
  - [ ] attention plant selection
  - [ ] suggested action selection
- [ ] Fix any dashboard edge cases discovered by tests.
- [ ] Add a short mobile QA checklist for dashboard states.

Acceptance check:

- [ ] `npm run test -w @plant-care/web` passes with dashboard tests.
- [ ] `npm run build -w @plant-care/web` passes.
- [ ] Empty garden, active garden, overdue task, and all-caught-up states are covered.

### Section 2 - Plant profile information architecture

Goal: make plant detail pages easier to navigate on mobile.

- [ ] Convert the long plant profile page into clear sections.
- [ ] Add compact top summary with:
  - [ ] next task
  - [ ] location
  - [ ] base watering cadence
  - [ ] sunlight
  - [ ] toxicity warning when present
- [ ] Add section navigation or tab-like anchors:
  - [ ] Overview
  - [ ] Care
  - [ ] Tasks
  - [ ] Journal
  - [ ] Diagnosis
- [ ] Improve empty states inside each profile section.

Acceptance check:

- [ ] Plant detail remains build-safe.
- [ ] Existing task completion and journal entry flows still work.
- [ ] Mobile scroll path is clearer than the current long page.

### Section 3 - Care guide readability

Goal: improve care instructions using the data already returned by the API.

- [ ] Standardize care section cards.
- [ ] Add "what to do now" and "why this matters" presentation where content supports it.
- [ ] Improve task instruction modal hierarchy.
- [ ] Add warning/tip styling consistency.
- [ ] Identify missing care-guide data that needs future content work.

Acceptance check:

- [ ] Plant profile care guide is easier to scan.
- [ ] Task instructions modal remains accessible and mobile-friendly.
- [ ] No backend schema changes required for this slice.

### Section 4 - Task feedback MVP

Goal: start collecting why users skip or complete care so future schedules can adapt.

- [ ] Design minimal skip reason choices.
- [ ] Add API/data model for task feedback.
- [ ] Add skip reason UI.
- [ ] Preserve current one-tap skip path where appropriate.
- [ ] Add service/controller tests.

Acceptance check:

- [ ] Skip reasons persist.
- [ ] Existing task complete/skip flows still pass.
- [ ] Dashboard can later use feedback without another schema redesign.

### Section 5 - Journal timeline upgrade

Goal: turn journal entries into a plant progress history.

- [ ] Improve plant journal layout.
- [ ] Show photos, notes, care actions, and diagnoses in one timeline when data is available.
- [ ] Add stronger prompts for useful observations.
- [ ] Add groundwork for growth measurements without requiring them yet.

Acceptance check:

- [ ] Existing journal creation still works.
- [ ] Empty and populated journal states are clear.
- [ ] Timeline can later accept additional event types.

### Section 6 - Diagnosis context and recovery

Goal: make diagnosis feel connected to the plant profile and care history.

- [ ] Improve diagnosis history presentation.
- [ ] Add recovery/status affordances.
- [ ] Identify prompt/context changes needed for Dr. Plant.
- [ ] Add follow-up task creation design, then implementation.

Acceptance check:

- [ ] Diagnosis history is easy to review from a plant profile.
- [ ] The next backend/API changes are explicit before implementation.

### Section 7 - Species data and discovery

Goal: make plant content richer and easier to browse/search.

- [ ] Audit current species catalog fields and coverage.
- [ ] Pick one plant category to expand first.
- [ ] Add missing attributes in a structured way.
- [ ] Improve search/discovery UI after data shape is stable.

Acceptance check:

- [ ] Data additions have validation/verification scripts.
- [ ] Search behavior remains fast enough for local testing.

### Section 8 - Adaptive scheduling

Goal: make recommendations change based on plant context, task history, feedback,
weather, and season.

- [ ] Define schedule adjustment rules.
- [ ] Add user-visible explanation for adjustments.
- [ ] Require user approval for major changes.
- [ ] Add scheduler tests around rule behavior.

Acceptance check:

- [ ] Existing scheduler behavior is preserved where no feedback exists.
- [ ] Adjustments are explainable and reversible.

### Section 9 - Engagement and shareability

Goal: make progress rewarding without making care feel punitive.

- [ ] Add positive milestones.
- [ ] Refine garden score into an encouraging signal.
- [ ] Add gentle streaks.
- [ ] Add shareable plant cards.

Acceptance check:

- [ ] Engagement states are encouraging and optional.
- [ ] No core care workflow depends on gamification.

### Current next slice

Start with **Section 1 - Dashboard polish and reliability**. It is the right next
step because the dashboard is now the main user surface, and tests/helper
extraction will make future iterations safer.

## Phase 1 - Mobile-first shell and dashboard foundation

### Mobile shell

- [x] Add a mobile packaging path for the existing web app.
- [x] Add mobile web manifest and app metadata.
- [x] Support public preview/tunnel hosts for phone testing.
- [x] Add safe-area padding for top and bottom app chrome.
- [x] Make bottom navigation the primary mobile navigation pattern.
- [x] Add clear active states and accessible labels to navigation items.
- [ ] Keep subscription/upgrade navigation discoverable on mobile.
- [ ] Move repeated page bottom padding into shared layout rules where practical.
- [ ] Review all tap targets for a minimum comfortable mobile hit area.

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
  - [ ] plants with recent diagnosis issues
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
- [ ] Add skip reasons in a later API iteration.
- [ ] Add snooze/reschedule in a later API iteration.

## Phase 2 - Plant profile and care guide upgrades

### Plant profile information architecture

- [ ] Convert plant profile into clear sections or tabs:
  - [ ] Overview
  - [ ] Care
  - [ ] Tasks
  - [ ] Journal
  - [ ] Diagnosis
- [ ] Keep the top summary compact on mobile.
- [ ] Add next task, last care action, and health state near the hero.
- [ ] Add clear edit affordances for location, pot size, notes, and image.
- [ ] Add a sticky or compact section index if the profile remains long.

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
- [ ] Add "complete your plant profile" suggestions when species data is missing.

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

- [ ] Add `GET /api/v1/dashboard` when the frontend dashboard outgrows client-side aggregation.
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
