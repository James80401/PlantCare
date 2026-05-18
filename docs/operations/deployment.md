# Deployment

> **Navigation:** [Operations INDEX](INDEX.md) · [DEPLOY.md](../DEPLOY.md)

## API Docker

`apps/api/Dockerfile` — multi-stage Node 20 build.

## Database

Production: PostgreSQL (`docker-compose.yml` or managed). Update `schema.prisma` provider + `DATABASE_URL`.

## Checklist

- Strong `JWT_*` secrets
- `CORS_ORIGIN` / `FRONTEND_URL` production URLs (must match the public web origin exactly)
- Run `db:migrate` or `db:push` + `db:seed`
- Configure OpenAI, SMTP, Stripe as needed
- S3 for uploads at scale

## Local Docker staging (recommended before a public host)

Runs Postgres + API + nginx web on **localhost** with production-like env vars:

| Service | URL |
|---------|-----|
| Web | http://localhost:8080 |
| API | http://localhost:3001/api/v1 |

```powershell
# From repo root (Windows)
copy .env.staging.example .env.staging
npm run staging:smoke
```

`staging:smoke` builds containers, waits for health, seeds 320 species, then runs `verify` + Playwright with `STAGING_E2E=1`.

Manual control:

```bash
copy .env.staging.example .env.staging   # or cp on macOS/Linux
npm run staging:up
npm run db:generate:postgres
set DATABASE_URL=postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public
set API_URL=http://localhost:3001/api/v1
set UAT_WEB_URL=http://localhost:8080
set STAGING_E2E=1
npm run verify
npm run uat:e2e
npm run staging:down
```

First API start runs `db push` + `db:seed` inside the container (several minutes).

## UAT / staging before sharing a link

Set in API `.env` (and redeploy):

```env
FRONTEND_URL=https://your-app.example.com
CORS_ORIGIN=https://your-app.example.com
```

Web build for production should use `VITE_API_BASE_URL` pointing at your public API.

After deploy, run smoke checks against staging:

```bash
API_URL=https://api.your-app.example.com/api/v1 npm run verify
UAT_WEB_URL=https://your-app.example.com STAGING_E2E=1 npm run uat:e2e
```

For remote hosts, point `DATABASE_URL` at the same Postgres as the API when running `verify` / Playwright global setup (or use `npm run db:generate:postgres` first).

Mark UAT checklist section F when URLs are live.
