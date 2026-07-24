#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { spawnSync } from 'child_process';
import { loadEnvFile } from './lib/parse-env.mjs';

const root = resolve(import.meta.dirname, '..');
const webRoot = resolve(root, 'apps/web');
const productionEnvPath = resolve(root, '.env.production');
const productionEnv = existsSync(productionEnvPath)
  ? loadEnvFile(productionEnvPath)
  : {};
const canonicalProductionApi = 'https://api.drplant.app/api/v1';
const apiBaseUrl = (
  process.env.VITE_API_BASE_URL ||
  productionEnv?.VITE_API_BASE_URL ||
  canonicalProductionApi
).replace(/\/$/, '');

if (
  !apiBaseUrl.startsWith('https://') ||
  !apiBaseUrl.endsWith('/api/v1') ||
  /localhost|127\.0\.0\.1/i.test(apiBaseUrl)
) {
  console.error(
    'Android release requires VITE_API_BASE_URL=https://<public-api>/api/v1 in the environment or .env.production.',
  );
  process.exit(1);
}

const releaseEnv = { ...process.env, ...productionEnv, VITE_API_BASE_URL: apiBaseUrl };

function run(args) {
  const windows = process.platform === 'win32';
  const command = windows ? process.env.ComSpec || 'cmd.exe' : 'npm';
  const commandArgs = windows
    ? ['/d', '/s', '/c', `npm.cmd ${args.join(' ')}`]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    env: releaseEnv,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(['run', 'build', '-w', '@plant-care/web']);
run(['run', 'mobile:sync:android', '-w', '@plant-care/web']);

const assetsDir = resolve(webRoot, 'dist/assets');
const bakedFiles = existsSync(assetsDir)
  ? readdirSync(assetsDir)
      .filter((name) => name.endsWith('.js'))
      .filter((name) => readFileSync(resolve(assetsDir, name), 'utf8').includes(apiBaseUrl))
  : [];

if (bakedFiles.length === 0) {
  console.error('The production API URL was not found in the generated Android web bundle.');
  process.exit(1);
}

console.log(`Android web bundle synced with ${apiBaseUrl}`);
