import { PrismaClient } from '@prisma/client';
import { speciesCatalog, speciesSeedId } from './data/species-catalog';
import { seedCareGuides } from './seed-care-guides';

const prisma = new PrismaClient();

function legacySeedId(commonName: string): string {
  return `seed-${commonName.toLowerCase().replace(/\s+/g, '-')}`;
}

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
    const legacyId = legacySeedId(s.commonName);
    const legacyInUse = await prisma.plant.count({ where: { speciesId: legacyId } });

    const targetId = legacyInUse > 0 && legacyId !== id ? legacyId : id;
    const existing = await prisma.plantSpecies.findUnique({ where: { id: targetId } });

    await prisma.plantSpecies.upsert({
      where: { id: targetId },
      update: s,
      create: { id: targetId, ...s },
    });

    if (existing) updated++;
    else created++;
  }

  const total = await prisma.plantSpecies.count();
  console.log(
    `Species catalog: ${speciesCatalog.length} entries (${created} new, ${updated} updated). Total in DB: ${total}`,
  );

  await seedCareGuides();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
