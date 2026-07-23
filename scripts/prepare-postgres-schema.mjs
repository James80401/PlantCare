#!/usr/bin/env node
/**
 * Prepare an empty or legacy-db-push PostgreSQL database for Prisma Migrate.
 * Existing non-empty schemas are baselined only when the canonical diff is empty.
 */
import { spawnSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const schema = process.argv[2] || 'prisma/postgresql/schema.prisma';
if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
  console.error('DATABASE_URL must be set to the target PostgreSQL database.');
  process.exit(1);
}

const prisma = new PrismaClient();
const [{ application_tables: applicationTables, migration_table: migrationTable }] =
  await prisma.$queryRaw`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name <> '_prisma_migrations'
      ) AS application_tables,
      to_regclass('public._prisma_migrations')::text AS migration_table
  `;
let baselineRecorded = 0;
if (migrationTable) {
  const [baseline] = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM "_prisma_migrations"
    WHERE migration_name = '20260723000000_baseline'
      AND finished_at IS NOT NULL
  `;
  baselineRecorded = baseline.count;
}
await prisma.$disconnect();

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
function run(args, options = {}) {
  const result = spawnSync(npx, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.error) {
    console.error(result.error.message);
  }
  return result;
}

if (applicationTables > 0 && baselineRecorded === 0) {
  console.log('Legacy non-empty PostgreSQL schema detected; verifying baseline diff.');
  const diff = run([
    'prisma',
    'migrate',
    'diff',
    '--from-url',
    process.env.DATABASE_URL,
    '--to-schema-datamodel',
    schema,
    '--exit-code',
  ]);
  if (diff.status !== 0) {
    console.error('Schema differs from the canonical baseline; refusing to mark it applied.');
    process.exit(diff.status ?? 1);
  }

  const resolve = run([
    'prisma',
    'migrate',
    'resolve',
    '--applied',
    '20260723000000_baseline',
    '--schema',
    schema,
  ]);
  if (resolve.status !== 0) process.exit(resolve.status ?? 1);
}

const deploy = run(['prisma', 'migrate', 'deploy', '--schema', schema]);
process.exit(deploy.status ?? 1);
