#!/usr/bin/env node
/**
 * Validate .env.production before docker production:up.
 * Usage: node scripts/check-production-env.mjs [.env.production]
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, process.argv[2] || '.env.production');
const examplePath = resolve(root, '.env.production.example');

if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    console.error(`Missing ${envPath}`);
    console.error(`Copy: cp .env.production.example .env.production`);
  }
  process.exit(1);
}

function parseEnv(text) {
  const vars = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const vars = parseEnv(readFileSync(envPath, 'utf8'));
const placeholder = /yourdomain|replace-with|change-me/i;

const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL', 'VITE_API_BASE_URL'];
const missing = required.filter((k) => {
  const v = vars[k];
  return !v || placeholder.test(v);
});

const warnings = [];

if (!vars.CORS_ORIGINS && !vars.CORS_ORIGIN) {
  warnings.push('CORS_ORIGINS not set — API will use FRONTEND_URL only (OK for single web origin)');
}

const frontend = vars.FRONTEND_URL || '';
if (frontend && !frontend.startsWith('https://')) {
  warnings.push('FRONTEND_URL should use https:// in production');
}

const apiBase = vars.VITE_API_BASE_URL || '';
if (apiBase && !apiBase.endsWith('/api/v1')) {
  warnings.push('VITE_API_BASE_URL should end with /api/v1');
}

if (!vars.FCM_SERVER_KEY) {
  warnings.push('FCM_SERVER_KEY unset — push will log only until Firebase is configured');
}
if (!vars.OPENAI_API_KEY) {
  warnings.push('OPENAI_API_KEY unset — Dr. Plant and diagnosis will not work');
}
if (!vars.SMTP_USER || !vars.SMTP_PASS) {
  warnings.push('SMTP unset — email verification and password reset use auto-verify in dev only');
}

if (missing.length) {
  console.error('Fix required values in .env.production:');
  for (const k of missing) console.error(`  - ${k}`);
  process.exit(1);
}

console.log('✓ .env.production required fields look valid');
for (const w of warnings) console.log(`  ⚠ ${w}`);

const apiUrl = apiBase.replace(/\/$/, '');
console.log('\nAfter deploy:');
console.log(`  API_URL=${apiUrl} npm run verify`);
console.log(`  API_URL=${apiUrl} npm run smoke:buddy`);
console.log(`  UAT_WEB_URL=${frontend} API_URL=${apiUrl} npm run uat:e2e`);
console.log('\nGuide: docs/guides/15-production-deploy-and-android.md');
