import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');

const base = {
  POSTGRES_USER: 'plantcare',
  POSTGRES_PASSWORD: 'test-database-password-with-enough-entropy',
  POSTGRES_DB: 'plantcare',
  DATABASE_URL:
    'postgresql://plantcare:test-database-password-with-enough-entropy@postgres:5432/plantcare?schema=public',
  JWT_SECRET: 'test-jwt-secret-with-at-least-thirty-two-characters',
  JWT_REFRESH_SECRET:
    'different-refresh-secret-with-at-least-thirty-two-characters',
  FRONTEND_URL: 'https://drplant.app',
  CORS_ORIGINS: 'https://drplant.app,capacitor://localhost',
  VITE_API_BASE_URL: 'https://api.drplant.app/api/v1',
  ENABLE_PLANT_BUDDY: 'false',
  ENABLE_SWAGGER: 'false',
  ENABLE_PREMIUM_BILLING: 'false',
  VITE_ENABLE_PREMIUM_BILLING: 'false',
  SEED_DEMO_DATA: 'false',
  REGISTRATION_REQUIRES_ADMIN_APPROVAL: 'false',
};

function check(overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'plantcare-production-config-'));
  const envPath = join(directory, '.env.production');
  const values = { ...base, ...overrides };
  writeFileSync(
    envPath,
    `${Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')}\n`,
  );
  try {
    return spawnSync(
      process.execPath,
      ['scripts/check-production-env.mjs', envPath],
      { cwd: root, encoding: 'utf8' },
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('accepts matching disabled billing gates', () => {
  const result = check();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Premium billing enabled: false/);
});

test('rejects mismatched web and API billing gates', () => {
  const result = check({ VITE_ENABLE_PREMIUM_BILLING: 'true' });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /ENABLE_PREMIUM_BILLING and VITE_ENABLE_PREMIUM_BILLING must agree/,
  );
});

test('keeps billing disabled throughout the improvement roadmap', () => {
  const result = check({
    ENABLE_PREMIUM_BILLING: 'true',
    VITE_ENABLE_PREMIUM_BILLING: 'true',
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    STRIPE_PRICE_ID_PREMIUM: 'price_example',
  });

  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /Premium billing must remain disabled during the improvement roadmap/,
  );
});
