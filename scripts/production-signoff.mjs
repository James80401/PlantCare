#!/usr/bin/env node
/**
 * G3 production deploy sign-off: validate env, probe live URLs, run verify/smoke (optional e2e).
 *
 * Usage:
 *   npm run production:signoff
 *   npm run production:signoff -- --e2e
 *   API_URL=https://api.example.com/api/v1 FRONTEND_URL=https://app.example.com npm run production:signoff -- --live-only
 *
 * Options:
 *   --env <path>       Env file (default: .env.production)
 *   --live-only        Skip static env file checks; require API_URL + FRONTEND_URL in env
 *   --skip-verify      Only static + live probes (no verify/smoke/e2e)
 *   --e2e              Also run Playwright uat:e2e (needs UAT_WEB_URL)
 *   --write <path>     Append markdown summary to file
 */
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/parse-env.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function flag(name) {
  return args.includes(name);
}

function optValue(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

const envPath = resolve(root, optValue('--env') || '.env.production');
const liveOnly = flag('--live-only');
const skipVerify = flag('--skip-verify');
const runE2e = flag('--e2e');
const writePath = optValue('--write');

const steps = [];
let failed = false;

function step(name, ok, detail = '') {
  steps.push({ name, ok, detail });
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) failed = true;
}

function run(cmd, cmdArgs, env = {}) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

const fileVars = liveOnly ? {} : loadEnvFile(envPath) || {};
if (!liveOnly && !Object.keys(fileVars).length) {
  console.error(`Missing or empty ${envPath}`);
  console.error('Copy .env.production.example → .env.production, or use --live-only with API_URL + FRONTEND_URL.');
  process.exit(1);
}

if (!liveOnly) {
  const check = run('node', [resolve(root, 'scripts/check-production-env.mjs'), envPath]);
  step('Static production env (.env.production)', check);
  if (!check) {
    printSummary();
    process.exit(1);
  }
}

const apiUrl = (process.env.API_URL || fileVars.VITE_API_BASE_URL || '').replace(/\/$/, '');
const frontendUrl = (process.env.FRONTEND_URL || process.env.UAT_WEB_URL || fileVars.FRONTEND_URL || '').replace(
  /\/$/,
  '',
);

if (!apiUrl || !frontendUrl) {
  console.error('Set API_URL and FRONTEND_URL (or UAT_WEB_URL) in env or .env.production');
  process.exit(1);
}

console.log(`\nLive probes → API ${apiUrl} · Web ${frontendUrl}\n`);

async function probeHealth() {
  try {
    const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(20_000) });
    const data = await res.json().catch(() => ({}));
    step('API health GET /health', res.ok && data.status === 'ok', `HTTP ${res.status}`);
  } catch (err) {
    step('API health GET /health', false, err.message);
  }
}

async function probeCors() {
  try {
    const res = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { Origin: frontendUrl },
      signal: AbortSignal.timeout(20_000),
    });
    const acao = res.headers.get('access-control-allow-origin');
    const ok =
      res.ok &&
      (acao === frontendUrl || acao === '*' || (acao && acao.includes(frontendUrl.replace(/^https?:\/\//, ''))));
    step(
      'CORS allows FRONTEND_URL',
      ok,
      acao ? `Access-Control-Allow-Origin: ${acao}` : 'no ACAO header (check API CORS_ORIGINS)',
    );
  } catch (err) {
    step('CORS allows FRONTEND_URL', false, err.message);
  }
}

async function probeWeb() {
  try {
    const res = await fetch(frontendUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    const contentType = res.headers.get('content-type') || '';
    const ok = res.ok && (contentType.includes('text/html') || contentType.includes('text/plain'));
    step('Web app reachable', ok, `HTTP ${res.status} ${contentType.split(';')[0]}`);
  } catch (err) {
    step('Web app reachable', false, err.message);
  }
}

await probeHealth();
await probeCors();
await probeWeb();

if (!skipVerify && !failed) {
  console.log('\nIntegration checks\n');
  const verifyOk = run('npm', ['run', 'verify'], { API_URL: apiUrl });
  step('npm run verify', verifyOk);

  const smokeOk = verifyOk && run('npm', ['run', 'smoke:buddy'], { API_URL: apiUrl });
  step('npm run smoke:buddy', smokeOk);

  if (runE2e) {
    const e2eOk =
      verifyOk &&
      run('npm', ['run', 'uat:e2e'], {
        API_URL: apiUrl,
        UAT_WEB_URL: process.env.UAT_WEB_URL || frontendUrl,
      });
    step('npm run uat:e2e', e2eOk);
  } else {
    console.log('\n  (Skip e2e — pass --e2e to run Playwright against production web)\n');
  }
} else if (skipVerify) {
  console.log('\n  (--skip-verify: live probes only)\n');
} else {
  console.log('\n  Skipping verify/smoke because a live probe failed.\n');
}

printSummary(writePath);

process.exit(failed ? 1 : 0);

function printSummary(writeTo) {
  const date = new Date().toISOString().slice(0, 10);
  const allOk = steps.every((s) => s.ok);
  console.log('\n--- Sign-off summary ---');
  console.log(allOk ? 'PASS — production sign-off checks passed' : 'FAIL — fix items above and re-run');
  console.log(`API: ${apiUrl}`);
  console.log(`Web: ${frontendUrl}`);
  console.log(`Date: ${date}`);

  if (writeTo) {
    const out = resolve(root, writeTo);
    mkdirSync(dirname(out), { recursive: true });
    const md = [
      `# Production sign-off — ${date}`,
      '',
      `| Check | Result | Detail |`,
      `|-------|--------|--------|`,
      ...steps.map((s) => `| ${s.name} | ${s.ok ? 'PASS' : 'FAIL'} | ${s.detail || '—'} |`),
      '',
      `**Overall:** ${allOk ? 'PASS' : 'FAIL'}`,
      '',
      `- API: \`${apiUrl}\``,
      `- Web: \`${frontendUrl}\``,
      '',
      'Signed: _____________________  Date: __________',
      '',
    ].join('\n');
    writeFileSync(out, md, 'utf8');
    console.log(`\nWrote ${out}`);
  } else {
    console.log('\nRecord sign-off: copy output into docs/product/uat-checklist.md §F or run with:');
    console.log('  npm run production:signoff -- --write docs/operations/signoffs/latest.md');
  }
}
