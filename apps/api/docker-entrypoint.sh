#!/bin/sh
set -eu

cd /app

# Migrations and catalog synchronization are explicit deployment steps.
# Runtime containers only start the already-validated application artifact.
exec node apps/api/dist/main.js
