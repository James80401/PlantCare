import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import {
  buildMetadataForSpecies,
  serializeSpeciesMetadata,
} from '../apps/api/src/species/species-metadata';
import { speciesCatalog, speciesSeedId } from './data/species-catalog';
import { legacySpeciesSeedId, resolveSpeciesPhotoFileKey, speciesPhotoUrl } from './data/species-photo-utils';
import { seedCareGuides } from './seed-care-guides';
import { seedBuddyShop } from './seed-buddy-shop';
import { seedBuddyQuests } from './seed-buddy-quests';
import { seedDemoGarden } from './seed-demo-garden';

const prisma = new PrismaClient();

const speciesPhotosDir = join(
  process.cwd(),
  'apps',
  'api',
  'src',
  'care-guides',
  'photos',
  'species',
);


async function main() {
  // Remove old seed rows that nothing references (avoids duplicate search hits)
  await prisma.plantSpecies.deleteMany({
    where: {
      id: { startsWith: 'seed-' },
      plants: { none: {} },
    },
  });

  let created = 0;
  let updated = 0;

  for (const s of speciesCatalog) {
    const id = speciesSeedId(s.commonName, s.scientificName);
    const legacyId = legacySpeciesSeedId(s.commonName);
    const legacyInUse = await prisma.plant.count({ where: { speciesId: legacyId } });

    const targetId = legacyInUse > 0 && legacyId !== id ? legacyId : id;
    const existing = await prisma.plantSpecies.findUnique({ where: { id: targetId } });

    const speciesData = { ...s } as typeof s & { defaultImageUrl?: string; metadataJson?: string };
    const photoKey = resolveSpeciesPhotoFileKey(targetId, s, speciesPhotosDir);
    if (photoKey) {
      speciesData.defaultImageUrl = speciesPhotoUrl(photoKey);
    }
    speciesData.metadataJson = serializeSpeciesMetadata(buildMetadataForSpecies(s));

    await prisma.plantSpecies.upsert({
      where: { id: targetId },
      update: speciesData,
      create: { id: targetId, ...speciesData },
    });

    if (existing) updated++;
    else created++;
  }

  const total = await prisma.plantSpecies.count();
  console.log(
    `Species catalog: ${speciesCatalog.length} entries (${created} new, ${updated} updated). Total in DB: ${total}`,
  );

  await seedCareGuides();
  await seedBuddyShop(prisma);
  await seedBuddyQuests(prisma);
  await seedDemoGarden(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
