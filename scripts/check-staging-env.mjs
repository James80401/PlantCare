#!/usr/bin/env node
/**
 * Validate .env.staging before docker staging:up / staging:smoke.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, process.argv[2] || '.env.staging');
const examplePath = resolve(root, '.env.staging.example');

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath} — copy from .env.staging.example`);
  process.exit(1);
}

function parseEnv(text) {
  const vars = {};
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

const vars = parseEnv(readFileSync(envPath, 'utf8'));
const bad = /staging-change-me|yourdomain/i;
const required = ['JWT_SECRET', 'FRONTEND_URL', 'VITE_API_BASE_URL'];
const missing = required.filter((k) => !vars[k] || bad.test(vars[k]));

if (missing.length) {
  console.error('Fix .env.staging:', missing.join(', '));
  process.exit(1);
}

console.log('✓ .env.staging looks valid for local Docker staging');
console.log('\n  npm run staging:up');
console.log('  npm run staging:smoke   # build + verify + Playwright');
if (!existsSync(examplePath)) {
  /* noop */
}
