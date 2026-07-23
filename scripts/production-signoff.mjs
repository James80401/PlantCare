#!/usr/bin/env node
/**
 * Non-mutating production sign-off. This script never registers users, writes
 * database rows, uploads files, or invokes Playwright setup.
 */
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { loadEnvFile } from './lib/parse-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const liveOnly = args.includes('--live-only');
const envPath = resolve(root, option('--env') || '.env.production');
const writePath = option('--write');
const steps = [];
let apiUrl = '';
let frontendUrl = '';

function record(name, ok, detail = '') {
  steps.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

if (!liveOnly) {
  const preflight = spawnSync(
    process.execPath,
    [resolve(root, 'scripts/check-production-env.mjs'), envPath],
    { cwd: root, stdio: 'inherit' },
  );
  record('Static production configuration', preflight.status === 0);
  if (preflight.status !== 0) finish();
}

const fileVars = liveOnly ? {} : loadEnvFile(envPath) || {};
apiUrl = (process.env.API_URL || fileVars.VITE_API_BASE_URL || '').replace(/\/$/, '');
frontendUrl = (
  process.env.FRONTEND_URL ||
  process.env.UAT_WEB_URL ||
  fileVars.FRONTEND_URL ||
  ''
).replace(/\/$/, '');
if (!apiUrl || !frontendUrl) {
  console.error('Set API_URL and FRONTEND_URL or provide a valid production env file.');
  process.exit(1);
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(20_000) });
}

async function probeJson(name, path, predicate) {
  try {
    const response = await fetchWithTimeout(`${apiUrl}${path}`);
    const body = await response.json().catch(() => ({}));
    record(name, response.ok && predicate(body), `HTTP ${response.status}`);
  } catch (error) {
    record(name, false, error.message);
  }
}

await probeJson('API health', '/health', (body) => body.status === 'ok');
await probeJson(
  'Release identity and feature gates',
  '/health',
  (body) =>
    body.commit &&
    body.commit !== 'unknown' &&
    body.features?.plantBuddy === false &&
    body.features?.premiumBilling === false,
);
await probeJson(
  'API readiness',
  '/health/ready',
  (body) => body.status === 'ready' && body.checks?.database?.ok && body.checks?.uploads?.ok,
);

try {
  const response = await fetchWithTimeout(`${apiUrl}/health`, {
    headers: { Origin: frontendUrl },
  });
  record(
    'CORS allows production web origin',
    response.ok && response.headers.get('access-control-allow-origin') === frontendUrl,
    response.headers.get('access-control-allow-origin') || 'missing header',
  );
} catch (error) {
  record('CORS allows production web origin', false, error.message);
}

try {
  const response = await fetchWithTimeout(frontendUrl, { redirect: 'follow' });
  const contentType = response.headers.get('content-type') || '';
  record(
    'Web static application',
    response.ok && contentType.includes('text/html'),
    `HTTP ${response.status} ${contentType.split(';')[0]}`,
  );
} catch (error) {
  record('Web static application', false, error.message);
}

finish();

function finish() {
  const passed = steps.length > 0 && steps.every((step) => step.ok);
  const timestamp = new Date().toISOString();
  console.log(`Production sign-off ${passed ? 'PASS' : 'FAIL'} — ${timestamp}`);

  if (writePath) {
    const output = resolve(root, writePath);
    mkdirSync(dirname(output), { recursive: true });
    const markdown = [
      `# Production sign-off — ${timestamp}`,
      '',
      '| Check | Result | Detail |',
      '|---|---|---|',
      ...steps.map(
        (step) =>
          `| ${step.name} | ${step.ok ? 'PASS' : 'FAIL'} | ${step.detail || '—'} |`,
      ),
      '',
      `**Overall:** ${passed ? 'PASS' : 'FAIL'}`,
      '',
      `- API: \`${apiUrl || 'not resolved'}\``,
      `- Web: \`${frontendUrl || 'not resolved'}\``,
      '- Mutation policy: health/readiness/CORS/feature/static GET probes only',
      '',
    ].join('\n');
    writeFileSync(output, markdown, 'utf8');
    console.log(`Evidence written to ${output}`);
  }

  process.exit(passed ? 0 : 1);
}
