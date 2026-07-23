#!/bin/sh
# Restore a verified production backup into the live Compose stack.
# This is intentionally destructive and requires an exact RESTORE confirmation.
set -eu

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"

DB_FILE="${1:-}"
UPLOADS_FILE="${2:-}"
MANIFEST_FILE="${3:-}"

if [ -z "$DB_FILE" ] || [ ! -f "$DB_FILE" ]; then
  echo "Usage: $0 <db.dump> [uploads.tar.gz] [manifest.sha256]" >&2
  exit 1
fi
if [ -n "$UPLOADS_FILE" ] && [ ! -f "$UPLOADS_FILE" ]; then
  echo "Uploads archive not found: $UPLOADS_FILE" >&2
  exit 1
fi
if [ -n "$MANIFEST_FILE" ] && [ ! -f "$MANIFEST_FILE" ]; then
  echo "Checksum manifest not found: $MANIFEST_FILE" >&2
  exit 1
fi

PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"
if [ -z "$PGUSER" ] || [ -z "$PGDB" ]; then
  echo "POSTGRES_USER and POSTGRES_DB are required in .env.production." >&2
  exit 1
fi

echo "About to REPLACE production database '$PGDB' with: $DB_FILE"
[ -n "$UPLOADS_FILE" ] && echo "Managed uploads will be replaced with: $UPLOADS_FILE"
printf "Type RESTORE to continue: "
read -r CONFIRM
if [ "$CONFIRM" != "RESTORE" ]; then
  echo "Aborted."
  exit 1
fi

echo "==> verify backup before stopping the API"
if [ -n "$MANIFEST_FILE" ]; then
  (cd "$(dirname "$MANIFEST_FILE")" && sha256sum --check "$(basename "$MANIFEST_FILE")")
fi
$COMPOSE exec -T postgres pg_restore --list < "$DB_FILE" >/dev/null
if [ -n "$UPLOADS_FILE" ]; then
  tar tzf "$UPLOADS_FILE" >/dev/null
fi

echo "==> stop API writes"
$COMPOSE stop api

echo "==> restore database"
$COMPOSE exec -T postgres pg_restore --clean --if-exists --no-owner \
  -U "$PGUSER" -d "$PGDB" < "$DB_FILE"

echo "==> deploy any forward migrations included in the current release"
$COMPOSE run --rm --no-deps --entrypoint npx api \
  prisma migrate deploy --schema=prisma/postgresql/schema.prisma

if [ -n "$UPLOADS_FILE" ]; then
  echo "==> restore managed uploads through the isolated application volume"
  $COMPOSE run --rm --no-deps --entrypoint tar api \
    xzf - -C /app/apps/api < "$UPLOADS_FILE"
fi

echo "==> start API and verify readiness"
$COMPOSE up -d --no-build api
i=0
until curl --fail --silent --show-error http://127.0.0.1:3001/api/v1/health/ready >/dev/null; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    $COMPOSE logs --tail=150 api
    echo "Restored API did not become ready." >&2
    exit 1
  fi
  sleep 2
done

$COMPOSE ps
echo "Restore complete and readiness PASS."
