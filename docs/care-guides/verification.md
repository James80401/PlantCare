# Care guide verification

> **Navigation:** [Care guides INDEX](INDEX.md)

```bash
npx tsx scripts/verify-care-guides.mjs
```

Run after `npm run db:seed` or `npx tsx prisma/seed-care-guides.ts`.

## Checks

- Species guide coverage (~species count × 12 task types)
- Generic guide exists per task type
- **Structured fields** on every generic guide: `whyItMatters`, `beginnerBody`, `advancedBody` on all sections (all 12 task types)
- Sample depth: section count and content length per task type
- Basil and Snake Plant WATER species guides include structured fields
- Runtime placeholders (e.g. `{waterIntervalDays}`) preserved in seed JSON
- All `CareGuideImage` keys resolve to files on disk
- Reference photos meet minimum byte size (not placeholders)

## Task-type section counts (generic guides)

| Task type | Sections |
|-----------|----------|
| WATER | 7 |
| FERTILIZE | 6 |
| PRUNE | 6 |
| MIST | 5 |
| PH_TEST | 5 |
| REPOT | 5 |
| PEST_CONTROL, INSPECT_PESTS | 4 |
| ROTATE, CLEAN_LEAVES, CHECK_MOISTURE, HEALTH_CHECK | 3 |

Failures exit non-zero — suitable for CI after seed in test environments.
