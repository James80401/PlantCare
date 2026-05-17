# API: Tasks

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/tasks/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks?from=&to=` | Tasks in date range |
| GET | `/tasks/schedule-suggestions` | Explainable adaptive schedule suggestions |
| POST | `/tasks/schedule-suggestions/:suggestionId/apply` | Apply an approved schedule suggestion |
| PATCH | `/tasks/:id/complete` | Mark done + schedule next |
| PATCH | `/tasks/:id/skip` | Skip task, optionally with feedback |
| GET | `/tasks/:id/instructions` | Care guide payload |

## Instructions {#instructions}

Returns `TaskInstructionsDto`: title, summary, sections (markdown body + images), `isSpeciesSpecific`.

**Service chain:** `TasksService` → `CareGuidesService.getInstructionsForTask`

**Task types:** `WATER`, `FERTILIZE`, `PRUNE`, `MIST`, `PH_TEST`, `PEST_CONTROL`, `REPOT`

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
- Delay the next outdoor watering after rain handled watering.
- Delay fertilizer outside the growing season.

Applying a suggestion only updates pending tasks returned by the suggestion.
