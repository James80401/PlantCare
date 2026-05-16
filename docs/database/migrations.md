# Migrations

> **Navigation:** [Database INDEX](INDEX.md)

## Local dev (common)

```bash
npm run db:push    # Sync schema without migration files
```

Repo may not ship `prisma/migrations/` — push is the typical dev workflow.

## Production

```bash
npm run db:migrate
```

For PostgreSQL, update `provider` and `DATABASE_URL` first.
