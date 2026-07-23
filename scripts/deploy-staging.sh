#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
COMPOSE=(docker compose -f docker-compose.staging.yml --env-file .env.staging)

if [[ ! -f .env.staging ]]; then
  cp .env.staging.example .env.staging
  echo "Created .env.staging; review JWT secrets before sharing a link."
fi

echo "Starting staging PostgreSQL..."
"${COMPOSE[@]}" up -d postgres
for i in $(seq 1 60); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -U plantcare -d plantcare >/dev/null; then
    break
  fi
  if [[ "$i" -eq 60 ]]; then
    echo "Staging PostgreSQL did not become ready." >&2
    exit 1
  fi
  sleep 1
done

export DATABASE_URL="postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public"
restore_sqlite_client() {
  unset DATABASE_URL
  npx prisma generate
}
trap restore_sqlite_client EXIT

npx prisma generate --schema=prisma/postgresql/schema.prisma
node scripts/prepare-postgres-schema.mjs
NODE_ENV=development SEED_DEMO_DATA=true npm run db:seed

echo "Building and starting staging application containers..."
"${COMPOSE[@]}" up -d --build api web

health_url="http://localhost:3001/api/v1/health"
for i in $(seq 1 96); do
  if curl -sf "$health_url" >/dev/null; then
    break
  fi
  if [[ "$i" -eq 96 ]]; then
    echo "API did not become healthy. Check staging Compose logs." >&2
    exit 1
  fi
  sleep 5
done

export API_URL="http://localhost:3001/api/v1"
export UAT_WEB_URL="http://localhost:8080"
export STAGING_E2E=1

npm run verify
EXPECT_BUDDY_HIDDEN=1 npm run smoke:buddy
npm run uat:e2e

echo "Staging ready:"
echo "  Web: http://localhost:8080"
echo "  API: http://localhost:3001/api/v1"

trap - EXIT
restore_sqlite_client
