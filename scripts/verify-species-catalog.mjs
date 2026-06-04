/**
 * Validates species catalog field quality and discovery-filter coverage.
 * Run: npx tsx scripts/verify-species-catalog.mjs
 */
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { speciesCatalog } = require('../prisma/data/species-catalog.ts');
// Use the SAME inference the seed persists (metadataJson) and the API reads at
// query time, so this audit can never drift from real filter behavior.
const { buildMetadataForSpecies } = require('../apps/api/src/species/species-metadata.ts');

let failed = 0;

function pass(message) {
  console.log(`✓ ${message}`);
}

function fail(message) {
  failed++;
  console.log(`✗ ${message}`);
}

function text(species) {
  return `${species.commonName} ${species.scientificName ?? ''} ${species.careNotes ?? ''}`.toLowerCase();
}

function matches(species, filter) {
  const sunlight = species.sunlight?.toLowerCase() ?? '';
  const toxicity = species.toxicity?.toLowerCase() ?? '';
  const searchable = text(species);
  const edibleTerms = [
    'basil',
    'mint',
    'thyme',
    'oregano',
    'sage',
    'parsley',
    'cilantro',
    'dill',
    'chive',
    'lavender',
    'tomato',
    'pepper',
    'lettuce',
    'spinach',
    'kale',
    'cucumber',
    'zucchini',
    'bean',
    'pea',
    'strawberry',
    'blueberry',
    'apple',
    'citrus',
    'fig',
    'harvest',
    'edible',
    'tea',
    'kitchen',
    'flavor',
  ];

  if (filter === 'petSafe') return toxicity.includes('non-toxic') || toxicity.includes('safe');
  if (filter === 'lowLight') return sunlight.includes('low');
  if (filter === 'edible') return edibleTerms.some((term) => searchable.includes(term));
  if (filter === 'droughtTolerant') {
    return species.wateringFreqDays >= 10 || searchable.includes('drought');
  }
  if (filter === 'indoor') {
    return sunlight.includes('indirect') || sunlight.includes('low') || sunlight.includes('medium');
  }
  if (filter === 'outdoor') {
    return (
      sunlight.includes('full sun') ||
      sunlight.includes('partial') ||
      searchable.includes('outdoor') ||
      searchable.includes('garden')
    );
  }
  return false;
}

if (speciesCatalog.length >= 300) {
  pass(`Catalog size: ${speciesCatalog.length}`);
} else {
  fail(`Catalog size too small: ${speciesCatalog.length}`);
}

const missing = speciesCatalog.filter(
  (species) =>
    !species.commonName ||
    !species.scientificName ||
    !species.sunlight ||
    !species.wateringFreqDays ||
    !species.toxicity ||
    species.phMin == null ||
    species.phMax == null ||
    !species.careNotes,
);

if (missing.length === 0) {
  pass('All species include core search/care fields');
} else {
  fail(`${missing.length} species missing core fields`);
}

const filters = ['petSafe', 'lowLight', 'edible', 'droughtTolerant', 'indoor', 'outdoor'];
for (const filter of filters) {
  const count = speciesCatalog.filter((species) => matches(species, filter)).length;
  if (count >= 10) pass(`${filter} coverage: ${count}`);
  else fail(`${filter} coverage too low: ${count}`);
}

const metadataCache = new WeakMap();
function metadataFor(species) {
  let meta = metadataCache.get(species);
  if (!meta) {
    meta = buildMetadataForSpecies(species);
    metadataCache.set(species, meta);
  }
  return meta;
}

function matchesPhase3(species, filter) {
  const meta = metadataFor(species);
  if (filter === 'highHumidity') return meta.humidity === 'high';
  if (filter === 'pollinatorFriendly') return meta.pollinatorFriendly === true;
  if (filter === 'bloomsIndoors') return meta.bloomsIndoors === true;
  return false;
}

for (const filter of ['highHumidity', 'pollinatorFriendly', 'bloomsIndoors']) {
  const count = speciesCatalog.filter((species) => matchesPhase3(species, filter)).length;
  if (count >= 5) pass(`${filter} coverage: ${count}`);
  else fail(`${filter} coverage too low: ${count}`);
}

const duplicateKeys = new Set();
const seen = new Set();
for (const species of speciesCatalog) {
  const key = `${species.commonName.toLowerCase()}|${species.scientificName.toLowerCase()}`;
  if (seen.has(key)) duplicateKeys.add(key);
  seen.add(key);
}

if (duplicateKeys.size === 0) {
  pass('No duplicate common/scientific name pairs');
} else {
  fail(`${duplicateKeys.size} duplicate common/scientific name pairs`);
}

console.log(failed === 0 ? '\nSpecies catalog checks passed' : `\n${failed} check(s) failed`);
process.exit(failed ? 1 : 0);
