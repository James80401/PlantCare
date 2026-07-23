# Database migrations

> **Navigation:** [Database INDEX](INDEX.md)

Dr. Plant keeps provider-specific schema and migration histories:

| Environment | Schema | Migration history |
|---|---|---|
| Fast local development/tests | `prisma/schema.prisma` (SQLite) | `prisma/migrations` |
| Staging/production/CI | `prisma/postgresql/schema.prisma` | `prisma/postgresql/migrations` |

Keep the models aligned; only provider-specific datasource behavior should
differ.

## PostgreSQL

Generate the client and deploy checked-in migrations:

```bash
npm run db:generate:postgres
npm run db:migrate:postgres
```

`npm run db:prepare:postgres` additionally supports the one-time transition
from the former `db push` production schema:

- an empty database applies the baseline normally;
- a non-empty database is marked baselined only after Prisma reports an empty
  diff against the canonical schema;
- any non-empty diff stops without changing migration history.

Container startup never changes the schema. Production deployment takes a
verified backup, performs this reconciliation when needed, then runs
`prisma migrate deploy`.

## Adding a production change

1. Update both schema files.
2. Create a PostgreSQL migration under
   `prisma/postgresql/migrations/<timestamp>_<purpose>/migration.sql`.
3. Prefer expand/contract: add compatible structures first, deploy application
   compatibility, and remove obsolete structures only in a later release.
4. Validate a fresh database, an existing-schema diff, and application
   rollback before release.
5. Never use `--accept-data-loss` in staging or production.

SQLite `db push` remains acceptable for disposable local databases and fast
tests; it is not a production deployment mechanism.
