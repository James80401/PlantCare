import { PrismaClient } from '@prisma/client';
import { careGuideSeeds } from './data/care-guides';
import { speciesCatalog, speciesSeedId } from './data/species-catalog';

const prisma = new PrismaClient();
const BATCH = 100;

/** Map catalog seed IDs to actual PlantSpecies.id rows (handles legacy seed-basil vs seed-basil-ocimum-...) */
async function buildSpeciesIdMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const s of speciesCatalog) {
    const catalogId = speciesSeedId(s.commonName, s.scientificName);
    const row = await prisma.plantSpecies.findFirst({
      where: {
        OR: [
          { id: catalogId },
          { commonName: s.commonName, scientificName: s.scientificName },
        ],
      },
      select: { id: true },
    });
    if (row) map.set(catalogId, row.id);
  }
  return map;
}

function remapGuide(
  g: (typeof careGuideSeeds)[number],
  idMap: Map<string, string>,
): (typeof careGuideSeeds)[number] | null {
  if (!g.speciesId) return g;
  const dbId = idMap.get(g.speciesId);
  if (!dbId) return null;
  const newGuideId = `guide-${g.taskType.toLowerCase()}-${dbId}`.slice(0, 100);
  return {
    ...g,
    id: newGuideId,
    speciesId: dbId,
  };
}

export async function seedCareGuides() {
  const idMap = await buildSpeciesIdMap();

  const guides = careGuideSeeds
    .map((g) => remapGuide(g, idMap))
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const seen = new Set<string>();
  const deduped = guides.filter((g) => {
    const key = g.speciesId ? `${g.taskType}:${g.speciesId}` : `generic:${g.taskType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length < careGuideSeeds.length) {
    console.warn(
      `Mapped ${deduped.length} guides (${careGuideSeeds.length - deduped.length} skipped — no matching species row)`,
    );
  }

  console.log(
    `Seeding ${deduped.length} care guides (${deduped.filter((g) => g.speciesId).length} species-specific)…`,
  );

  await prisma.careGuideImage.deleteMany({});
  await prisma.careGuide.deleteMany({});

  for (let i = 0; i < deduped.length; i += BATCH) {
    const chunk = deduped.slice(i, i + BATCH);
    await prisma.careGuide.createMany({
      data: chunk.map((g) => ({
        id: g.id,
        taskType: g.taskType,
        speciesId: g.speciesId ?? null,
        title: g.title,
        summary: g.summary,
        sectionsJson: JSON.stringify(g.sections),
      })),
    });
  }

  const imageRows = deduped.flatMap((g) =>
    g.images.map((img) => ({
      careGuideId: g.id,
      imageKey: img.imageKey,
      caption: img.caption,
      altText: img.altText,
      sortOrder: img.sortOrder,
    })),
  );

  for (let i = 0; i < imageRows.length; i += 500) {
    await prisma.careGuideImage.createMany({ data: imageRows.slice(i, i + 500) });
  }

  const counts = deduped.map((g) => g.sections.length);
  const minSec = Math.min(...counts);
  const maxSec = Math.max(...counts);
  const total = await prisma.careGuide.count();
  const speciesSpecific = await prisma.careGuide.count({ where: { speciesId: { not: null } } });
  console.log(
    `Care guides done: ${total} total (${speciesSpecific} species-specific, ${imageRows.length} image rows, sections ${minSec}–${maxSec} per guide)`,
  );
}

if (require.main === module) {
  seedCareGuides()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
