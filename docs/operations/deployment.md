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
UAT_WEB_URL=https://your-app.example.com npm run uat:e2e
```

Mark UAT checklist section F when URLs are live.
