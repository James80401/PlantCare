/**
 * Validates care guide coverage and depth in the database.
 * Run: npx tsx scripts/verify-care-guides.mjs
 */
import { PrismaClient, TaskType } from '@prisma/client';
import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { speciesCatalog, speciesSeedId } = require('../prisma/data/species-catalog.ts');
const prisma = new PrismaClient();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TASK_TYPES = Object.values(TaskType);
let failed = 0;

function pass(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg) {
  console.log(`✗ ${msg}`);
  failed++;
}

function resolveAsset(imageKey) {
  const isPhoto = imageKey.startsWith('photo-');
  const name = isPhoto ? `${imageKey}.jpg` : `${imageKey}.svg`;
  const sub = isPhoto ? 'photos' : 'images';
  const paths = [
    join(root, 'apps', 'api', 'src', 'care-guides', sub, name),
    join(root, 'apps', 'api', 'dist', 'care-guides', sub, name),
  ];
  return paths.find((p) => existsSync(p)) ?? null;
}

async function main() {
  const speciesInDb = await prisma.plantSpecies.findMany({ select: { id: true } });
  const speciesIds = new Set(speciesInDb.map((s) => s.id));
  const catalogInDb = speciesCatalog.filter((s) =>
    speciesIds.has(speciesSeedId(s.commonName, s.scientificName)),
  ).length;
  const expectedSpeciesGuides = catalogInDb * TASK_TYPES.length;

  const total = await prisma.careGuide.count();
  const speciesSpecific = await prisma.careGuide.count({ where: { speciesId: { not: null } } });

  if (speciesSpecific >= expectedSpeciesGuides * 0.98) {
    pass(`Species guides: ${speciesSpecific} (expected ~${expectedSpeciesGuides})`);
  } else {
    fail(`Species guides: ${speciesSpecific} (expected ~${expectedSpeciesGuides})`);
  }

  if (total >= 7) pass(`Total guides in DB: ${total}`);
  else fail(`Total guides: ${total}`);

  const basilRow = await prisma.plantSpecies.findFirst({ where: { commonName: 'Basil' } });
  const snakeRow = await prisma.plantSpecies.findFirst({ where: { commonName: 'Snake Plant' } });
  const basilId = basilRow?.id ?? speciesSeedId('Basil', 'Ocimum basilicum');
  const snakeId = snakeRow?.id ?? speciesSeedId('Snake Plant', 'Sansevieria trifasciata');

  const waterBasilGuide = basilId
    ? await prisma.careGuide.findFirst({ where: { speciesId: basilId, taskType: TaskType.WATER } })
    : null;
  const waterSnakeGuide = snakeId
    ? await prisma.careGuide.findFirst({ where: { speciesId: snakeId, taskType: TaskType.WATER } })
    : null;

  if (waterBasilGuide) pass('Basil has WATER guide');
  else fail('Basil WATER guide missing');

  if (waterSnakeGuide?.sectionsJson.includes('Light watering')) {
    pass('Snake Plant water guide uses succulent-style copy');
  } else if (waterSnakeGuide) {
    pass('Snake Plant WATER guide present');
  } else fail('Snake Plant WATER guide missing');

  if (waterBasilGuide?.sectionsJson.includes('{waterIntervalDays}')) {
    pass('Guides retain runtime placeholders');
  } else {
    fail('Missing {waterIntervalDays} placeholder in basil water guide');
  }

  const sample = await prisma.careGuide.findMany({
    include: { images: true },
    where: { speciesId: { not: null } },
    take: 400,
  });

  let shallow = 0;
  let minSections = 99;
  let maxSections = 0;
  for (const g of sample) {
    const sections = JSON.parse(g.sectionsJson);
    minSections = Math.min(minSections, sections.length);
    maxSections = Math.max(maxSections, sections.length);
    const bodyLen = sections.reduce((n, sec) => n + (sec.body?.length ?? 0), 0);
    const minSec =
      g.taskType === TaskType.MIST ? 4 : g.taskType === TaskType.WATER || g.taskType === TaskType.PRUNE ? 5 : 4;
    if (sections.length < minSec || bodyLen < 280) shallow++;
  }
  if (shallow === 0) pass(`Depth OK (sample ${sample.length} guides)`);
  else fail(`${shallow} shallow guides in sample of ${sample.length}`);

  pass(`Sections per guide (seeded): ${minSections}–${maxSections} (+ "Your plant right now" at API)`);

  const imageKeys = await prisma.careGuideImage.findMany({
    select: { imageKey: true },
    distinct: ['imageKey'],
  });
  let missing = 0;
  let tinyPhotos = 0;
  const MIN_PHOTO_BYTES = 10_000;
  for (const { imageKey } of imageKeys) {
    const path = resolveAsset(imageKey);
    if (!path) {
      missing++;
      continue;
    }
    if (imageKey.startsWith('photo-')) {
      const size = statSync(path).size;
      if (size < MIN_PHOTO_BYTES) tinyPhotos++;
    }
  }
  if (missing === 0) pass(`All ${imageKeys.length} image keys resolve to files`);
  else fail(`${missing} image keys missing files`);

  if (tinyPhotos === 0) pass('Reference photos meet minimum size (not placeholders)');
  else fail(`${tinyPhotos} photo(s) under ${MIN_PHOTO_BYTES} bytes — run download-care-guide-photos.mjs`);

  await prisma.$disconnect();
  console.log(failed === 0 ? '\nAll care guide checks passed' : `\n${failed} check(s) failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
