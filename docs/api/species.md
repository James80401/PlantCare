# API: Species

> **Navigation:** [API INDEX](INDEX.md) · `apps/api/src/species/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/species/search?q=` | Search catalog (local DB) |
| GET | `/species/:id` | Species detail |
| GET | `/species/recommended?limit=` | Personalized picks for the current user |

**PerenualService** optionally enriches from external API when key set.

## Recommendations (shipped)

`GET /species/recommended` scores the catalog against the user's
`experienceLevel` and `defaultLightLevel` and returns:

- `items[]` — enriched species, each with `matchReasons: string[]` ("why
  recommended" chips such as `Easy to care for`, `Tolerates low light`,
  `Pet-safe`, `Blooms indoors`, `Pollinator favorite`).
- `reason` — one overall label for the list (e.g. *"Recommended beginner-friendly
  picks suited to lower light."*).

Scoring + per-plant reasons are produced by the pure
`species-recommendation-scoring.ts` (`scoreSpeciesFit`), so the score and the
explanation copy can't drift. The web Browse "Recommended for you" rail renders
the per-plant `matchReasons` as chips.

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
