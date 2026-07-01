import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  LOCAL_PHOTO_MIN_BYTES,
  isReusablePhotoLicense,
} from '../apps/api/scripts/species-photo-urls.mjs';

const repoRoot = process.cwd();
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
const photosDir = join(repoRoot, 'apps', 'api', 'src', 'care-guides', 'photos', 'species');
const catalogPath = join(repoRoot, 'prisma', 'data', 'species-catalog.ts');
const strict = process.argv.includes('--strict');

function slugId(commonName, scientificName) {
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `seed-${slug(commonName)}-${slug(scientificName)}`.slice(0, 80);
}

function loadCatalog() {
  const src = readFileSync(catalogPath, 'utf8');
  const entries = [];
  const re = /commonName:\s*'([^']+)',\s*scientificName:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({
      id: slugId(m[1], m[2]),
      commonName: m[1],
      scientificName: m[2],
    });
  }
  return entries;
}

if (!existsSync(manifestPath)) {
  console.error('Missing species photo manifest.');
  process.exit(1);
}

const catalog = loadCatalog();
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const restricted = [];
const missingManifest = [];
const missingFile = [];
let reusable = 0;
let localFiles = 0;

for (const species of catalog) {
  const meta = manifest[species.id];
  const file = join(photosDir, `${species.id}.jpg`);
  const hasFile = existsSync(file) && readFileSync(file).length >= LOCAL_PHOTO_MIN_BYTES;
  if (hasFile) localFiles++;

  if (!meta?.url) {
    missingManifest.push(species);
    if (!hasFile) missingFile.push(species);
    continue;
  }

  if (isReusablePhotoLicense(meta.license)) {
    reusable++;
  } else {
    restricted.push({
      ...species,
      provider: meta.provider,
      license: meta.license || 'missing license',
    });
  }

  if (!hasFile) {
    missingFile.push(species);
  }
}

console.log(`Catalog species: ${catalog.length}`);
console.log(`Reusable manifest entries: ${reusable}`);
console.log(`Restricted or unclear manifest entries: ${restricted.length}`);
console.log(`Missing manifest entries: ${missingManifest.length}`);
console.log(`Local photo files: ${localFiles}`);
console.log(`Missing local files: ${missingFile.length}`);

if (restricted.length > 0) {
  console.log('\nRestricted or unclear licenses:');
  for (const item of restricted.slice(0, 80)) {
    console.log(`- ${item.commonName} (${item.scientificName}) - ${item.provider}: ${item.license}`);
  }
  if (restricted.length > 80) {
    console.log(`- ... ${restricted.length - 80} more`);
  }
}

if (missingManifest.length > 0) {
  console.log('\nMissing manifest entries:');
  for (const item of missingManifest.slice(0, 80)) {
    console.log(`- ${item.commonName} (${item.scientificName})`);
  }
  if (missingManifest.length > 80) {
    console.log(`- ... ${missingManifest.length - 80} more`);
  }
}

if (strict && (restricted.length > 0 || missingManifest.length > 0 || missingFile.length > 0)) {
  process.exit(1);
}
