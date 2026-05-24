#!/usr/bin/env node
/**
 * Copy google-services.json.example → google-services.json if missing,
 * or validate an existing google-services.json package name.
 */
import { copyFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const androidApp = resolve(root, 'apps/web/android/app');
const target = resolve(androidApp, 'google-services.json');
const example = resolve(androidApp, 'google-services.json.example');
const expectedPackage = 'com.plantcare.app';

if (!existsSync(resolve(root, 'apps/web/android'))) {
  console.error('Android project missing. Run: npm run mobile:add:android -w @plant-care/web');
  process.exit(1);
}

if (!existsSync(target)) {
  if (!existsSync(example)) {
    console.error('Missing google-services.json.example');
    process.exit(1);
  }
  copyFileSync(example, target);
  console.log('Created apps/web/android/app/google-services.json from example.');
  console.log('Replace placeholders with your Firebase download, then: npm run mobile:sync -w @plant-care/web');
  process.exit(0);
}

try {
  const json = JSON.parse(readFileSync(target, 'utf8'));
  const pkg =
    json.client?.[0]?.client_info?.android_client_info?.package_name ?? '';
  if (pkg !== expectedPackage) {
    console.warn(`Warning: google-services.json package is "${pkg}", expected "${expectedPackage}"`);
  } else {
    console.log(`✓ google-services.json present for ${expectedPackage}`);
  }
  if (String(json.client?.[0]?.api_key?.[0]?.current_key ?? '').includes('YOUR_')) {
    console.warn('Warning: google-services.json still contains placeholder values — download from Firebase.');
    process.exit(1);
  }
  console.log('Ready for: npm run mobile:sync -w @plant-care/web');
} catch (e) {
  console.error('Invalid google-services.json:', e);
  process.exit(1);
}
