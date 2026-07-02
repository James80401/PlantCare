/**
 * Resolve species-accurate photo URLs (iNaturalist first, Wikimedia Commons fallback).
 * Writes prisma/data/species-photo-sources.json
 *
 * Usage:
 *   node apps/api/scripts/fetch-species-photo-sources.mjs
 *   node apps/api/scripts/fetch-species-photo-sources.mjs --only-missing
 *   node apps/api/scripts/fetch-species-photo-sources.mjs --replace-restricted-licenses
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  FILE_MIN_BYTES,
  LOCAL_PHOTO_MIN_BYTES,
  isReusablePhotoLicense,
  validatePhotoHit,
} from './species-photo-urls.mjs';

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
const UA = 'DrPlant/1.0 (species catalog; educational use)';
const INAT_DELAY_MS = 1100;
const COMMONS_DELAY_MS = 3500;

const args = process.argv.slice(2);
const onlyMissing = args.includes('--only-missing');
const replaceRestrictedLicenses = args.includes('--replace-restricted-licenses');
const allowRestrictedLicenses = args.includes('--allow-restricted-licenses');

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

function scoreTaxonMatch(taxon, scientificName, commonName) {
  const name = (taxon.name || '').trim().toLowerCase();
  const target = scientificName.trim().toLowerCase();
  const base = target.replace(/\s+var\.\s+.*$/i, '').trim();
  const genus = target.split(/\s+/)[0];
  const commonWords = commonName.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  if (name === target || name === base) return 100;
  if (name.startsWith(base)) return 85;
  if (name.startsWith(genus) && target.split(/\s+/).length === 1) return 70;
  if (commonWords.every((w) => name.includes(w) || (taxon.preferred_common_name || '').toLowerCase().includes(w))) {
    return 55;
  }
  if (name.startsWith(genus)) return 45;
  return 0;
}

async function findINaturalistPhoto(scientificName, commonName, { rankSpecies = true } = {}) {
  const queries = [
    scientificName,
    scientificName.replace(/\s+var\.\s+.*$/i, '').trim(),
    commonName,
    `${commonName} ${scientificName.split(/\s+/)[0]}`,
  ];

  let best = null;

  for (const query of [...new Set(queries)]) {
    const rankParam = rankSpecies ? '&rank=species' : '';
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}${rankParam}&per_page=12`;
    let data;
    try {
      data = await fetchJson(url);
    } catch {
      continue;
    }

    for (const taxon of data.results || []) {
      const photo = taxon.default_photo;
      if (!photo?.url) continue;
      const score = scoreTaxonMatch(taxon, scientificName, commonName);
      if (score < 45) continue;
      const candidate = {
        provider: 'iNaturalist',
        inatPhotoId: photo.id,
        url: inaturalistLargeUrl(photo),
        license: photo.license_code || 'see iNaturalist',
        attribution: photo.attribution || 'iNaturalist community',
        sourcePage: `https://www.inaturalist.org/taxa/${taxon.id}`,
        score,
      };
      if (!allowRestrictedLicenses && !isReusablePhotoLicense(candidate.license)) {
        continue;
      }
      if (!best || candidate.score > best.score) best = candidate;
    }

    if (best?.score >= 85) return best;
    await sleep(400);
  }

  if (best) return best;

  if (rankSpecies) {
    return findINaturalistPhoto(scientificName, commonName, { rankSpecies: false });
  }
  return null;
}

async function findINaturalistObservationPhoto(scientificName, commonName) {
  const queries = [
    scientificName,
    scientificName.replace(/\s+var\.\s+.*$/i, '').trim(),
  ];
  let best = null;

  for (const query of [...new Set(queries)]) {
    const url = new URL('https://api.inaturalist.org/v1/observations');
    url.searchParams.set('taxon_name', query);
    url.searchParams.set('photos', 'true');
    url.searchParams.set('photo_license', 'CC0,CC-BY,CC-BY-SA');
    url.searchParams.set('quality_grade', 'research');
    url.searchParams.set('per_page', '20');

    let data;
    try {
      data = await fetchJson(url.toString());
    } catch {
      continue;
    }

    for (const observation of data.results || []) {
      const score = scoreTaxonMatch(observation.taxon || {}, scientificName, commonName);
      if (score < 45) continue;

      for (const photo of observation.photos || []) {
        const candidate = {
          provider: 'iNaturalist',
          inatPhotoId: photo.id,
          url: inaturalistLargeUrl(photo),
          license: photo.license_code || 'see iNaturalist',
          attribution: photo.attribution || 'iNaturalist community',
          sourcePage: `https://www.inaturalist.org/observations/${observation.id}`,
          score: Math.min(score + 5, 100),
        };
        if (!allowRestrictedLicenses && !isReusablePhotoLicense(candidate.license)) {
          continue;
        }
        if (!best || candidate.score > best.score) best = candidate;
      }
    }

    if (best?.score >= 85) return best;
    await sleep(500);
  }

  return best;
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

async function findCommonsPhoto(scientificName, commonName) {
  const genus = scientificName.split(/\s+/)[0].toLowerCase();
  const speciesWords = scientificName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);
  const commonWords = commonName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3 && !['plant', 'string'].includes(w));
  const searches = [
    `"${scientificName}"`,
    `"${scientificName.replace(/\s+var\.\s+.*$/i, '').trim()}"`,
    `${commonName} plant`,
    `${scientificName} plant`,
  ];
  let best = null;

  for (const gsrsearch of [...new Set(searches)]) {
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    url.searchParams.set('generator', 'search');
    url.searchParams.set('gsrsearch', gsrsearch);
    url.searchParams.set('gsrnamespace', '6');
    url.searchParams.set('gsrlimit', '8');
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|thumburl|size|mime|extmetadata');
    url.searchParams.set('iiurlwidth', '960');

    let data;
    try {
      data = await fetchJson(url.toString());
    } catch {
      continue;
    }
    const pages = data.query?.pages;
    if (!pages) continue;

    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info?.url || !info.mime?.startsWith('image/')) continue;
      if ((info.size || 0) < 8_000) continue;
      const title = (page.title || '').toLowerCase();
      if (title.includes('icon') || title.includes('logo') || title.includes('diagram')) continue;

      let score = 15;
      const hasScientificTitleMatch =
        title.includes(genus) || speciesWords.some((w) => title.includes(w));
      const commonTitleMatches = commonWords.filter((w) => title.includes(w)).length;
      if (!hasScientificTitleMatch && commonTitleMatches < 2) continue;
      if (hasScientificTitleMatch) score += 25;
      if (commonTitleMatches >= 2) {
        score += 15;
      }

      const candidate = {
        provider: 'Wikimedia Commons',
        url: info.url || info.thumburl,
        sourcePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        score,
        ...licenseFromMeta(info.extmetadata),
      };
      if (!allowRestrictedLicenses && !isReusablePhotoLicense(candidate.license)) {
        continue;
      }
      if (!best || candidate.score > best.score) best = candidate;
    }
    if (best?.score >= 35) return best;
    await sleep(1200);
  }

  return best;
}

async function findWikipediaPhoto(title) {
  const encoded = encodeURIComponent(title.replace(/ /g, '_'));
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encoded}&prop=pageimages&piprop=original`;
  const data = await fetchJson(url);
  const pages = data.query?.pages;
  if (!pages) return null;
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue;
    const src = page.original?.source;
    if (!src?.startsWith('http')) continue;
    return {
      provider: 'Wikipedia',
      url: src,
      license: 'See Wikipedia file page',
      attribution: 'Wikipedia',
      sourcePage: `https://en.wikipedia.org/wiki/${encoded}`,
      score: 35,
    };
  }
  return null;
}

async function findPhoto(commonName, scientificName) {
  await sleep(INAT_DELAY_MS);
  const inat = await findINaturalistPhoto(scientificName, commonName);
  if (inat) {
    const ok = await validatePhotoHit(inat);
    if (ok) return ok;
  }

  await sleep(INAT_DELAY_MS);
  const inatObservation = await findINaturalistObservationPhoto(scientificName, commonName);
  if (inatObservation) {
    const ok = await validatePhotoHit(inatObservation);
    if (ok) return ok;
  }

  await sleep(COMMONS_DELAY_MS);
  try {
    const commons = await findCommonsPhoto(scientificName, commonName);
    if (commons) {
      const ok = await validatePhotoHit(commons);
      if (ok) return ok;
    }
  } catch (e) {
    console.warn('  Commons:', e.message);
  }

  if (!allowRestrictedLicenses) {
    return null;
  }

  const wikiTitles = [
    scientificName,
    scientificName.replace(/\s+var\.\s+.*$/i, '').trim(),
    commonName,
  ];
  for (const title of [...new Set(wikiTitles)]) {
    await sleep(800);
    const wiki = await findWikipediaPhoto(title);
    if (wiki && (allowRestrictedLicenses || isReusablePhotoLicense(wiki.license))) {
      const ok = await validatePhotoHit(wiki);
      if (ok) return ok;
    }
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
    if (onlyMissing || replaceRestrictedLicenses) {
      const file = join(photosDir, `${key}.jpg`);
      const hasReusableManifest =
        manifest[key]?.url && isReusablePhotoLicense(manifest[key]?.license);
      const hasUsableFile =
        existsSync(file) && readFileSync(file).length >= LOCAL_PHOTO_MIN_BYTES;
      const shouldSkip =
        onlyMissing &&
        manifest[key]?.url &&
        hasUsableFile;
      const shouldReplaceRestricted =
        replaceRestrictedLicenses && manifest[key]?.url && !hasReusableManifest;

      if (!shouldReplaceRestricted && shouldSkip) {
        skipped++;
        continue;
      }
      if (replaceRestrictedLicenses && hasReusableManifest && hasUsableFile) {
        skipped++;
        continue;
      }
      delete manifest[key];
    }

    process.stdout.write(`[${i + 1}/${catalog.length}] ${species.commonName} ... `);
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
