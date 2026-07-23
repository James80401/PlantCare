# Backups and restore

> **Navigation:** [Operations INDEX](INDEX.md) · [Deployment](deployment.md) ·
> [Production sign-off](production-signoff.md)

Production uses PostgreSQL plus the managed local upload volume. A complete
backup always contains all three files:

| Artifact | Contents |
|---|---|
| `db-<stamp>.dump` | PostgreSQL custom-format dump |
| `uploads-<stamp>.tar.gz` | `/app/apps/api/uploads` |
| `manifest-<stamp>.sha256` | checksums for both artifacts |

Create and verify a backup on the production host:

```sh
cd /root/PlantCare
./scripts/backup-production.sh
```

The script checks `pg_restore --list`, validates the uploads tar, verifies the
checksums, refreshes `*-latest` symlinks, and prunes local sets older than
`RETENTION_DAYS` (14 by default). `BACKUP_DIR` defaults to
`/var/backups/plantcare`; broad unsafe paths are rejected. A configured
`BACKUP_S3_BUCKET` may receive an additional verified offsite backup copy, but
application uploads themselves remain local and canonical.

Schedule the command nightly and monitor its exit status and log.

## Non-destructive restore drill

Run this before relying on a backup:

```sh
./scripts/verify-backup-restore.sh \
  /var/backups/plantcare/db-<stamp>.dump \
  /var/backups/plantcare/uploads-<stamp>.tar.gz \
  /var/backups/plantcare/manifest-<stamp>.sha256
```

It restores into a uniquely named scratch PostgreSQL 16 container, extracts
uploads to a guarded temporary directory, reports user/plant/journal/diagnosis
and photo counts, and removes all scratch resources. It never connects to the
live database.

## Live restore

```sh
./scripts/restore-production.sh \
  /var/backups/plantcare/db-<stamp>.dump \
  /var/backups/plantcare/uploads-<stamp>.tar.gz \
  /var/backups/plantcare/manifest-<stamp>.sha256
```

The live restore requires typing `RESTORE`, verifies the backup before stopping
API writes, restores PostgreSQL and uploads, applies forward migrations with
`prisma migrate deploy`, starts the API, and requires readiness.

## Recorded drill

| Date (UTC) | Backup | Result |
|---|---|---|
| 2026-07-23 | `20260723T204909Z` | PASS — 10 users, 41 plants, 0 journals, 4 diagnoses, 31 photo references, and 210 managed upload files restored in isolation. |
