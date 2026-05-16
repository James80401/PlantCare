# Shared package (`@plant-care/shared`)

> **Navigation:** [Reference INDEX](INDEX.md) · `packages/shared/src/index.ts`

## Exports

| Export | Values |
|--------|--------|
| `PlanTier` | FREE, PREMIUM |
| `TaskType` | WATER, FERTILIZE, PRUNE, MIST, PH_TEST, PEST_CONTROL, REPOT |
| `TaskStatus` | PENDING, DONE, SKIPPED |
| `NotificationChannel` | PUSH, EMAIL, SMS |
| `PotSize` | SMALL, MEDIUM, LARGE |
| `FREE_PLANT_LIMIT` | 5 |
| `FREE_IDENTIFY_MONTHLY_LIMIT` | 3 |

Prisma schema duplicates enums for DB — keep in sync when adding values.

Build: `npm run build -w @plant-care/shared` (runs before api in root `build`).
