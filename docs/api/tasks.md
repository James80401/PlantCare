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

**Task types:** all 12 Prisma `TaskType` values (see schema). Instructions return structured sections when seeded (beginner/advanced toggle in web).

## Complete feedback

`PATCH /tasks/:id/complete` accepts an optional body:

```json
{
  "reason": "SOIL_VERY_DRY",
  "note": "Top two inches were bone dry."
}
```

Allowed reasons:

- `SOIL_VERY_DRY`
- `PLANT_LOOKS_STRESSED`
- `PLANT_LOOKS_HEALTHY`
- `OTHER`

Stored as `TaskFeedback` with `action: COMPLETE`. Repeated dry/stressed feedback on **WATER** completions can surface a **water-accelerate** schedule suggestion (see schedule suggestions below). Web: quick feedback panel on WATER complete in [`TaskRow.tsx`](../../apps/web/src/components/tasks/TaskRow.tsx).

## Skip feedback

`PATCH /tasks/:id/skip` still works with an empty body. Clients may also send:

```json
{
  "reason": "SOIL_STILL_WET",
  "note": "Soil was damp two inches down."
}
```

Allowed reasons:

- `SOIL_STILL_WET`
- `PLANT_LOOKS_HEALTHY`
- `RAIN_HANDLED_WATERING`
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
