# API: Species

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/species/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/species/search?q=` | Search catalog (local DB) |
| GET | `/species/:id` | Species detail |

**PerenualService** optionally enriches from external API when key set.

Seed data: `prisma/data/species-catalog.ts`
