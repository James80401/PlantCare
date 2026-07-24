#!/usr/bin/env node
/**
 * Validate .env.production before any container or database mutation.
 * Usage: node scripts/check-production-env.mjs [.env.production]
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseEnvText } from './lib/parse-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const allowLegacyDatabasePassword = args.includes('--allow-legacy-database-password');
const envArg = args.find((arg) => !arg.startsWith('--')) || '.env.production';
const envPath = resolve(root, envArg);

if (!existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  console.error('Copy .env.production.example to .env.production and supply real values.');
  process.exit(1);
}

const vars = parseEnvText(readFileSync(envPath, 'utf8'));
if (process.env.APP_VERSION?.trim()) vars.APP_VERSION = process.env.APP_VERSION.trim();
const placeholder = /yourdomain|replace-with|change-me|you@example\.com/i;
const errors = [];
const warnings = [];

const required = [
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'CORS_ORIGINS',
  'VITE_API_BASE_URL',
  'APP_VERSION',
  'ENABLE_PREMIUM_BILLING',
  'VITE_ENABLE_PREMIUM_BILLING',
];
for (const key of required) {
  const value = vars[key]?.trim();
  const permittedLegacyValue =
    allowLegacyDatabasePassword && ['POSTGRES_PASSWORD', 'DATABASE_URL'].includes(key);
  if (!value || (placeholder.test(value) && !permittedLegacyValue)) {
    errors.push(`${key} is missing or still a placeholder`);
  }
}

function isTrue(key) {
  return vars[key]?.trim().toLowerCase() === 'true';
}

const frontend = vars.FRONTEND_URL?.trim() || '';
const apiBase = vars.VITE_API_BASE_URL?.trim() || '';
if (frontend && !frontend.startsWith('https://')) {
  errors.push('FRONTEND_URL must use https://');
}
if (apiBase && (!apiBase.startsWith('https://') || !apiBase.endsWith('/api/v1'))) {
  errors.push('VITE_API_BASE_URL must use https:// and end with /api/v1');
}
if (vars.DATABASE_URL && !vars.DATABASE_URL.startsWith('postgresql://')) {
  errors.push('DATABASE_URL must be a PostgreSQL URL');
}
if (
  vars.APP_VERSION &&
  (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(vars.APP_VERSION.trim()) ||
    vars.APP_VERSION.trim() === '0.0.0')
) {
  errors.push('APP_VERSION must be a non-placeholder semantic version');
}

const corsOrigins = (vars.CORS_ORIGINS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
if (frontend && !corsOrigins.includes(frontend)) {
  errors.push('CORS_ORIGINS must include FRONTEND_URL exactly');
}

if (isTrue('ENABLE_PLANT_BUDDY')) {
  errors.push('ENABLE_PLANT_BUDDY must remain false during the improvement roadmap');
}
if (isTrue('ENABLE_SWAGGER')) {
  errors.push('ENABLE_SWAGGER must remain false during the improvement roadmap');
}
if (isTrue('ENABLE_PREMIUM_BILLING') !== isTrue('VITE_ENABLE_PREMIUM_BILLING')) {
  errors.push(
    'ENABLE_PREMIUM_BILLING and VITE_ENABLE_PREMIUM_BILLING must agree',
  );
}
if (isTrue('ENABLE_PREMIUM_BILLING')) {
  errors.push('Premium billing must remain disabled during the improvement roadmap');
  const stripeKeys = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_ID_PREMIUM'];
  for (const key of stripeKeys) {
    if (!vars[key]?.trim()) errors.push(`${key} is required when Premium billing is enabled`);
  }
}
if (isTrue('SEED_DEMO_DATA')) {
  errors.push('SEED_DEMO_DATA must be false in production');
}

const smtpValues = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'].filter(
  (key) => Boolean(vars[key]?.trim()),
);
if (smtpValues.length > 0 && smtpValues.length < 4) {
  errors.push('SMTP_HOST, SMTP_USER, SMTP_PASS, and EMAIL_FROM must be configured together');
}
if (isTrue('REGISTRATION_REQUIRES_ADMIN_APPROVAL')) {
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'ADMIN_EMAILS']) {
    if (!vars[key]?.trim()) errors.push(`${key} is required when registration approval is enabled`);
  }
}
if (vars.SMTP_HOST?.trim().toLowerCase() === 'smtp.sendgrid.net') {
  if (vars.SMTP_USER?.trim() !== 'apikey') {
    errors.push('Twilio SendGrid SMTP requires SMTP_USER=apikey');
  }
  if (!vars.SMTP_PASS?.trim().replace(/\s+/g, '').startsWith('SG.')) {
    errors.push('Twilio SendGrid SMTP requires an SG.-prefixed API key');
  }
  if (String(vars.SMTP_PORT || '').trim() !== '2525') {
    warnings.push('Use SMTP_PORT=2525 for Twilio SendGrid on DigitalOcean');
  }
}

const firebaseKeys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY'];
const firebaseCount = firebaseKeys.filter((key) => Boolean(vars[key]?.trim())).length;
if (firebaseCount > 0 && firebaseCount < firebaseKeys.length) {
  errors.push('Firebase HTTP v1 project ID, client email, and private key must be configured together');
}
if (firebaseCount === 0 && !vars.FCM_SERVER_KEY?.trim()) {
  warnings.push('Push delivery is unavailable because FCM is not configured');
}

const twilioKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'];
const twilioCount = twilioKeys.filter((key) => Boolean(vars[key]?.trim())).length;
if (twilioCount > 0 && twilioCount < twilioKeys.length) {
  errors.push('Twilio account SID, auth token, and from number must be configured together');
}
if (!vars.OPENAI_API_KEY?.trim()) {
  warnings.push('OPENAI_API_KEY is absent; AI-assisted existing features will be unavailable');
}
if (allowLegacyDatabasePassword && placeholder.test(vars.POSTGRES_PASSWORD || '')) {
  warnings.push('Legacy database password is temporarily allowed for the controlled rotation step');
}

if (errors.length) {
  console.error('Production configuration is not deployable:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('Production configuration preflight PASS');
console.log(`  web origin: ${frontend}`);
console.log(`  API base: ${apiBase}`);
console.log(`  PostgreSQL database: ${vars.POSTGRES_DB}`);
console.log(`  Buddy enabled: ${isTrue('ENABLE_PLANT_BUDDY')}`);
console.log(`  Premium billing enabled: ${isTrue('ENABLE_PREMIUM_BILLING')}`);
for (const warning of warnings) console.log(`  warning: ${warning}`);
