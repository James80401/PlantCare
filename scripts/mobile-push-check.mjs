#!/usr/bin/env node
/**
 * Preflight checks for Capacitor mobile push setup.
 */
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = resolve(root, 'apps/web');

const checks = [];

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail });
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail });
}

const webPkg = JSON.parse(readFileSync(resolve(web, 'package.json'), 'utf8'));
const deps = { ...webPkg.dependencies, ...webPkg.devDependencies };

if (deps['@capacitor/push-notifications']) {
  pass('Package', `@capacitor/push-notifications@${deps['@capacitor/push-notifications']}`);
} else {
  fail('Package', '@capacitor/push-notifications missing');
}

if (deps['@capacitor/app']) {
  pass('Package', `@capacitor/app@${deps['@capacitor/app']}`);
} else {
  fail('Package', '@capacitor/app missing (resume re-register)');
}

const capConfig = readFileSync(resolve(web, 'capacitor.config.ts'), 'utf8');
if (capConfig.includes('PushNotifications')) {
  pass('Capacitor config', 'PushNotifications plugin options present');
} else {
  fail('Capacitor config', 'Add PushNotifications to plugins in capacitor.config.ts');
}

const gServices = resolve(web, 'android/app/google-services.json');
const gExample = resolve(web, 'android/app/google-services.json.example');
if (existsSync(gServices)) {
  pass('Android', 'google-services.json found');
} else if (existsSync(gExample)) {
  fail('Android', 'Copy Firebase google-services.json to android/app/ (see google-services.json.example)');
} else if (existsSync(resolve(web, 'android'))) {
  fail('Android', 'Missing google-services.json — run npm run mobile:firebase-setup');
} else {
  pass('Android', 'Native project not added yet (npm run mobile:add:android)');
}

for (const c of checks) {
  console.log(`${c.ok ? '✓' : '✗'} ${c.label}${c.detail ? `: ${c.detail}` : ''}`);
}

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
  console.log('See docs/guides/17-mobile-push-setup.md');
  process.exit(1);
}
console.log(`\n${checks.length}/${checks.length} checks passed`);
