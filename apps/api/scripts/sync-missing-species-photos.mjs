/**
 * Re-fetch and download photos for catalog species missing a local JPEG.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
const photosDir = join(repoRoot, 'apps', 'api', 'src', 'care-guides', 'photos', 'species');
const MIN_BYTES = 6_000;

function slugId(commonName, scientificName) {
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `seed-${slug(commonName)}-${slug(scientificName)}`.slice(0, 80);
}

function loadCatalog() {
  const src = readFileSync(join(repoRoot, 'prisma', 'data', 'species-catalog.ts'), 'utf8');
  const entries = [];
  const re = /commonName:\s*'([^']+)',\s*scientificName:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) entries.push({ commonName: m[1], scientificName: m[2] });
  return entries;
}

function missingKeys() {
  return loadCatalog()
    .map((s) => slugId(s.commonName, s.scientificName))
    .filter((key) => {
      const file = join(photosDir, `${key}.jpg`);
      return !existsSync(file) || readFileSync(file).length < MIN_BYTES;
    });
}

const missing = missingKeys();
console.log(`${missing.length} species need photos`);

if (missing.length === 0) {
  process.exit(0);
}

// Re-run full fetch for only species missing files (manifest merge)
spawnSync('node', ['apps/api/scripts/fetch-species-photo-sources.mjs', '--only-missing'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

spawnSync('node', ['apps/api/scripts/download-species-photos.mjs'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: true,
});

const still = missingKeys();
console.log(`Still missing: ${still.length}`);
process.exit(still.length > 40 ? 1 : 0);
