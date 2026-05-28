#!/usr/bin/env node
/**
 * Validate .env.production before docker production:up.
 * Usage: node scripts/check-production-env.mjs [.env.production]
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseEnvText } from './lib/parse-env.mjs';

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

const vars = parseEnvText(readFileSync(envPath, 'utf8'));
const placeholder = /yourdomain|replace-with|change-me/i;

const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL', 'VITE_API_BASE_URL'];
const missing = required.filter((k) => {
  const v = vars[k];
  return !v || placeholder.test(v);
});

const warnings = [];
const errors = [];

if (!vars.CORS_ORIGINS && !vars.CORS_ORIGIN) {
  warnings.push('CORS_ORIGINS not set — API will use FRONTEND_URL only (OK for single web origin)');
}

const frontend = vars.FRONTEND_URL || '';
if (frontend && !frontend.startsWith('https://')) {
  errors.push('FRONTEND_URL should use https:// in production');
}

const apiBase = vars.VITE_API_BASE_URL || '';
if (apiBase && !apiBase.endsWith('/api/v1')) {
  errors.push('VITE_API_BASE_URL should end with /api/v1');
}
if (apiBase && !apiBase.startsWith('https://')) {
  errors.push('VITE_API_BASE_URL should use https:// in production');
}

const corsOriginsRaw = vars.CORS_ORIGINS || vars.CORS_ORIGIN || '';
const corsOrigins = corsOriginsRaw
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);
if (frontend && corsOrigins.length && !corsOrigins.includes(frontend)) {
  errors.push('CORS_ORIGINS/CORS_ORIGIN must include FRONTEND_URL exactly');
}

const hasFcmV1 =
  vars.FIREBASE_PROJECT_ID &&
  (vars.GOOGLE_APPLICATION_CREDENTIALS ||
    vars.FIREBASE_SERVICE_ACCOUNT_PATH ||
    (vars.FIREBASE_CLIENT_EMAIL && vars.FIREBASE_PRIVATE_KEY));
if (!hasFcmV1 && !vars.FCM_SERVER_KEY) {
  warnings.push(
    'FCM not configured — set FIREBASE_PROJECT_ID + service account (v1) or FCM_SERVER_KEY (legacy)',
  );
} else if (hasFcmV1) {
  console.log('  ✓ FCM HTTP v1 credentials detected');
} else if (vars.FCM_SERVER_KEY) {
  warnings.push('Using legacy FCM_SERVER_KEY — prefer HTTP v1 service account for new Firebase projects');
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

if (errors.length) {
  console.error('Fix production URL/CORS settings:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('✓ .env.production required fields look valid');
for (const w of warnings) console.log(`  ⚠ ${w}`);

const apiUrl = apiBase.replace(/\/$/, '');
console.log('\nAfter deploy:');
console.log(`  API_URL=${apiUrl} npm run verify`);
console.log(`  API_URL=${apiUrl} npm run smoke:buddy`);
console.log(`  UAT_WEB_URL=${frontend} API_URL=${apiUrl} npm run uat:e2e`);
console.log('  npm run production:signoff   # env + live probes + verify + smoke');
console.log('\nGuide: docs/operations/production-signoff.md');
