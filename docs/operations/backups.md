# Backups & restore

> **Navigation:** [Operations INDEX](INDEX.md) · [Deployment](deployment.md) · [Production sign-off](production-signoff.md)

What gets backed up, how to schedule it, how to restore it, and how to prove the
restore actually works. Everything runs on the VPS against the
`docker-compose.production.yml` stack.

---

## What a backup contains

| Artifact | Source | Format |
|----------|--------|--------|
| `db-<stamp>.dump` | `postgres` service (`plantcare` database) | `pg_dump --format=custom` — supports selective and `--clean` restores via `pg_restore` |
| `uploads-<stamp>.tar.gz` | `plantcare_prod_uploads` volume (plant/journal/diagnosis photos) | gzip tar of `/app/apps/api/uploads` |

Both are written to `BACKUP_DIR` (default `/var/backups/plantcare`) with
`db-latest.dump` / `uploads-latest.tar.gz` symlinks pointing at the newest pair.
Every dump is verified readable (`pg_restore --list`) at backup time, so a
corrupt or truncated dump fails the backup run — not the disaster recovery.

> If `S3_BUCKET` is configured for app uploads, photos already live off-box in
> S3; the uploads archive is then belt-and-braces. With local disk uploads
> (the current default), the archive is the **only** copy — do not skip it.

## One-time setup on the VPS

```sh
cd /root/PlantCare

# 1. Sanity-run once by hand
./scripts/backup-production.sh

# 2. Schedule nightly at 03:17 UTC (offset avoids the top-of-hour crowd)
crontab -e
# add:
17 3 * * * cd /root/PlantCare && ./scripts/backup-production.sh >> /var/log/plantcare-backup.log 2>&1

# 3. Confirm the log after the first scheduled night
tail /var/log/plantcare-backup.log
```

### Offsite copies (strongly recommended)

Local backups die with the droplet. Set these in the cron environment (or
export them in a wrapper) to also copy each backup to S3-compatible storage
(requires `aws` CLI configured on the VPS — DigitalOcean Spaces works with
`aws --endpoint-url`):

```sh
BACKUP_S3_BUCKET=my-backup-bucket   # enables offsite copy
BACKUP_S3_PREFIX=backups            # optional, default "backups"
```

### Retention

Local copies older than `RETENTION_DAYS` (default 14) are pruned at the end of
each run. Offsite retention is governed by the bucket's lifecycle policy — set
one (e.g. expire after 90 days, keep 12 monthly copies) rather than letting the
bucket grow forever.

## Restoring

```sh
cd /root/PlantCare
./scripts/restore-production.sh /var/backups/plantcare/db-<stamp>.dump \
    /var/backups/plantcare/uploads-<stamp>.tar.gz   # uploads archive optional
```

The script:

1. verifies the dump is readable **before** touching anything,
2. asks you to type `RESTORE` (it is destructive — the live database is replaced),
3. stops the `api` container so nothing writes mid-restore,
4. runs `pg_restore --clean --if-exists --no-owner` into the live database,
5. restarts the API and, if given, untars the uploads archive back into the volume.

Afterwards run the standard live checks:

```sh
API_URL=https://api.drplant.app npm run verify
```

> **Schema drift:** a dump restores the schema it was taken with. If the app
> has deployed schema changes since the backup, redeploy (`scripts/deploy-on-server.sh`)
> after restoring so `prisma db push` re-applies the current schema.

## Prove it works (quarterly)

A backup that has never been restored is a hope, not a backup. Once a quarter:

1. Copy the latest `db-*.dump` to a scratch machine (or the staging stack).
2. Restore it into a fresh Postgres (`pg_restore --create` into `docker run postgres:16-alpine`).
3. Spot-check: user count, a recent journal entry, a plant photo path.
4. Note the date and result in this file's log below.

| Date | Restored dump | Result |
|------|---------------|--------|
| _none yet_ | | |
