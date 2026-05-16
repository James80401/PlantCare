# API: Tasks

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/tasks/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks?from=&to=` | Tasks in date range |
| PATCH | `/tasks/:id/complete` | Mark done + schedule next |
| PATCH | `/tasks/:id/skip` | Skip task |
| GET | `/tasks/:id/instructions` | Care guide payload |

## Instructions {#instructions}

Returns `TaskInstructionsDto`: title, summary, sections (markdown body + images), `isSpeciesSpecific`.

**Service chain:** `TasksService` → `CareGuidesService.getInstructionsForTask`

**Task types:** `WATER`, `FERTILIZE`, `PRUNE`, `MIST`, `PH_TEST`, `PEST_CONTROL`, `REPOT`
