# Continuous integration

> **Navigation:** [Operations INDEX](INDEX.md) · `.github/workflows/ci.yml`

On push/PR:

1. Install dependencies
2. `db:push` + `db:seed`
3. Build `@plant-care/shared`
4. API `npm run test`
5. Web `npm run build`

SQLite used in CI (same as local default).
