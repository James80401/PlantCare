# Care guide verification

> **Navigation:** [Care guides INDEX](INDEX.md)

```bash
npx tsx scripts/verify-care-guides.mjs
```

Checks:

- Guide coverage per species × task type
- Section depth
- Asset files exist on disk

Run after `npm run db:seed`.
