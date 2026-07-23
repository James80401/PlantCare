#!/bin/sh
# One-time, idempotent migration from legacy Compose defaults to explicit
# production configuration. Values are copied from the running containers and
# never printed.
set -eu

PROJECT_ROOT="${PLANTCARE_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$PROJECT_ROOT"
COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"

if [ ! -f .env.production ]; then
  echo ".env.production is missing." >&2
  exit 1
fi

POSTGRES_CONTAINER="$($COMPOSE ps -q postgres)"
API_CONTAINER="$($COMPOSE ps -q api)"
if [ -z "$POSTGRES_CONTAINER" ] || [ -z "$API_CONTAINER" ]; then
  echo "The existing postgres and api containers must be running." >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/var/backups/plantcare/config}"
case "$BACKUP_DIR" in
  ""|"/"|"/var"|"/var/backups")
    echo "BACKUP_DIR is too broad: $BACKUP_DIR" >&2
    exit 1
    ;;
esac
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/env-before-explicit-compose-$(date -u +%Y%m%dT%H%M%SZ)"
cp .env.production "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"

container_value() {
  container="$1"
  key="$2"
  docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$container" |
    sed -n "s/^${key}=//p" |
    head -n 1
}

append_if_missing() {
  key="$1"
  value="$2"
  if grep -q "^${key}=" .env.production; then
    return
  fi
  if [ -z "$value" ]; then
    echo "Could not derive required value for $key." >&2
    exit 1
  fi
  printf '\n%s=%s\n' "$key" "$value" >> .env.production
  echo "Added explicit $key"
}

append_if_missing POSTGRES_USER "$(container_value "$POSTGRES_CONTAINER" POSTGRES_USER)"
append_if_missing POSTGRES_PASSWORD "$(container_value "$POSTGRES_CONTAINER" POSTGRES_PASSWORD)"
append_if_missing POSTGRES_DB "$(container_value "$POSTGRES_CONTAINER" POSTGRES_DB)"
append_if_missing DATABASE_URL "$(container_value "$API_CONTAINER" DATABASE_URL)"

if ! grep -q '^CORS_ORIGINS=' .env.production; then
  cors="$(container_value "$API_CONTAINER" CORS_ORIGINS)"
  if [ -z "$cors" ]; then
    cors="$(grep -E '^FRONTEND_URL=' .env.production | cut -d= -f2-)"
  fi
  append_if_missing CORS_ORIGINS "$cors"
fi

append_if_missing ENABLE_PLANT_BUDDY false
append_if_missing ENABLE_PREMIUM_BILLING false
append_if_missing SEED_DEMO_DATA false
append_if_missing APP_VERSION "$(node -p "require('./package.json').version || '0.0.0'")"

chmod 600 .env.production
echo "Production Compose environment reconciliation PASS"
echo "Encrypted/server backup location: $BACKUP_FILE"
