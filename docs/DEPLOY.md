# Deployment (quick reference)

> **Navigation:** [operations/deployment.md](operations/deployment.md) · [operations/ci.md](operations/ci.md) · [Master INDEX](INDEX.md) · [README](../README.md)

This file is a **short checklist**. Full procedures live in [operations/deployment.md](operations/deployment.md).

## Docker

**Full local staging stack** (Postgres + API + web):

```powershell
npm run staging:smoke
```

See [operations/deployment.md](operations/deployment.md) for URLs and env vars.

**API only** (with host Postgres on 5433):

```bash
docker compose up -d postgres
docker compose -f docker-compose.staging.yml up -d --build api
```

**Web static assets** (built into `apps/web/Dockerfile` for staging):

```bash
npm run build -w @plant-care/web
# Or use docker-compose.staging.yml web service
```

## CI

GitHub Actions runs on push/PR: install, Prisma generate, API tests, web build. See [operations/ci.md](operations/ci.md).

## Production checklist

```powershell
copy .env.production.example .env.production
# Edit URLs and secrets, then:
npm run production:check
npm run production:up
```

- Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- `FRONTEND_URL`, `CORS_ORIGINS`, and `VITE_API_BASE_URL` must match your public HTTPS URLs
- Use managed PostgreSQL (RDS, Cloud SQL) or compose `postgres`
- `FCM_SERVER_KEY` for real push (see [operations/push-notifications.md](operations/push-notifications.md))
- Configure OpenAI, SMTP, S3, Stripe as needed
- Schedule nightly backups: `scripts/backup-production.sh` via cron (see [operations/backups.md](operations/backups.md))
- Post-deploy: `API_URL=... npm run verify` and `npm run smoke:buddy`

Full runbook: [guides/15-production-deploy-and-android.md](guides/15-production-deploy-and-android.md)
