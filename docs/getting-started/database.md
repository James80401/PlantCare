# Database setup

> **Navigation:** [Getting started INDEX](INDEX.md) · [Database layer](../database/INDEX.md)

## Default: SQLite (development)

`prisma/schema.prisma` uses `provider = "sqlite"`. Database file: `prisma/dev.db`.

```bash
npm run db:generate   # Prisma client
npm run db:push       # Apply schema
npm run db:seed       # Species + care guides
```

## PostgreSQL (optional)

1. Start Postgres: `docker compose up -d` (port **5433** on host)
2. Change `provider` to `postgresql` in `schema.prisma`
3. Set `DATABASE_URL=postgresql://plantcare:plantcare@localhost:5433/plantcare`
4. `npm run db:push` and `npm run db:seed`

## After schema changes

```bash
npm run db:push
npm run db:seed    # if seed data changed
```

## See also

- [Seeding](../database/seeding.md)
- [Schema reference](../database/schema-reference.md)
