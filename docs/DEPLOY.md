# Deployment

> **See also:** [operations/deployment.md](operations/deployment.md) · [Master INDEX](INDEX.md) · [ReadMe](../ReadMe.md)

# Deployment

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

GitHub Actions runs on push/PR: install, Prisma generate, API tests, web build.

## Production checklist

- Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Use managed PostgreSQL (RDS, Cloud SQL)
- Configure S3 for image uploads (`AWS_*`, `S3_BUCKET`)
- Set Stripe keys and webhook endpoint
- Configure SendGrid, Firebase, optional Perenual/PlantNet/HF keys
