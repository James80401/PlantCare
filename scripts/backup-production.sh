#!/bin/sh
# Nightly production backup — Postgres dump + uploads archive, with retention
# pruning and optional S3 offsite copy. Run on the VPS (cron-friendly):
#
#   cd /root/PlantCare && ./scripts/backup-production.sh
#
# Configuration (environment variables, all optional):
#   BACKUP_DIR        where backups are written   (default /var/backups/plantcare)
#   RETENTION_DAYS    local copies kept this long (default 14)
#   BACKUP_S3_BUCKET  if set, each backup is also copied to s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX
#   BACKUP_S3_PREFIX  key prefix inside the bucket (default "backups")
#
# Restore procedure: scripts/restore-production.sh and docs/operations/backups.md
set -e
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/plantcare}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

# Postgres credentials mirror docker-compose.production.yml's defaults; override
# via .env.production the same way the compose file does.
PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"
PGUSER="${PGUSER:-plantcare}"
PGDB="${PGDB:-plantcare}"

mkdir -p "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/db-$STAMP.dump"
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"

echo "==> pg_dump $PGDB -> $DB_FILE"
# Custom format (-Fc) so pg_restore can do selective / --clean restores.
$COMPOSE exec -T postgres pg_dump -U "$PGUSER" -d "$PGDB" --format=custom > "$DB_FILE"

echo "==> verify dump is readable"
# pg_restore --list parses the archive TOC; catches truncated/corrupt dumps now
# instead of during a disaster-recovery restore.
$COMPOSE exec -T postgres pg_restore --list < "$DB_FILE" > /dev/null

echo "==> archive uploads -> $UPLOADS_FILE"
$COMPOSE exec -T api tar czf - -C /app/apps/api uploads > "$UPLOADS_FILE"

echo "==> refresh latest symlinks"
ln -sf "$DB_FILE" "$BACKUP_DIR/db-latest.dump"
ln -sf "$UPLOADS_FILE" "$BACKUP_DIR/uploads-latest.tar.gz"

if [ -n "$BACKUP_S3_BUCKET" ]; then
  echo "==> offsite copy to s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/"
  aws s3 cp "$DB_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$DB_FILE")"
  aws s3 cp "$UPLOADS_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$UPLOADS_FILE")"
else
  echo "==> BACKUP_S3_BUCKET not set — skipping offsite copy (local only)"
fi

echo "==> prune local backups older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'db-*.dump' -type f -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -type f -mtime "+$RETENTION_DAYS" -delete

echo "Backup complete: $(du -h "$DB_FILE" | cut -f1) db, $(du -h "$UPLOADS_FILE" | cut -f1) uploads."
