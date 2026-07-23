#!/bin/sh
# Restore a production backup into an isolated PostgreSQL container and scratch
# upload directory. This never connects to or mutates the live database.
set -eu

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <db.dump> <uploads.tar.gz> [manifest.sha256]" >&2
  exit 1
fi

DB_FILE="$1"
UPLOADS_FILE="$2"
MANIFEST_FILE="${3:-}"

for path in "$DB_FILE" "$UPLOADS_FILE"; do
  if [ ! -f "$path" ]; then
    echo "Backup file not found: $path" >&2
    exit 1
  fi
done

if [ -n "$MANIFEST_FILE" ]; then
  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "Manifest not found: $MANIFEST_FILE" >&2
    exit 1
  fi
  (cd "$(dirname "$MANIFEST_FILE")" && sha256sum --check "$(basename "$MANIFEST_FILE")")
fi

pg_restore --list "$DB_FILE" >/dev/null 2>&1 || {
  echo "Host pg_restore could not read the dump; Docker validation will continue."
}
tar tzf "$UPLOADS_FILE" >/dev/null

STAMP="$(date -u +%Y%m%d%H%M%S)-$$"
CONTAINER="plantcare-restore-drill-$STAMP"
SCRATCH_DIR="$(mktemp -d /tmp/plantcare-restore.XXXXXX)"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  case "$SCRATCH_DIR" in
    /tmp/plantcare-restore.*) rm -rf -- "$SCRATCH_DIR" ;;
    *) echo "Refusing to remove unexpected scratch path: $SCRATCH_DIR" >&2 ;;
  esac
}
trap cleanup EXIT INT TERM

docker run -d --name "$CONTAINER" \
  -e POSTGRES_USER=plantcare_restore \
  -e POSTGRES_PASSWORD=restore-only \
  -e POSTGRES_DB=plantcare_restore \
  postgres:16-alpine >/dev/null

ready=false
i=0
while [ "$i" -lt 30 ]; do
  if docker exec "$CONTAINER" psql -U plantcare_restore -d plantcare_restore \
    -t -A -c 'SELECT 1;' >/dev/null 2>&1; then
    ready=true
    break
  fi
  i=$((i + 1))
  sleep 1
done
if [ "$ready" != "true" ]; then
  echo "Scratch PostgreSQL did not become ready." >&2
  exit 1
fi

docker exec -i "$CONTAINER" pg_restore --no-owner \
  -U plantcare_restore -d plantcare_restore < "$DB_FILE"

COUNTS="$(
  docker exec "$CONTAINER" psql -U plantcare_restore -d plantcare_restore \
    -t -A -c \
    'SELECT json_build_object(
      $$users$$, (SELECT COUNT(*) FROM "User"),
      $$plants$$, (SELECT COUNT(*) FROM "Plant"),
      $$journals$$, (SELECT COUNT(*) FROM "JournalEntry"),
      $$diagnoses$$, (SELECT COUNT(*) FROM "Diagnosis"),
      $$photo_records$$, (
        SELECT COUNT(*) FROM "Plant" WHERE "imageUrl" IS NOT NULL
      ) + (
        SELECT COUNT(*) FROM "JournalEntry" WHERE "photoUrl" IS NOT NULL
      ) + (
        SELECT COUNT(*) FROM "PlantProgressEntry" WHERE "photoUrl" IS NOT NULL
      )
    );'
)"

tar xzf "$UPLOADS_FILE" -C "$SCRATCH_DIR"
UPLOAD_COUNT="$(find "$SCRATCH_DIR/uploads" -type f 2>/dev/null | wc -l | tr -d ' ')"
DB_OK="$(docker exec "$CONTAINER" psql -U plantcare_restore -d plantcare_restore -t -A -c 'SELECT 1;')"

if [ "$DB_OK" != "1" ]; then
  echo "Scratch database health query failed." >&2
  exit 1
fi

echo "Restore drill PASS"
echo "  database: $COUNTS"
echo "  managed upload files: $UPLOAD_COUNT"
echo "  isolated container: $CONTAINER"
