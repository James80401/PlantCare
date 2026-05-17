# Plant Care improvement checklist

> Status: living implementation plan. Check items off as code, data, tests, and
> documentation land in the repository.

## Product north star

Plant Care should feel like a personalized daily plant assistant: it should tell
users what matters today, explain why each action matters, adapt to their
plants and environment, and make progress visible over time.

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
