#!/bin/sh
# Deploy one already-tested commit on the production host.
# The caller must fetch and check out DEPLOY_SHA, and may pass PREVIOUS_SHA.
set -eu

cd "$(dirname "$0")/.."

DEPLOY_SHA="${DEPLOY_SHA:-}"
PREVIOUS_SHA="${PREVIOUS_SHA:-$(git rev-parse HEAD^ 2>/dev/null || true)}"
COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"
ROLLBACK_COMPOSE="docker compose -f docker-compose.production.yml -f docker-compose.rollback.yml --env-file .env.production"
ROLLBACK_API_IMAGE="plantcare-api:rollback-$PREVIOUS_SHA"
ROLLBACK_WEB_IMAGE="plantcare-web:rollback-$PREVIOUS_SHA"
APPLICATION_CHANGED=false
export ROLLBACK_API_IMAGE ROLLBACK_WEB_IMAGE

if [ "${#DEPLOY_SHA}" -ne 40 ] || ! printf '%s' "$DEPLOY_SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  echo "DEPLOY_SHA must be a full Git commit SHA." >&2
  exit 1
fi

if [ "$(git rev-parse HEAD)" != "$DEPLOY_SHA" ]; then
  echo "Checked-out commit does not match DEPLOY_SHA." >&2
  exit 1
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Tracked production checkout is dirty; refusing to deploy." >&2
  exit 1
fi

rollback() {
  status=$?
  if [ "$status" -eq 0 ]; then
    return
  fi

  echo "Deployment failed; restoring application commit $PREVIOUS_SHA" >&2
  if [ -n "$PREVIOUS_SHA" ] && git cat-file -e "$PREVIOUS_SHA^{commit}" 2>/dev/null; then
    git checkout --detach "$PREVIOUS_SHA"
    export APP_COMMIT_SHA="$PREVIOUS_SHA"
    if [ "$APPLICATION_CHANGED" = "true" ]; then
      $ROLLBACK_COMPOSE up -d --no-build api web
    fi
    $COMPOSE ps
  else
    echo "Previous commit is unavailable; containers were not changed again." >&2
  fi
  exit "$status"
}
trap rollback EXIT

export APP_COMMIT_SHA="$DEPLOY_SHA"
PGUSER="$(grep -E '^POSTGRES_USER=' .env.production 2>/dev/null | cut -d= -f2-)"
PGDB="$(grep -E '^POSTGRES_DB=' .env.production 2>/dev/null | cut -d= -f2-)"

echo "==> validate production configuration"
node scripts/check-production-env.mjs .env.production --allow-legacy-database-password
$COMPOSE config --quiet

echo "==> pre-deploy backup"
bash scripts/backup-production.sh

echo "==> preserve current application images for rollback"
docker image inspect plantcare-api >/dev/null
docker image inspect plantcare-web >/dev/null
docker image tag plantcare-api "$ROLLBACK_API_IMAGE"
docker image tag plantcare-web "$ROLLBACK_WEB_IMAGE"

echo "==> build exact application commit $DEPLOY_SHA"
$COMPOSE build api web

echo "==> reconcile one-time PostgreSQL migration baseline"
MIGRATION_TABLE="$(
  $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A \
    -c "SELECT CASE WHEN to_regclass('public._prisma_migrations') IS NULL THEN 'missing' ELSE 'present' END;"
)"
BASELINE_RECORDED=0
APPLICATION_TABLES="$(
  $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A \
    -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations';"
)"
if [ "$MIGRATION_TABLE" = "present" ]; then
  BASELINE_RECORDED="$(
    $COMPOSE exec -T postgres psql -U "$PGUSER" -d "$PGDB" -t -A \
      -c "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name = '20260723000000_baseline' AND finished_at IS NOT NULL;"
  )"
fi

if [ "$BASELINE_RECORDED" = "0" ] && [ "$APPLICATION_TABLES" -gt 0 ]; then
  set +e
  SCHEMA_DIFF="$(
    $COMPOSE run --rm --no-deps --entrypoint sh api -c \
      'npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/postgresql/schema.prisma --exit-code' \
      2>&1
  )"
  DIFF_STATUS=$?
  set -e
  printf '%s\n' "$SCHEMA_DIFF"
  if [ "$DIFF_STATUS" -ne 0 ]; then
    echo "Existing production schema does not match the verified baseline; refusing to mark it applied." >&2
    exit 1
  fi
  $COMPOSE run --rm --no-deps --entrypoint npx api \
    prisma migrate resolve --applied 20260723000000_baseline \
    --schema=prisma/postgresql/schema.prisma
fi

echo "==> apply PostgreSQL migrations"
$COMPOSE run --rm --no-deps --entrypoint npx api \
  prisma migrate deploy --schema=prisma/postgresql/schema.prisma

echo "==> synchronize catalogs with recorded before/after counts"
$COMPOSE run --rm --no-deps --entrypoint ./node_modules/.bin/tsx api prisma/seed.ts

echo "==> rotate legacy database password if required"
node scripts/rotate-production-db-password.mjs .env.production
node scripts/check-production-env.mjs .env.production
$COMPOSE config --quiet

echo "==> start release"
APPLICATION_CHANGED=true
$COMPOSE up -d --no-build

echo "==> wait for API readiness"
ready=false
i=0
while [ "$i" -lt 60 ]; do
  if curl --fail --silent --show-error http://127.0.0.1:3001/api/v1/health/ready >/dev/null; then
    ready=true
    break
  fi
  i=$((i + 1))
  sleep 2
done
if [ "$ready" != "true" ]; then
  $COMPOSE logs --tail=150 api
  echo "API did not become ready." >&2
  exit 1
fi

echo "==> non-mutating production sign-off"
node scripts/production-signoff.mjs --env .env.production --skip-verify

$COMPOSE ps
printf '%s\n' "$DEPLOY_SHA" > .deployed-sha
trap - EXIT
echo "Deployment complete: $DEPLOY_SHA"
