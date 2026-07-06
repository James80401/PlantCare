#!/bin/sh
# Restore a production backup made by scripts/backup-production.sh.
#
#   ./scripts/restore-production.sh /var/backups/plantcare/db-<stamp>.dump [/var/backups/plantcare/uploads-<stamp>.tar.gz]
#
# DESTRUCTIVE: replaces the live database (and uploads, if an archive is given).
# The API is stopped during the database restore and restarted afterwards.
set -e
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"

DB_FILE="$1"
UPLOADS_FILE="$2"

if [ -z "$DB_FILE" ] || [ ! -f "$DB_FILE" ]; then
  echo "Usage: $0 <db-backup.dump> [uploads-backup.tar.gz]" >&2
  exit 1
fi
if [ -n "$UPLOADS_FILE" ] && [ ! -f "$UPLOADS_FILE" ]; then
  echo "Uploads archive not found: $UPLOADS_FILE" >&2
  exit 1
fi

PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"
PGUSER="${PGUSER:-plantcare}"
PGDB="${PGDB:-plantcare}"

echo "About to REPLACE database '$PGDB' with: $DB_FILE"
[ -n "$UPLOADS_FILE" ] && echo "And REPLACE uploads with: $UPLOADS_FILE"
printf "Type RESTORE to continue: "
read -r CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

echo "==> verify dump is readable before touching anything"
$COMPOSE exec -T postgres pg_restore --list < "$DB_FILE" > /dev/null

echo "==> stop api (prevents writes during restore)"
$COMPOSE stop api

echo "==> restore database"
# --clean --if-exists drops and recreates objects from the dump, so a partial
# newer schema does not survive underneath the restored data.
$COMPOSE exec -T postgres pg_restore --clean --if-exists --no-owner \
  -U "$PGUSER" -d "$PGDB" < "$DB_FILE"

echo "==> start api"
$COMPOSE up -d api

if [ -n "$UPLOADS_FILE" ]; then
  echo "==> wait for api container, then restore uploads"
  # Uploads live on the plantcare_prod_uploads volume mounted in the api
  # container; untar through it once it is running again.
  sleep 5
  $COMPOSE exec -T api tar xzf - -C /app/apps/api < "$UPLOADS_FILE"
fi

echo "==> container status"
$COMPOSE ps
echo "Restore complete. Verify with: API_URL=https://api.drplant.app npm run verify"
