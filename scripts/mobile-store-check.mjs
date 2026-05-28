#!/usr/bin/env node
/**
 * G4 — Google Play closed testing preflight (Capacitor + Android + API URLs).
 *
 * Usage:
 *   npm run mobile:store-check
 *   npm run mobile:store-check -- --live
 *   VITE_API_BASE_URL=https://api.example.com/api/v1 FRONTEND_URL=https://app.example.com npm run mobile:store-check -- --live
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile, parseEnvText } from './lib/parse-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'apps/web');
const androidApp = resolve(web, 'android/app');
const live = process.argv.includes('--live');

const checks = [];

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
}

function warn(label, detail = '') {
  checks.push({ ok: true, label, detail: `⚠ ${detail}`, warn: true });
}

function readApiBaseUrl() {
  if (process.env.VITE_API_BASE_URL?.trim()) {
    return process.env.VITE_API_BASE_URL.trim().replace(/\/$/, '');
  }
  const localEnv = resolve(web, '.env.local');
  if (existsSync(localEnv)) {
    const v = loadEnvFile(localEnv)?.VITE_API_BASE_URL;
    if (v) return v.replace(/\/$/, '');
  }
  const prodEnv = resolve(root, '.env.production');
  if (existsSync(prodEnv)) {
    const v = loadEnvFile(prodEnv)?.VITE_API_BASE_URL;
    if (v && !/yourdomain/i.test(v)) return v.replace(/\/$/, '');
  }
  return null;
}

function readFrontendUrl() {
  if (process.env.FRONTEND_URL?.trim()) {
    return process.env.FRONTEND_URL.trim().replace(/\/$/, '');
  }
  const prodEnv = resolve(root, '.env.production');
  if (existsSync(prodEnv)) {
    const v = loadEnvFile(prodEnv)?.FRONTEND_URL;
    if (v && !/yourdomain/i.test(v)) return v.replace(/\/$/, '');
  }
  return null;
}

// Capacitor identity
const capConfig = readFileSync(resolve(web, 'capacitor.config.ts'), 'utf8');
const appIdMatch = capConfig.match(/appId:\s*['"]([^'"]+)['"]/);
const appId = appIdMatch?.[1];
if (appId === 'com.plantcare.app') {
  pass('Package ID', appId);
} else {
  fail('Package ID', appId ? `Expected com.plantcare.app, got ${appId}` : 'appId not found');
}

if (capConfig.includes("androidScheme: 'https'")) {
  pass('Capacitor', 'androidScheme https (secure WebView)');
} else {
  warn('Capacitor', 'Consider androidScheme https for production');
}

// Android project
if (existsSync(androidApp)) {
  pass('Android project', 'apps/web/android present');
} else {
  fail('Android project', 'Run: npm run mobile:add:android');
}

const gradle = existsSync(resolve(androidApp, 'build.gradle'))
  ? readFileSync(resolve(androidApp, 'build.gradle'), 'utf8')
  : '';
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1];
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (versionCode && versionName) {
  pass('Version', `${versionName} (${versionCode}) — bump versionCode before each Play upload`);
} else {
  fail('Version', 'Could not read versionCode/versionName from build.gradle');
}

if (existsSync(resolve(androidApp, 'src/main/res/mipmap-anydpi-v26/ic_launcher.xml'))) {
  pass('App icon', 'Adaptive launcher icons present');
} else {
  fail('App icon', 'Missing ic_launcher resources');
}

if (existsSync(resolve(androidApp, 'google-services.json'))) {
  pass('Firebase Android', 'google-services.json (push on device)');
} else if (existsSync(resolve(androidApp, 'google-services.json.example'))) {
  warn('Firebase Android', 'Copy google-services.json for push — optional for closed test without push');
} else if (existsSync(androidApp)) {
  warn('Firebase Android', 'No google-services.json — push disabled until configured');
}

// Web build baked into native
if (existsSync(resolve(web, 'dist/index.html'))) {
  pass('Web bundle', 'apps/web/dist exists — run mobile:sync after web changes');
} else {
  warn('Web bundle', 'No dist/ — run npm run mobile:release:android before generating AAB');
}

// API URL for mobile build
const apiBase = readApiBaseUrl();
if (!apiBase) {
  fail(
    'VITE_API_BASE_URL',
    'Set in apps/web/.env.local or .env.production (https://api…/api/v1)',
  );
} else if (!apiBase.startsWith('https://')) {
  fail('VITE_API_BASE_URL', 'Must use https:// for Play builds');
} else if (!apiBase.endsWith('/api/v1')) {
  fail('VITE_API_BASE_URL', 'Should end with /api/v1');
} else if (/localhost|127\.0\.0\.1/i.test(apiBase)) {
  fail('VITE_API_BASE_URL', 'Use your public API host, not localhost');
} else {
  pass('VITE_API_BASE_URL', apiBase);
}

const frontend = readFrontendUrl();
if (frontend) {
  if (!frontend.startsWith('https://')) {
    fail('FRONTEND_URL', 'Privacy policy link should be HTTPS');
  } else {
    pass('FRONTEND_URL', frontend);
  }
} else {
  warn('FRONTEND_URL', 'Set for privacy policy URL in Play Console');
}

// Privacy page source
if (existsSync(resolve(web, 'src/pages/Privacy.tsx'))) {
  pass('Privacy route', '/privacy page in web app');
} else {
  fail('Privacy route', 'Missing Privacy.tsx');
}

if (live && apiBase) {
  try {
    const health = await fetch(`${apiBase}/health`, { signal: AbortSignal.timeout(15_000) });
    const data = await health.json().catch(() => ({}));
    if (health.ok && data.status === 'ok') {
      pass('Live API', `${apiBase}/health`);
    } else {
      fail('Live API', `HTTP ${health.status}`);
    }
  } catch (err) {
    fail('Live API', err.message);
  }
}

if (live && frontend) {
  try {
    const res = await fetch(`${frontend}/privacy`, {
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    if (res.ok) {
      pass('Live privacy URL', `${frontend}/privacy`);
    } else {
      fail('Live privacy URL', `HTTP ${res.status}`);
    }
  } catch (err) {
    fail('Live privacy URL', err.message);
  }
}

for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.label}${c.detail ? `: ${c.detail}` : ''}`);
}

const failed = checks.filter((c) => !c.ok);
console.log('');
if (failed.length) {
  console.log(`${checks.length - failed.length}/${checks.length} checks passed`);
  console.log('\nRunbook: docs/product/google-play-closed-testing.md');
  process.exit(1);
}

console.log(`${checks.length}/${checks.length} checks passed`);
console.log('\nNext steps:');
console.log('  1. npm run mobile:release:android');
console.log('  2. Android Studio → Build → Generate Signed Bundle (AAB)');
console.log('  3. Play Console → Testing → Closed testing → upload AAB');
console.log('  4. Listing copy: docs/product/play-store-listing.md');
if (!live) {
  console.log('\n  Add --live to verify API health and /privacy on your public host.');
}
