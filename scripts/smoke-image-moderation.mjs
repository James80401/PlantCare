#!/usr/bin/env node
/**
 * Smoke test for the image moderation pipeline.
 *
 * Hits the real OpenAI vision endpoint with a set of test images and prints
 * the verdict for each. Use this to manually confirm:
 *   - real plant photos are classified isPlant=true
 *   - non-plant photos are classified isPlant=false
 *   - explicit content is classified isExplicit=true (do NOT commit such images;
 *     supply your own with --image=path)
 *
 * Usage:
 *   node scripts/smoke-image-moderation.mjs
 *   node scripts/smoke-image-moderation.mjs --image=/path/to/photo.jpg
 *   node scripts/smoke-image-moderation.mjs --image=plant.jpg --image=cat.jpg
 *
 * Requires OPENAI_API_KEY in .env.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { config as loadEnv } from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnv({ path: join(root, '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();
const MODEL = process.env.OPENAI_MODERATION_MODEL || 'gpt-4o-mini';
const BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

if (!OPENAI_API_KEY) {
  console.error('✗ OPENAI_API_KEY not set in .env. Add a key and retry.');
  process.exit(1);
}

const cliImages = process.argv
  .slice(2)
  .filter((arg) => arg.startsWith('--image='))
  .map((arg) => arg.slice('--image='.length));

const defaultCases = [
  // Real plant photos — should pass.
  { path: 'apps/api/src/care-guides/photos/species/seed-aloe-vera-aloe-barbadensis.jpg', expect: 'plant' },
  { path: 'apps/api/src/care-guides/photos/species/seed-african-violet-saintpaulia-ionantha.jpg', expect: 'plant' },
  { path: 'apps/api/src/care-guides/photos/species/seed-agave-agave-americana.jpg', expect: 'plant' },
  // Care-action photos showing tools-on-grass — these are NOT plant subjects and SHOULD be rejected.
  // If your team intends action shots to be accepted, replace these with a true plant photo and loosen the prompt.
  { path: 'apps/api/src/care-guides/photos/photo-prune-cut.jpg', expect: 'non-plant' },
  // App UI graphic — should be rejected.
  { path: 'apps/web/android/app/src/main/res/drawable/splash.png', expect: 'non-plant' },
];

const cases = cliImages.length
  ? cliImages.map((p) => ({ path: p, expect: 'unknown' }))
  : defaultCases;

const SYSTEM_PROMPT =
  'You are an image content classifier for a plant-care app. ' +
  'Look at the attached image and respond ONLY with valid JSON matching this schema:\n' +
  '{\n' +
  '  "isPlant": true/false,\n' +
  '  "isExplicit": true/false,\n' +
  '  "confidence": 0.0 to 1.0,\n' +
  '  "reason": "one short sentence"\n' +
  '}\n' +
  'Treat unclear, blurry, or text-only images as isPlant=false. ' +
  'Houseplants, garden plants, leaves with disease, soil with seedlings, and close-up flowers all count as plants. ' +
  'Pets, people, food on a plate, packaged products, and indoor scenes without a visible plant do NOT count.';

function mimeFor(p) {
  const ext = extname(p).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return 'image/jpeg';
}

async function classify(imagePath) {
  const absolute = resolve(root, imagePath);
  if (!existsSync(absolute)) {
    return { error: `file not found: ${absolute}` };
  }
  const buf = readFileSync(absolute);
  const base64 = buf.toString('base64');
  const mime = mimeFor(absolute);

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Classify this image.' },
            { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return { error: `HTTP ${res.status}: ${await res.text()}` };
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: `unparseable: ${raw}` };
  }
}

console.log(`Running image-moderation smoke against ${BASE_URL} (model: ${MODEL})`);
console.log(`Testing ${cases.length} image(s)\n`);

let failures = 0;
for (const { path, expect } of cases) {
  process.stdout.write(`• ${basename(path).padEnd(40)} `);
  const verdict = await classify(path);
  if (verdict.error) {
    console.log(`ERROR  ${verdict.error}`);
    failures += 1;
    continue;
  }
  const tag = verdict.isExplicit
    ? 'EXPLICIT'
    : verdict.isPlant
    ? 'PLANT'
    : 'NOT-PLANT';
  const matches =
    expect === 'unknown' ||
    (expect === 'plant' && verdict.isPlant && !verdict.isExplicit) ||
    (expect === 'non-plant' && !verdict.isPlant);
  console.log(
    `${tag.padEnd(10)} conf=${(verdict.confidence ?? 0).toFixed(2)}  ${matches ? '✓' : '✗'}  ${verdict.reason || ''}`,
  );
  if (!matches) failures += 1;
}

console.log('');
if (failures) {
  console.log(`${failures} test(s) did not match expectations.`);
  process.exit(1);
}
console.log('All classifications matched expectations.');
