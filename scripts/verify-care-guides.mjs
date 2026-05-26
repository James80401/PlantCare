/**
 * Validates care guide coverage and depth in the database.
 * Run: npx tsx scripts/verify-care-guides.mjs
 */
import { PrismaClient, TaskType } from '@prisma/client';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { speciesCatalog, speciesSeedId } = require('../prisma/data/species-catalog.ts');
const prisma = new PrismaClient();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const TASK_TYPES = Object.values(TaskType);

/** Task types migrated to structured seed content (B1). */
const STRUCTURED_TASK_TYPES = [TaskType.WATER, TaskType.FERTILIZE, TaskType.REPOT, TaskType.PRUNE];

const MIN_SECTIONS_BY_TASK = {
  [TaskType.WATER]: 7,
  [TaskType.FERTILIZE]: 6,
  [TaskType.REPOT]: 5,
  [TaskType.PRUNE]: 6,
  [TaskType.MIST]: 5,
  [TaskType.PH_TEST]: 5,
  [TaskType.PEST_CONTROL]: 4,
  [TaskType.INSPECT_PESTS]: 4,
  [TaskType.ROTATE]: 3,
  [TaskType.CLEAN_LEAVES]: 3,
  [TaskType.CHECK_MOISTURE]: 3,
  [TaskType.HEALTH_CHECK]: 3,
};

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

function sectionTextLen(sec) {
  return (
    (sec.body?.length ?? 0) +
    (sec.beginnerBody?.length ?? 0) +
    (sec.advancedBody?.length ?? 0) +
    (sec.whyItMatters?.length ?? 0)
  );
}

function missingStructuredFields(sections) {
  return sections.filter((sec) => !sec.whyItMatters || !sec.beginnerBody || !sec.advancedBody);
}

function assertStructuredGuide(label, sectionsJson) {
  const sections = JSON.parse(sectionsJson);
  const missing = missingStructuredFields(sections);
  if (missing.length === 0) {
    pass(`${label} has structured fields on all ${sections.length} sections`);
    return true;
  }
  fail(`${label} missing structured fields on ${missing.length} section(s)`);
  return false;
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

  for (const taskType of STRUCTURED_TASK_TYPES) {
    const generic = await prisma.careGuide.findFirst({
      where: { taskType, speciesId: null },
    });
    if (!generic) {
      fail(`Generic ${taskType} guide missing`);
      continue;
    }
    assertStructuredGuide(`${taskType} generic guide`, generic.sectionsJson);
  }

  if (waterBasilGuide) {
    assertStructuredGuide('Basil WATER species guide', waterBasilGuide.sectionsJson);
  }
  if (waterSnakeGuide) {
    assertStructuredGuide('Snake Plant WATER species guide', waterSnakeGuide.sectionsJson);
  }

  const sample = await prisma.careGuide.findMany({
    where: { speciesId: { not: null } },
    orderBy: { id: 'asc' },
    take: 400,
  });

  let shallow = 0;
  let minSections = 99;
  let maxSections = 0;
  for (const g of sample) {
    const sections = JSON.parse(g.sectionsJson);
    minSections = Math.min(minSections, sections.length);
    maxSections = Math.max(maxSections, sections.length);
    const contentLen = sections.reduce((n, sec) => n + sectionTextLen(sec), 0);
    const minSec = MIN_SECTIONS_BY_TASK[g.taskType] ?? 4;
    const minContent = STRUCTURED_TASK_TYPES.includes(g.taskType) ? 500 : 200;
    if (sections.length < minSec || contentLen < minContent) shallow++;
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
