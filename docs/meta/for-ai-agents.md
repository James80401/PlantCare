# Documentation guide for AI agents

> **Navigation:** [Meta INDEX](INDEX.md) · [Master INDEX](../INDEX.md) · [Documentation map](documentation-map.md)

## Purpose

This doc set is structured for **top-down navigation**: broad INDEX → layer INDEX → leaf topic. Do not rely on repo-wide search alone when a INDEX path exists.

## Recommended workflow

1. **Classify the question**
   - *Run/build* → `docs/getting-started/`
   - *UI behavior* → `docs/user-guide/` or `docs/web/`
   - *HTTP/API* → `docs/api/`
   - *Schema/data* → `docs/database/`
   - *Care text/tasks* → `docs/care-guides/` + `docs/architecture/scheduling.md`
   - *External service* → `docs/integrations/`
   - *Deploy/CI* → `docs/operations/`

2. **Open the layer INDEX** (e.g. `docs/api/INDEX.md`)

3. **Open the leaf doc** (e.g. `docs/api/plants.md`)

4. **Read source** only for implementation detail not covered in docs

## Key source anchors (when docs are insufficient)

| Concern | Primary files |
|---------|----------------|
| App bootstrap | `apps/api/src/main.ts`, `apps/api/src/app.module.ts` |
| Routes (web) | `apps/web/src/App.tsx` |
| API client | `apps/web/src/services/api.ts` |
| Schema | `prisma/schema.prisma` |
| Task generation | `apps/api/src/scheduler/scheduler.service.ts` |
| Care personalization | `apps/api/src/care-guides/care-guides.service.ts` |
| Indoor/outdoor mist | `apps/api/src/care-guides/growing-environment.ts` |
| Guide seed data | `prisma/data/care-guide-templates.ts`, `prisma/seed-care-guides.ts` |
| Dr. Plant chat | `apps/api/src/diagnosis/diagnosis-chat.service.ts`, `apps/web/src/components/DrPlantChat.tsx` |

## Conventions

- **INDEX.md** in each folder = table of contents for that layer
- Leaf docs include a **Navigation** line linking parent INDEX
- Paths in docs are relative to repo root `PlantCare/`
- API prefix is always `/api/v1` unless noted

## Do not

- Commit or quote contents of `.env` (secrets)
- Assume PostgreSQL in dev — default is **SQLite** (`DATABASE_URL=file:./prisma/dev.db`)
- Assume Stripe is required — dev often uses `ALL_USERS_PREMIUM=true`

## Updating docs

When changing behavior, update the leaf doc + parent INDEX + [documentation-map.md](documentation-map.md) feature row in [../INDEX.md](../INDEX.md).
