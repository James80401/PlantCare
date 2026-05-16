# Deployment

> **Navigation:** [Operations INDEX](INDEX.md) · [DEPLOY.md](../DEPLOY.md)

## API Docker

`apps/api/Dockerfile` — multi-stage Node 20 build.

## Database

Production: PostgreSQL (`docker-compose.yml` or managed). Update `schema.prisma` provider + `DATABASE_URL`.

## Checklist

- Strong `JWT_*` secrets
- `CORS_ORIGIN` / `FRONTEND_URL` production URLs
- Run `db:migrate` or `db:push` + `db:seed`
- Configure OpenAI, SMTP, Stripe as needed
- S3 for uploads at scale
