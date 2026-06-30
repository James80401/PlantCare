/**
 * Smoke-test SMTP and OpenAI from an env file (no secrets printed).
 * Usage:
 *   node scripts/test-integrations.mjs
 *   node scripts/test-integrations.mjs --env .env.production --send-test-email
 */
import { readFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import axios from 'axios';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  let raw;
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

const sendTestEmail = process.argv.includes('--send-test-email');

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const envPath = argValue('--env') || join(root, '.env');
loadEnvFile(resolve(root, envPath));

function clean(value) {
  if (!value) return '';
  return String(value).trim().replace(/^["']|["']$/g, '');
}

function normalizeAppPassword(pass) {
  return clean(pass).replace(/\s+/g, '');
}

async function testSmtp() {
  const user = clean(process.env.SMTP_USER);
  const pass = normalizeAppPassword(process.env.SMTP_PASS);
  const host = clean(process.env.SMTP_HOST) || 'smtp.gmail.com';
  const port = parseInt(clean(process.env.SMTP_PORT) || '587', 10);

  if (!user || !pass) {
    return { ok: false, detail: 'SMTP_USER or SMTP_PASS missing in .env' };
  }

  if (host === 'smtp.sendgrid.net') {
    if (user !== 'apikey') {
      return { ok: false, detail: 'SendGrid SMTP requires SMTP_USER=apikey' };
    }
    if (!pass.startsWith('SG.')) {
      return {
        ok: false,
        detail: 'SendGrid SMTP_PASS should be the full API key starting with SG.',
      };
    }
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: { user, pass },
  });

  try {
    await transport.verify();
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }

  if (sendTestEmail) {
    const from =
      clean(process.env.EMAIL_FROM) || `"Dr. Plant" <${user}>`;
    try {
      const info = await transport.sendMail({
        from,
        to: user,
        subject: 'Dr. Plant SMTP test',
        text: 'If you received this, SMTP is working.',
        html: '<p>If you received this, <strong>SMTP is working</strong>.</p>',
      });
      await transport.close();
      return { ok: true, detail: `verify OK; test email sent (id: ${info.messageId || 'n/a'})` };
    } catch (err) {
      await transport.close();
      return {
        ok: false,
        detail: `verify OK but send failed: ${err instanceof Error ? err.message : err}`,
      };
    }
  }

  await transport.close();
  return { ok: true, detail: `verify OK (${host}:${port})` };
}

async function testOpenAI() {
  const apiKey = clean(process.env.OPENAI_API_KEY);
  const model = clean(process.env.OPENAI_MODEL) || 'gpt-4.1-mini';
  const baseUrl = (clean(process.env.OPENAI_BASE_URL) || 'https://api.openai.com/v1').replace(
    /\/$/,
    '',
  );

  if (!apiKey) {
    return { ok: false, detail: 'OPENAI_API_KEY missing in .env' };
  }

  try {
    const { data } = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        max_tokens: 32,
        messages: [
          {
            role: 'user',
            content: 'Reply with valid JSON only: {"status":"ok"}',
          },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = data.choices?.[0]?.message?.content?.trim() || '';
    const usage = data.usage;
    return {
      ok: true,
      detail: `model=${model}; reply=${content.slice(0, 80)}; tokens=${usage?.total_tokens ?? 'n/a'}`,
    };
  } catch (err) {
    const status = err.response?.status;
    const msg =
      err.response?.data?.error?.message ||
      (err instanceof Error ? err.message : String(err));
    return {
      ok: false,
      detail: status ? `HTTP ${status}: ${msg}` : msg,
    };
  }
}

async function main() {
  console.log(`Dr. Plant integration checks (${envPath})\n`);

  const smtp = await testSmtp();
  console.log(smtp.ok ? `✓ SMTP: ${smtp.detail}` : `✗ SMTP: ${smtp.detail}`);

  const openai = await testOpenAI();
  console.log(openai.ok ? `✓ OpenAI: ${openai.detail}` : `✗ OpenAI: ${openai.detail}`);

  const failed = [smtp, openai].filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
