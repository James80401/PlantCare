#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.staging ]]; then
  cp .env.staging.example .env.staging
  echo "Created .env.staging — review JWT secrets before sharing a link."
fi

echo "Building and starting staging containers..."
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

health_url="http://localhost:3001/api/v1/health"
echo "Waiting for API at $health_url ..."
for i in $(seq 1 96); do
  if curl -sf "$health_url" >/dev/null; then
    break
  fi
  if [[ "$i" -eq 96 ]]; then
    echo "API did not become healthy. Check: docker compose -f docker-compose.staging.yml logs api"
    exit 1
  fi
  sleep 5
done

export DATABASE_URL="postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public"
npx prisma generate --schema=prisma/schema.postgresql.prisma

export API_URL="http://localhost:3001/api/v1"
export UAT_WEB_URL="http://localhost:8080"
export STAGING_E2E=1

npm run verify
npm run uat:e2e

echo ""
echo "Staging ready:"
echo "  Web:  http://localhost:8080"
echo "  API:  http://localhost:3001/api/v1"
echo "Stop: npm run staging:down"

echo "Restoring SQLite Prisma client for local dev..."
unset DATABASE_URL
npx prisma generate
