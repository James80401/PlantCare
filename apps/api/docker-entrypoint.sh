#!/bin/sh
set -e
cd /app

echo "Applying database schema..."
npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss

echo "Seeding species and care guides (first run may take a minute)..."
npx tsx prisma/seed.ts

echo "Starting API..."
exec node apps/api/dist/main.js
