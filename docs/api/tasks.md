# API: Tasks

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/tasks/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks?from=&to=` | Tasks in date range |
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
