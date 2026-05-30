#!/bin/sh
set -e
cd /app

echo "Applying database schema..."
npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss

echo "Seeding species and care guides (first run may take a minute)..."
npx tsx prisma/seed.ts

echo "Starting API..."
if [ -f apps/api/dist/main.js ]; then
  exec node apps/api/dist/main.js
fi

exec node apps/api/dist/apps/api/src/main.js
