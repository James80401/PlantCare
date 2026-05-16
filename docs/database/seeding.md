# Seeding

> **Navigation:** [Database INDEX](INDEX.md)

```bash
npm run db:seed
```

## Flow

1. **`prisma/seed.ts`** — upsert 240+ species from `data/species-catalog.ts`
2. **`prisma/seed-care-guides.ts`** — upsert guides + images per species × task type

## Data sources

| Path | Content |
|------|---------|
| `prisma/data/species-catalog.ts` | Species definitions |
| `prisma/data/care-guide-templates.ts` | Section templates |
| `prisma/data/care-guide-generator.ts` | Combines templates + species |
| `prisma/data/care-guide-classify.ts` | Category for template variants |

Re-run after catalog or guide changes.
