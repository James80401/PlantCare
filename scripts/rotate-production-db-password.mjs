#!/usr/bin/env node
/**
 * One-time rotation away from the legacy Compose database password.
 * The new random password is written to .env.production and never printed.
 */
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { randomBytes } from 'crypto';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { parseEnvText } from './lib/parse-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, process.argv[2] || '.env.production');
const text = readFileSync(envPath, 'utf8');
const vars = parseEnvText(text);
const legacy = /change-me|replace-with|yourdomain/i;

if (!vars.POSTGRES_PASSWORD || !legacy.test(vars.POSTGRES_PASSWORD)) {
  console.log('Production database password is already non-placeholder; rotation skipped.');
  process.exit(0);
}

for (const key of ['POSTGRES_USER', 'POSTGRES_DB', 'DATABASE_URL']) {
  if (!vars[key]?.trim()) {
    console.error(`${key} is required before database password rotation.`);
    process.exit(1);
  }
}
if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(vars.POSTGRES_USER)) {
  console.error('POSTGRES_USER contains unsupported identifier characters.');
  process.exit(1);
}

const newPassword = randomBytes(32).toString('hex');
const databaseUrl = new URL(vars.DATABASE_URL);
databaseUrl.password = newPassword;

function replaceEnvValue(source, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(source) ? source.replace(pattern, line) : `${source.trimEnd()}\n${line}\n`;
}

let updated = replaceEnvValue(text, 'POSTGRES_PASSWORD', newPassword);
updated = replaceEnvValue(updated, 'DATABASE_URL', databaseUrl.toString());

const backupDir = process.env.BACKUP_DIR || '/var/backups/plantcare/config';
mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const backupPath = resolve(backupDir, `env-before-db-password-rotation-${stamp}`);
copyFileSync(envPath, backupPath);
chmodSync(backupPath, 0o600);

function alterPassword(password) {
  const escaped = password.replaceAll("'", "''");
  return spawnSync(
    'docker',
    [
      'compose',
      '-f',
      'docker-compose.production.yml',
      '--env-file',
      envPath,
      'exec',
      '-T',
      'postgres',
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      vars.POSTGRES_USER,
      '-d',
      vars.POSTGRES_DB,
      '-c',
      `ALTER ROLE "${vars.POSTGRES_USER}" PASSWORD '${escaped}';`,
    ],
    { cwd: root, stdio: ['ignore', 'inherit', 'inherit'] },
  );
}

const rotate = alterPassword(newPassword);
if (rotate.status !== 0) {
  console.error('Database password rotation failed; .env.production was not changed.');
  process.exit(1);
}

const tempPath = `${envPath}.phase2-password`;
try {
  writeFileSync(tempPath, updated, { encoding: 'utf8', mode: 0o600 });
  renameSync(tempPath, envPath);
  chmodSync(envPath, 0o600);
} catch (error) {
  alterPassword(vars.POSTGRES_PASSWORD);
  throw error;
}

console.log('Production database password rotation PASS');
console.log(`Prior environment backup: ${backupPath}`);
