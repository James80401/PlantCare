import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { LOCAL_PHOTO_MIN_BYTES } from '../apps/api/scripts/species-photo-urls.mjs';

const prisma = new PrismaClient();
const repoRoot = process.cwd();
const photosDir = join(repoRoot, 'apps', 'api', 'src', 'care-guides', 'photos', 'species');
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');

async function main() {
  const total = await prisma.plantSpecies.count();
  const withUrl = await prisma.plantSpecies.count({
    where: { defaultImageUrl: { not: null } },
  });

  let filesOk = 0;
  let filesMissing = 0;
  if (existsSync(photosDir)) {
    const species = await prisma.plantSpecies.findMany({
      select: { id: true, commonName: true, defaultImageUrl: true },
    });
    for (const s of species) {
      const fromUrl = s.defaultImageUrl?.match(/\/([^/]+\.jpg)$/)?.[1];
      const file = join(photosDir, fromUrl ?? `${s.id}.jpg`);
      if (existsSync(file) && readFileSync(file).length >= LOCAL_PHOTO_MIN_BYTES) {
        filesOk++;
      } else if (s.defaultImageUrl) {
        console.log(`✗ Missing file for ${s.commonName} (${s.id})`);
        filesMissing++;
      }
    }
  }

  const manifestCount = existsSync(manifestPath)
    ? Object.keys(JSON.parse(readFileSync(manifestPath, 'utf8'))).length
    : 0;

  console.log(`✓ Species in DB: ${total}`);
  console.log(`✓ With defaultImageUrl: ${withUrl} (${Math.round((withUrl / total) * 100)}%)`);
  console.log(`✓ Photo files on disk: ${filesOk}`);
  console.log(`✓ Manifest entries: ${manifestCount}`);

  const target = Math.floor(total * 0.9);
  if (withUrl < target || filesMissing > 0) {
    console.error(`\nNeed ≥90% coverage and all files present; run npm run species:photos && npm run db:seed`);
    process.exit(1);
  }

  console.log('\nSpecies photo checks passed');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
