import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const repoRoot = process.cwd();
const photosDir = join(repoRoot, 'apps/api/src/care-guides/photos/species');
const MIN = 6000;

const src = readFileSync(join(repoRoot, 'prisma/data/species-catalog.ts'), 'utf8');
const missing = [];
const re = /commonName:\s*'([^']+)',\s*scientificName:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src))) {
  const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const key = `seed-${slug(m[1])}-${slug(m[2])}`.slice(0, 80);
  const file = join(photosDir, `${key}.jpg`);
  if (!existsSync(file) || readFileSync(file).length < MIN) {
    missing.push({ key, commonName: m[1], scientificName: m[2] });
  }
}

console.log(`Missing: ${missing.length}/320`);
for (const s of missing) {
  console.log(`- ${s.commonName} (${s.scientificName}) [${s.key}]`);
}
