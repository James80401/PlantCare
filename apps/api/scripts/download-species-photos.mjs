/**
 * Download species catalog photos from species-photo-sources.json
 * → apps/api/src/care-guides/photos/species/{seed-id}.jpg
 *
 * Run: node apps/api/scripts/download-species-photos.mjs
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  candidateUrls,
  FILE_MIN_BYTES as MIN_BYTES,
  UA,
} from './species-photo-urls.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
const destRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'care-guides',
  'photos',
  'species',
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function downloadToFile(meta, dest) {
  const urls = candidateUrls(meta);
  let lastError = 'no urls';
  for (const url of urls) {
    for (let attempt = 0; attempt < 3; attempt++) {
      await sleep(1500 + attempt * 2000);
      try {
        const res = await fetch(url, {
          redirect: 'follow',
          headers: { 'User-Agent': UA, Referer: 'https://www.inaturalist.org/' },
        });
        if (res.status === 429 || res.status === 403) {
          lastError = `HTTP ${res.status} ${url}`;
          break;
        }
        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < MIN_BYTES) {
          lastError = `too small (${buf.length})`;
          continue;
        }
        writeFileSync(dest, buf);
        return buf.length;
      } catch (e) {
        lastError = e.message;
      }
    }
  }
  throw new Error(lastError);
}

async function main() {
  if (!existsSync(manifestPath)) {
    console.error('Missing manifest. Run: node apps/api/scripts/fetch-species-photo-sources.mjs');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  mkdirSync(destRoot, { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;
  const attribution = [
    '# Species catalog photo attributions',
    '',
    'Per-species reference images from Wikimedia Commons (see manifest for license).',
    '',
  ];

  for (const [key, meta] of Object.entries(manifest)) {
    if (!meta?.url) continue;
    const dest = join(destRoot, `${key}.jpg`);
    attribution.push(`## ${meta.commonName || key}`);
    attribution.push(`- Scientific: *${meta.scientificName || 'n/a'}*`);
    attribution.push(`- License: ${meta.license || 'See Commons'}`);
    attribution.push(`- ${meta.attribution || 'Wikimedia Commons'}`);
    attribution.push(`- ${meta.sourcePage || meta.url}`);
    attribution.push('');

    if (existsSync(dest) && readFileSync(dest).length >= MIN_BYTES) {
      skip++;
      continue;
    }

    try {
      const bytes = await downloadToFile(meta, dest);
      ok++;
      console.log('ok', key, bytes, 'bytes');
    } catch (e) {
      fail++;
      console.error('FAIL', key, e.message);
    }
  }

  writeFileSync(join(destRoot, 'ATTRIBUTION.md'), attribution.join('\n'));
  console.log(`\nDownloaded: ${ok}, skipped: ${skip}, failed: ${fail}`);
  console.log('Directory:', destRoot);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
