# Task scheduling

> **Navigation:** [Architecture INDEX](INDEX.md) · [API tasks](../api/tasks.md)

**Service:** `apps/api/src/scheduler/scheduler.service.ts`

## On plant create or location change

1. Delete all **PENDING** tasks for plant
2. Generate ~90 days:
   - **WATER** — `wateringFreqDays × potMultiplier` (min 2 days)
   - **PRUNE** — every 30 days
   - **PREMIUM only:**
     - **FERTILIZE** — monthly in growing season (Apr–Sep)
     - **MIST** — every 3 days (max 10) if `shouldScheduleMist(env, category)`

## Mist gating

Uses `growing-environment.ts` — outdoor and succulent/cactus skip mist.

## On task complete

Creates next task at `completedAt + interval`. Mist may not reschedule if rules disallow.

## Rain

- `postponeWateringForRain(plantId, days)` shifts pending outdoor/semi-outdoor **WATER** tasks due in the near window.
- `autoPostponeOutdoorWateringFromWeather(userId)` runs when tasks or plants are loaded for a user: if `weatherAdviceCache` shows ≥60% rain probability on either of the next two forecast days, pending outdoor watering tasks due tomorrow–day after are postponed (same helper as manual rain handling).

## Adaptive suggestions

`SchedulerService.getScheduleSuggestionsForUser` creates explainable suggestions
without changing schedules automatically. Current rules:

- Repeated `SOIL_STILL_WET` skip feedback on watering suggests shifting the next
  few water tasks 2 days later.
- Repeated `SOIL_VERY_DRY` or `PLANT_LOOKS_STRESSED` **complete** feedback on watering suggests **water-accelerate** (shift next water tasks earlier, clamped to not before today).
- `RAIN_HANDLED_WATERING` skip feedback for outdoor plants suggests delaying the next
  water task 2 days.
- Dashboard may surface forecast rain delay when weather cache qualifies (companion to auto-postpone).
- Fertilizer reminders outside the main growing season suggest delaying the next
  fertilizer task 30 days.

Suggestions are shown on the dashboard. Users must approve a suggestion before
`applyScheduleSuggestion` updates pending tasks.
