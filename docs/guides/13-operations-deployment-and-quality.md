# Guide 13 — Operations, deployment & quality

> **Navigation:** [Guides INDEX](INDEX.md) · [Operations INDEX](../operations/INDEX.md)

## Deployment targets

| Target | Doc |
|--------|-----|
| Local dev | [getting-started/running-services.md](../getting-started/running-services.md) |
| Docker staging | [operations/deployment.md](../operations/deployment.md) |
| Production checklist | [DEPLOY.md](../DEPLOY.md) |

---

## Docker staging stack

**Services** (`docker-compose.staging.yml`):

| Service | Port | Image |
|---------|------|--------|
| postgres | 5433 → 5432 | postgres:16-alpine |
| api | 3001 | `plantcare-api` (Nest + seed on start) |
| web | 8080 → 80 | `plantcare-web` (nginx + static Vite build) |

**Commands:**

```bash
cp .env.staging.example .env.staging
npm run docker:build
npm run staging:up
# Web http://localhost:8080
npm run staging:smoke   # verify + Playwright (STAGING_E2E=1)
npm run staging:down
```

**Windows:** scripts use `scripts/docker-cli.ps1` to find Docker Desktop binary.

**API entrypoint:** `apps/api/docker-entrypoint.sh` — `prisma db push`, `tsx prisma/seed.ts`, start Node.

---

## Production checklist

- Strong `JWT_SECRET` / `JWT_REFRESH_SECRET`
- Managed PostgreSQL; `schema.postgresql.prisma`
- `FRONTEND_URL` + `CORS_ORIGIN` match public web origin exactly
- `VITE_API_BASE_URL` reachable from users’ browsers
- S3 for uploads at scale
- Stripe webhook URL configured
- SMTP for transactional email
- Run migrations + seed on deploy

---

## CI

GitHub Actions: install, Prisma generate, API tests, web build.

Doc: [operations/ci.md](../operations/ci.md).

---

## Quality gates

| Gate | Command | Purpose |
|------|---------|---------|
| API unit tests | `npm run test` | Jest in API |
| Web unit tests | `npm run test -w @plant-care/web` | Vitest |
| Verify | `npm run verify` | ~44 API integration checks |
| Integrations | `npm run test:integrations` | SMTP + OpenAI |
| E2E | `npm run uat:e2e` | Playwright desktop + mobile |
| Care guides | `npx tsx scripts/verify-care-guides.mjs` | Content integrity |
| Species catalog | `npm run species:verify` | Catalog rules |

---

## Playwright E2E

- Config: `playwright.config.ts` (`workers: 1` for stability).
- Setup: `tests/e2e/global-setup.ts` creates UAT user; staging uses docker exec for DB helpers.
- Specs: `uat.spec.ts`, `onboarding.spec.ts`.

**Staging:**

```powershell
$env:API_URL = 'http://localhost:3001/api/v1'
$env:UAT_WEB_URL = 'http://localhost:8080'
$env:STAGING_E2E = '1'
npm run uat:e2e
```

Doc: [operations/testing.md](../operations/testing.md).

---

## Scripts reference

| Script | Role |
|--------|------|
| `scripts/verify.mjs` | API smoke |
| `scripts/deploy-staging.ps1` | Full staging smoke |
| `scripts/docker-build.ps1` | Build images only |
| `scripts/test-integrations.mjs` | External services |

Doc: [operations/scripts.md](../operations/scripts.md).

---

## Cron & background jobs

- Daily notification cron in API (`@nestjs/schedule`).
- Schedule suggestion generation on demand via tasks API.

---

## Monitoring (placeholders)

- Health: `GET /health` for load balancers.
- Logs: stdout from Nest in Docker.
- Add APM/error tracking per hosting provider.

---

## Related

- [02 — Development handbook](02-development-handbook.md)
- [09 — Integrations](09-integrations-and-external-services.md)
