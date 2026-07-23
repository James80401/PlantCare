#!/bin/sh
# Read-only comparison of a live PostgreSQL schema and the canonical Prisma model.
set -eu

PROJECT_ROOT="${PLANTCARE_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
SCHEMA_PATH="${1:-$PROJECT_ROOT/prisma/postgresql/schema.prisma}"
cd "$PROJECT_ROOT"

if [ ! -f "$SCHEMA_PATH" ]; then
  echo "PostgreSQL schema not found: $SCHEMA_PATH" >&2
  exit 1
fi

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"
PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"
PGUSER="${PGUSER:-$($COMPOSE exec -T postgres sh -c 'printf %s "$POSTGRES_USER"')}"
PGDB="${PGDB:-$($COMPOSE exec -T postgres sh -c 'printf %s "$POSTGRES_DB"')}"
if [ -z "$PGUSER" ] || [ -z "$PGDB" ]; then
  echo "POSTGRES_USER and POSTGRES_DB are required in .env.production." >&2
  exit 1
fi

MIGRATION_TABLE="$(
  $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A \
    -c "SELECT CASE WHEN to_regclass('public._prisma_migrations') IS NULL THEN 'missing' ELSE 'present' END;"
)"
echo "Migration table: $MIGRATION_TABLE"

set +e
DIFF_OUTPUT="$(
  $COMPOSE run --rm --no-deps \
    -v "$SCHEMA_PATH:/tmp/plantcare-postgresql-schema.prisma:ro" \
    --entrypoint sh api -c \
    'npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel /tmp/plantcare-postgresql-schema.prisma --exit-code' \
    2>&1
)"
DIFF_STATUS=$?
set -e
printf '%s\n' "$DIFF_OUTPUT"

case "$DIFF_STATUS" in
  0)
    echo "PostgreSQL baseline diff PASS: no difference detected."
    ;;
  2)
    echo "PostgreSQL baseline diff FAIL: schema reconciliation is required." >&2
    exit 2
    ;;
  *)
    echo "PostgreSQL baseline diff ERROR." >&2
    exit "$DIFF_STATUS"
    ;;
esac
