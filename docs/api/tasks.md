# API: Tasks

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/tasks/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks?from=&to=` | Tasks in date range |
| GET | `/tasks/schedule-suggestions` | Explainable adaptive schedule suggestions |
| POST | `/tasks/schedule-suggestions/:suggestionId/apply` | Apply an approved schedule suggestion |
| PATCH | `/tasks/:id/complete` | Mark done + schedule next; optional feedback body |
| PATCH | `/tasks/:id/skip` | Skip task, optionally with feedback |
| GET | `/tasks/:id/instructions` | Care guide payload |

## Instructions {#instructions}

Returns `TaskInstructionsDto`: title, summary, sections (markdown body + images), `isSpeciesSpecific`.

**Service chain:** `TasksService` → `CareGuidesService.getInstructionsForTask`

**Task types:** the shipped system intentionally uses the 12 Prisma `TaskType`
values: `WATER`, `FERTILIZE`, `PRUNE`, `MIST`, `PH_TEST`, `PEST_CONTROL`,
`REPOT`, `ROTATE`, `CLEAN_LEAVES`, `INSPECT_PESTS`, `CHECK_MOISTURE`, and
`HEALTH_CHECK`. Instructions return structured sections when seeded
(beginner/advanced toggle in web).

Task labels and user-facing prompts are backed by shared task metadata in
`@plant-care/shared`. Older backlog mentions such as harvest, move, and flush
are not active task types; add them only after defining scheduling behavior,
guide coverage, feedback semantics, and Dr. Plant context.

## Complete feedback

`PATCH /tasks/:id/complete` accepts an optional body:

```json
{
  "reason": "SOIL_VERY_DRY",
  "note": "Top two inches were bone dry."
}
```

Allowed reasons for watering-specific feedback:

- `SOIL_VERY_DRY`
- `PLANT_LOOKS_STRESSED`
- `PLANT_LOOKS_HEALTHY`
- `OTHER`

Allowed reasons for non-water task results:

- `ROUTINE_CARE_DONE`
- `PLANT_LOOKS_STRESSED`
- `PLANT_LOOKS_HEALTHY`
- `OTHER`

Stored as `TaskFeedback` with `action: COMPLETE`. Repeated dry/stressed feedback
on **WATER** completions can surface a **water-accelerate** schedule suggestion
(see schedule suggestions below). Web: the task row shows task-type-aware
feedback prompts. If the user explicitly checks "Also save this note to
journal," the web client creates a separate journal entry after the task
completion succeeds; the task API itself does not create that journal entry.

## Skip feedback

`PATCH /tasks/:id/skip` still works with an empty body. Clients may also send:

```json
{
  "reason": "SOIL_STILL_WET",
  "note": "Soil was damp two inches down."
}
```

Allowed reasons for water/moisture checks:

- `SOIL_STILL_WET`
- `PLANT_LOOKS_HEALTHY`
- `RAIN_HANDLED_WATERING`
- `TOO_BUSY`
- `OTHER`

For non-water care tasks, clients should prefer general skip reasons:

- `PLANT_LOOKS_HEALTHY`
- `TOO_BUSY`
- `OTHER`

Feedback is stored in `TaskFeedback` for later adaptive scheduling work.

## Adaptive schedule suggestions

Suggestions are generated from task feedback, season, and plant context. They do
not change schedules until the user approves one.

Current suggestion types:

- Water less often after repeated wet-soil skips.
- Water sooner after repeated dry-soil or stressed-plant **complete** feedback on watering (`water-accelerate`).
- Delay the next outdoor watering after rain handled watering (skip feedback).
- Forecast-based rain delay for outdoor/semi-outdoor plants when weather cache shows high rain probability (dashboard copy; auto-postpone may shift due dates on load).
- Forecast-based heat stress moisture check for outdoor/semi-outdoor plants when highs reach 35C or higher.
- Forecast-based frost protection health check for outdoor/semi-outdoor plants when lows reach 0C or lower.
- Delay fertilizer outside the growing season.

Applying a suggestion only updates pending tasks returned by the suggestion.

Routine Plant Life progress prompts are handled by durable `PLANT_CHECK_IN`
recommendations. `HEALTH_CHECK` tasks are still used for explicit diagnosis
follow-ups, weather protection checks, and user-confirmed one-off task actions.
