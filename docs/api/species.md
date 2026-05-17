# API: Species

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/species/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/species/search?q=` | Search catalog (local DB) |
| GET | `/species/:id` | Species detail |

**PerenualService** optionally enriches from external API when key set.

Seed data: `prisma/data/species-catalog.ts`

## Discovery filters

`GET /species/search` accepts optional boolean query filters:

- `petSafe`
- `lowLight`
- `edible`
- `droughtTolerant`
- `indoor`
- `outdoor`

Example:

```http
GET /species/search?q=&petSafe=true&lowLight=true
```

Filters are derived from stable local species fields: `sunlight`,
`wateringFreqDays`, `toxicity`, `commonName`, `scientificName`, and `careNotes`.
Results include `discoveryTags` for UI badges.

Verification: `npm run species:verify`
