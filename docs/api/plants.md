# API: Plants

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/plants/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/plants` | List user plants |
| POST | `/plants` | Create (+ schedule tasks) |
| GET | `/plants/:id` | Detail + `careOverview` |
| PATCH | `/plants/:id` | Update location/notes |
| DELETE | `/plants/:id` | Remove plant |
| POST | `/plants/identify` | Photo → species (PlantNet) |
| POST | `/plants/upload` | Upload image URL |

## Update {#update}

`PATCH /plants/:id` body (`UpdatePlantDto`):

```json
{ "location": "Outdoor garden", "notes": "South bed" }
```

If **location** changes → `tasksRescheduled: true` after regenerating pending tasks.

## Care overview {#care-overview}

Included in `GET /plants/:id` as `careOverview` from `CareGuidesService.buildPlantCareOverview`.

**DTOs:** `dto/create-plant.dto.ts`, `dto/update-plant.dto.ts`
