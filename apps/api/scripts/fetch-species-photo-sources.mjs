/**
 * Resolve species-accurate photo URLs (iNaturalist first, Wikimedia Commons fallback).
 * Writes prisma/data/species-photo-sources.json
 *
 * Usage:
 *   node apps/api/scripts/fetch-species-photo-sources.mjs
 *   node apps/api/scripts/fetch-species-photo-sources.mjs --only-missing
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { FILE_MIN_BYTES, validatePhotoHit } from './species-photo-urls.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
const photosDir = join(
  repoRoot,
  'apps',
  'api',
  'src',
  'care-guides',
  'photos',
  'species',
);
const UA = 'PlantCare/1.0 (species catalog; educational use)';
const INAT_DELAY_MS = 1100;
const COMMONS_DELAY_MS = 3500;

const args = process.argv.slice(2);
const onlyMissing = args.includes('--only-missing');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadCatalog() {
  const catalogPath = join(repoRoot, 'prisma', 'data', 'species-catalog.ts');
  const src = readFileSync(catalogPath, 'utf8');
  const entries = [];
  const re = /commonName:\s*'([^']+)',\s*scientificName:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    entries.push({ commonName: m[1], scientificName: m[2] });
  }
  return entries;
}

function slugId(commonName, scientificName) {
  const slug = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `seed-${slug(commonName)}-${slug(scientificName)}`.slice(0, 80);
}

async function fetchJson(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429) {
      const wait = COMMONS_DELAY_MS * (i + 2);
      console.warn(`  rate limited, waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('HTTP 429 (retries exhausted)');
}

function inaturalistLargeUrl(photo) {
  if (photo?.id) {
    return `https://static.inaturalist.org/photos/${photo.id}/large.jpg`;
  }
  if (photo?.url?.includes('/original.')) return photo.url;
  if (photo?.medium_url) return photo.medium_url.replace('/medium.', '/large.');
  return photo?.url;
}

async function findINaturalistPhoto(scientificName) {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=8`;
  const data = await fetchJson(url);
  const target = scientificName.trim().toLowerCase();

  for (const taxon of data.results || []) {
    const name = (taxon.name || '').trim().toLowerCase();
    if (name !== target) continue;
    const photo = taxon.default_photo;
    if (!photo?.url) continue;
    const imageUrl = inaturalistLargeUrl(photo);
    return {
      provider: 'iNaturalist',
      inatPhotoId: photo.id,
      url: imageUrl,
      license: photo.license_code || 'see iNaturalist',
      attribution: photo.attribution || 'iNaturalist community',
      sourcePage: `https://www.inaturalist.org/taxa/${taxon.id}`,
      score: 100,
    };
  }

  for (const taxon of data.results || []) {
    const photo = taxon.default_photo;
    if (!photo?.url) continue;
    if (!(taxon.name || '').toLowerCase().startsWith(target.split(' ')[0])) continue;
    return {
      provider: 'iNaturalist',
      inatPhotoId: photo.id,
      url: inaturalistLargeUrl(photo),
      license: photo.license_code || 'see iNaturalist',
      attribution: photo.attribution || 'iNaturalist community',
      sourcePage: `https://www.inaturalist.org/taxa/${taxon.id}`,
      score: 60,
    };
  }

  return null;
}

function licenseFromMeta(extmetadata = {}) {
  const license =
    extmetadata.LicenseShortName?.value ||
    extmetadata.UsageTerms?.value ||
    'See Commons file page';
  const artist =
    extmetadata.Artist?.value?.replace(/<[^>]+>/g, '').trim() ||
    extmetadata.Credit?.value?.replace(/<[^>]+>/g, '').trim() ||
    'Wikimedia Commons';
  return { license, attribution: artist };
}

async function findCommonsPhoto(scientificName) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', `"${scientificName}"`);
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', '8');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|thumburl|size|mime|extmetadata');
  url.searchParams.set('iiurlwidth', '960');

  const data = await fetchJson(url.toString());
  const pages = data.query?.pages;
  if (!pages) return null;

  const genus = scientificName.split(' ')[0].toLowerCase();
  let best = null;

  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info?.url || !info.mime?.startsWith('image/')) continue;
    if ((info.size || 0) < 12_000) continue;
    const title = (page.title || '').toLowerCase();
    if (!title.includes(genus)) continue;
    if (title.includes('icon') || title.includes('logo')) continue;

    const candidate = {
      provider: 'Wikimedia Commons',
      url: info.thumburl || info.url,
      sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
      score: title.includes(genus.replace(/ /g, '_')) ? 40 : 20,
      ...licenseFromMeta(info.extmetadata),
    };
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}

async function findWikipediaPhoto(scientificName) {
  const title = encodeURIComponent(scientificName.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${title}&prop=pageimages&piprop=original`;
  const data = await fetchJson(url);
  const pages = data.query?.pages;
  if (!pages) return null;
  for (const page of Object.values(pages)) {
    const src = page.original?.source;
    if (!src?.startsWith('http')) continue;
    return {
      provider: 'Wikipedia',
      url: src,
      license: 'See Wikipedia file page',
      attribution: 'Wikipedia',
      sourcePage: `https://en.wikipedia.org/wiki/${title}`,
      score: 35,
    };
  }
  return null;
}

async function findPhoto(commonName, scientificName) {
  await sleep(INAT_DELAY_MS);
  const inat = await findINaturalistPhoto(scientificName);
  if (inat) {
    const ok = await validatePhotoHit(inat);
    if (ok) return ok;
  }

  await sleep(COMMONS_DELAY_MS);
  try {
    const commons = await findCommonsPhoto(scientificName);
    if (commons) {
      const ok = await validatePhotoHit(commons);
      if (ok) return ok;
    }
  } catch (e) {
    console.warn('  Commons:', e.message);
  }

  await sleep(800);
  const wiki = await findWikipediaPhoto(scientificName);
  if (wiki) {
    const ok = await validatePhotoHit(wiki);
    if (ok) return ok;
  }
  return null;
}

async function main() {
  const catalog = loadCatalog();
  let manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};

  let found = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < catalog.length; i++) {
    const species = catalog[i];
    const key = slugId(species.commonName, species.scientificName);
    if (onlyMissing) {
      const file = join(photosDir, `${key}.jpg`);
      if (
        manifest[key]?.url &&
        existsSync(file) &&
        readFileSync(file).length >= FILE_MIN_BYTES
      ) {
        skipped++;
        continue;
      }
      delete manifest[key];
    }

    process.stdout.write(`[${i + 1}/${catalog.length}] ${species.commonName} … `);
    const hit = await findPhoto(species.commonName, species.scientificName);

    if (hit) {
      manifest[key] = {
        commonName: species.commonName,
        scientificName: species.scientificName,
        provider: hit.provider,
        url: hit.url,
        license: hit.license,
        attribution: hit.attribution,
        sourcePage: hit.sourcePage,
        score: hit.score,
      };
      found++;
      console.log(hit.provider, `(score ${hit.score})`);
    } else {
      failed++;
      console.log('no match');
    }

    if ((i + 1) % 15 === 0) {
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }
  }

  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\nDone.');
  console.log(
    `Catalog: ${catalog.length}, found: ${found}, skipped: ${skipped}, no match: ${failed}, manifest: ${Object.keys(manifest).length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
