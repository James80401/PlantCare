# Operations scripts

> **Navigation:** [Operations INDEX](INDEX.md)

| Script | Command |
|--------|---------|
| Full API smoke | `node scripts/verify.mjs` (API running) |
| Care guide QA | `npx tsx scripts/verify-care-guides.mjs` |
| Integrations | `npm run test:integrations` |
| Download photos | `node apps/api/scripts/download-care-guide-photos.mjs` |
| Copy guide assets | Part of `npm run build` (api) |

`verify.mjs` auto-verifies test users in DB when SMTP enabled.
