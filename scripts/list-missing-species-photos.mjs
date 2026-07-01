import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { LOCAL_PHOTO_MIN_BYTES } from '../apps/api/scripts/species-photo-urls.mjs';

const repoRoot = process.cwd();
const photosDir = join(repoRoot, 'apps/api/src/care-guides/photos/species');

const src = readFileSync(join(repoRoot, 'prisma/data/species-catalog.ts'), 'utf8');
const missing = [];
let total = 0;
const re = /commonName:\s*'([^']+)',\s*scientificName:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src))) {
  total++;
  const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const key = `seed-${slug(m[1])}-${slug(m[2])}`.slice(0, 80);
  const file = join(photosDir, `${key}.jpg`);
  if (!existsSync(file) || readFileSync(file).length < LOCAL_PHOTO_MIN_BYTES) {
    missing.push({ key, commonName: m[1], scientificName: m[2] });
  }
}

console.log(`Missing: ${missing.length}/${total}`);
for (const s of missing) {
  console.log(`- ${s.commonName} (${s.scientificName}) [${s.key}]`);
}
