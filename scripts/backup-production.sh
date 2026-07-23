#!/bin/sh
# Consistent PostgreSQL and managed-upload backup for the production Compose stack.
set -eu

cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/plantcare}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

case "$BACKUP_DIR" in
  ""|"/"|"/var"|"/var/backups")
    echo "BACKUP_DIR is too broad: $BACKUP_DIR" >&2
    exit 1
    ;;
esac

PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"
if [ -z "$PGUSER" ] || [ -z "$PGDB" ]; then
  echo "POSTGRES_USER and POSTGRES_DB are required in .env.production." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
DB_FILE="$BACKUP_DIR/db-$STAMP.dump"
UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"
MANIFEST_FILE="$BACKUP_DIR/manifest-$STAMP.sha256"

cleanup_incomplete() {
  status=$?
  if [ "$status" -ne 0 ]; then
    rm -f "$DB_FILE" "$UPLOADS_FILE" "$MANIFEST_FILE"
  fi
  exit "$status"
}
trap cleanup_incomplete EXIT

echo "==> pg_dump $PGDB -> $DB_FILE"
$COMPOSE exec -T postgres pg_dump -U "$PGUSER" -d "$PGDB" --format=custom > "$DB_FILE"

echo "==> verify database archive"
$COMPOSE exec -T postgres pg_restore --list < "$DB_FILE" >/dev/null

echo "==> archive managed uploads -> $UPLOADS_FILE"
$COMPOSE exec -T api tar czf - -C /app/apps/api uploads > "$UPLOADS_FILE"
tar tzf "$UPLOADS_FILE" >/dev/null

echo "==> record checksums"
sha256sum "$DB_FILE" "$UPLOADS_FILE" > "$MANIFEST_FILE"
sha256sum --check "$MANIFEST_FILE"

ln -sfn "$DB_FILE" "$BACKUP_DIR/db-latest.dump"
ln -sfn "$UPLOADS_FILE" "$BACKUP_DIR/uploads-latest.tar.gz"
ln -sfn "$MANIFEST_FILE" "$BACKUP_DIR/manifest-latest.sha256"

if [ -n "${BACKUP_S3_BUCKET:-}" ]; then
  echo "==> copy verified backup set to configured offsite backup bucket"
  aws s3 cp "$DB_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$DB_FILE")"
  aws s3 cp "$UPLOADS_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$UPLOADS_FILE")"
  aws s3 cp "$MANIFEST_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$MANIFEST_FILE")"
fi

echo "==> prune local backup sets older than $RETENTION_DAYS days"
find "$BACKUP_DIR" -name 'db-*.dump' -type f -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -type f -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -name 'manifest-*.sha256' -type f -mtime "+$RETENTION_DAYS" -delete

trap - EXIT
echo "Backup complete:"
echo "  database: $DB_FILE"
echo "  uploads:  $UPLOADS_FILE"
echo "  manifest: $MANIFEST_FILE"
