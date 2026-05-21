# Testing

> **Navigation:** [Operations INDEX](INDEX.md)

## API (Jest)

```bash
npm run test
```

Specs:

- `scheduler.service.spec.ts`
- `growing-environment.spec.ts`

## Web (Vitest)

```bash
npm run test -w @plant-care/web
```

- `AuthContext.test.tsx`

## Verify script

```bash
npm run verify
```

API smoke checks (`scripts/verify.mjs`). For Docker staging, set `STAGING_E2E=1` and `API_URL` — see [guides/13-operations-deployment-and-quality.md](../guides/13-operations-deployment-and-quality.md).

## Playwright E2E

```bash
npm run uat:e2e
```

- Config: `playwright.config.ts` (desktop + mobile projects, `workers: 1`)
- Setup: `tests/e2e/global-setup.ts` (creates UAT user; staging uses Postgres via `docker exec`)
- Specs: `tests/e2e/uat.spec.ts`, `tests/e2e/onboarding.spec.ts`

**Staging:**

```powershell
$env:UAT_WEB_URL = 'http://localhost:8080'
$env:API_URL = 'http://localhost:3001/api/v1'
$env:STAGING_E2E = '1'
npm run uat:e2e
```

Or full flow: `npm run staging:smoke`.

## Documentation

```bash
npm run verify:docs
```

Validates relative links under `docs/`. When changing `apps/web/src/pages/*.tsx`, update the matching [user-guide](../user-guide/INDEX.md) or [tutorial](../tutorials/INDEX.md) in the same change when behavior visible to users changes.
