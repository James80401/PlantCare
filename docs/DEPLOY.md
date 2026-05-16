# Deployment

> **See also:** [operations/deployment.md](operations/deployment.md) · [Master INDEX](INDEX.md) · [ReadMe](../ReadMe.md)

# Deployment

## Docker

Build and run API + Postgres:

```bash
docker compose up -d postgres
docker build -f apps/api/Dockerfile -t plant-care-api .
docker run --env-file .env -p 3001:3001 plant-care-api
```

Build web static assets:

```bash
npm run build -w @plant-care/web
# Serve apps/web/dist via CDN or nginx
```

## CI

GitHub Actions runs on push/PR: install, Prisma generate, API tests, web build.

## Production checklist

- Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Use managed PostgreSQL (RDS, Cloud SQL)
- Configure S3 for image uploads (`AWS_*`, `S3_BUCKET`)
- Set Stripe keys and webhook endpoint
- Configure SendGrid, Firebase, optional Perenual/PlantNet/HF keys
