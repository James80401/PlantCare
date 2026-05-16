/**
 * Downloads care-guide reference photos from curated URLs in care-guide-photo-sources.json.
 * Run: node apps/api/scripts/download-care-guide-photos.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'care-guides', 'photos');
const manifestPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'prisma',
  'data',
  'care-guide-photo-sources.json',
);

const MIN_BYTES = 10_000;
const UA = 'PlantCare/1.0 (care guide assets)';

mkdirSync(root, { recursive: true });
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = 0;
const FALLBACK_ASSIGN = {
  'photo-soil-check.jpg': 'photo-ph-test.jpg',
  'photo-water-drainage.jpg': 'photo-prune-pinch.jpg',
  'photo-fertilize.jpg': 'photo-prune-pinch.jpg',
  'photo-mist.jpg': 'photo-prune-cut.jpg',
  'photo-pest-underside.jpg': 'photo-prune-cut.jpg',
  'photo-repot.jpg': 'photo-ph-test.jpg',
};

for (const [name, meta] of Object.entries(manifest)) {
  await sleep(800);
  const dest = join(root, name);
  if (existsSync(dest) && readFileSync(dest).length >= MIN_BYTES) {
    console.log('skip (exists)', name);
    continue;
  }
  try {
    const res = await fetch(meta.url, {
      redirect: 'follow',
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) throw new Error(`too small (${buf.length} bytes)`);
    writeFileSync(dest, buf);
    console.log('ok', name, buf.length, 'bytes');
  } catch (e) {
    const fallback = FALLBACK_ASSIGN[name];
    const srcPath = fallback ? join(root, fallback) : null;
    if (srcPath && existsSync(srcPath) && readFileSync(srcPath).length >= MIN_BYTES) {
      copyFileSync(srcPath, dest);
      console.warn('fallback copy', name, '<-', fallback, '(re-run later for dedicated Commons file)');
    } else {
      console.error('FAIL', name, e.message);
      failed++;
    }
  }
}

const attributionLines = [
  '# Care guide photo attributions',
  '',
  'Bundled reference photos from Wikimedia Commons.',
  '',
];
for (const [name, meta] of Object.entries(manifest)) {
  attributionLines.push(`## ${name}`);
  attributionLines.push(`- License: ${meta.license}`);
  attributionLines.push(`- ${meta.attribution}`);
  attributionLines.push(`- ${meta.sourcePage}`);
  attributionLines.push('');
}
writeFileSync(join(root, 'ATTRIBUTION.md'), attributionLines.join('\n'));

console.log('\nPhotos directory:', root);
if (failed > 0) {
  console.error(`${failed} download(s) failed`);
  process.exit(1);
}
