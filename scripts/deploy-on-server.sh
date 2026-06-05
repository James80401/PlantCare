#!/bin/sh
# Run on the VPS (after: cd /root/PlantCare). Pulls latest, removes Caddy basic auth, rebuilds.
set -e
cd "$(dirname "$0")/.."

echo "==> git pull"
git pull

echo "==> remove Caddy basic auth"
bash scripts/caddy-remove-basic-auth.sh

echo "==> validate .env.production"
node scripts/check-production-env.mjs .env.production

echo "==> docker up"
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

# Must pass --env-file here too: the compose file uses required ${VAR:?} env
# interpolation, so `ps` without it fails (e.g. JWT_REFRESH_SECRET) and, under
# `set -e`, false-fails the whole deploy after it has already succeeded.
docker compose -f docker-compose.production.yml --env-file .env.production ps
echo "Deploy complete."
