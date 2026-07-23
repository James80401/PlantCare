# Deployment

> **Navigation:** [Operations INDEX](INDEX.md) ·
> [Production sign-off](production-signoff.md)

## Release contract

GitHub Actions deploys only a full commit SHA that has a successful `CI` push
run. Production deploy concurrency never cancels an in-progress release.

The remote release script performs, in order:

1. configuration and Compose validation;
2. verified database/uploads backup;
3. preservation of the current application images;
4. build of the exact tested SHA;
5. guarded PostgreSQL baseline reconciliation and `migrate deploy`;
6. explicit idempotent catalog synchronization with before/after counts;
7. one-time legacy database-password rotation when required;
8. container start, readiness, and non-mutating live sign-off.

If application readiness or sign-off fails after containers change, the
preserved API/web images are restored. The rollback overlay starts even a
legacy API image with the runtime-only entrypoint, so rollback cannot invoke
the removed `db push` behavior. Database changes follow expand/contract rules
and are not rolled back automatically.

The last successful application SHA is recorded in `.deployed-sha`. Rollback
tags are made from the images used by the running containers, not mutable local
image tags. The release checkout remains available until the rollback API is
healthy, so recovery tooling cannot disappear during rollback.

Production configuration must pass:

```sh
node scripts/check-production-env.mjs .env.production
docker compose -f docker-compose.production.yml \
  --env-file .env.production config --quiet
```

Database names, user, password, and URL are explicit. Buddy, demo data, and
Premium billing remain disabled. Supported FCM, Twilio, SMTP, AI, plant, and
Sentry settings are passed to the API; incomplete credential groups fail
preflight or are reported unavailable.

## Staging

```powershell
copy .env.staging.example .env.staging
npm run staging:check
npm run staging:smoke
```

The staging script starts PostgreSQL first, prepares the checked-in PostgreSQL
migration history, seeds explicitly, starts the application, and then runs
integration and Playwright checks. Production sign-off never creates users or
mutates application data.

## Database and storage

- PostgreSQL schema: `prisma/postgresql/schema.prisma`
- PostgreSQL migrations: `prisma/postgresql/migrations`
- Managed uploads: `plantcare_prod_uploads`
- Backup/restore procedure: [backups.md](backups.md)

The API container entrypoint only starts Node. It never migrates or seeds.
