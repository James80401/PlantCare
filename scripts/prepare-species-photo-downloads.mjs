import { execFileSync } from 'child_process';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { isReusablePhotoLicense } from '../apps/api/scripts/species-photo-urls.mjs';

const repoRoot = process.cwd();
const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
const photosDir = join(repoRoot, 'apps', 'api', 'src', 'care-guides', 'photos', 'species');
const baselineRef = process.argv.find((arg) => arg.startsWith('--baseline='))?.split('=')[1] || 'HEAD';

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadBaselineManifest() {
  try {
    const raw = execFileSync(
      'git',
      [
        '-c',
        'safe.directory=C:/Source/Repos/PlantCare',
        'show',
        `${baselineRef}:prisma/data/species-photo-sources.json`,
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const current = loadJson(manifestPath);
const baseline = loadBaselineManifest();
const keys = new Set([...Object.keys(current), ...Object.keys(baseline)]);
let deletedChanged = 0;
let deletedUnusable = 0;
let kept = 0;

for (const key of keys) {
  const file = join(photosDir, `${key}.jpg`);
  if (!existsSync(file)) continue;

  const currentMeta = current[key];
  const baselineMeta = baseline[key];
  const hasReusableCurrent = currentMeta?.url && isReusablePhotoLicense(currentMeta.license);

  if (!hasReusableCurrent) {
    unlinkSync(file);
    deletedUnusable++;
    continue;
  }

  if (baselineMeta?.url && baselineMeta.url !== currentMeta.url) {
    unlinkSync(file);
    deletedChanged++;
    continue;
  }

  kept++;
}

console.log(`Kept existing photos: ${kept}`);
console.log(`Deleted changed-source photos: ${deletedChanged}`);
console.log(`Deleted unusable-source photos: ${deletedUnusable}`);
