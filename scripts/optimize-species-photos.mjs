import { readdirSync, renameSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const repoRoot = process.cwd();
const photosDir = join(repoRoot, 'apps', 'api', 'src', 'care-guides', 'photos', 'species');
const maxDimension = 1600;
const quality = 82;

let optimized = 0;
let skipped = 0;
let beforeBytes = 0;
let afterBytes = 0;

for (const filename of readdirSync(photosDir)) {
  if (!filename.endsWith('.jpg')) continue;

  const filePath = join(photosDir, filename);
  const before = statSync(filePath).size;
  beforeBytes += before;

  const image = sharp(filePath, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const needsResize = Math.max(metadata.width || 0, metadata.height || 0) > maxDimension;
  const buffer = await image
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  if (!needsResize && buffer.length >= before) {
    skipped++;
    afterBytes += before;
    continue;
  }

  const tempPath = `${filePath}.tmp`;
  writeFileSync(tempPath, buffer);
  renameSync(tempPath, filePath);
  optimized++;
  afterBytes += buffer.length;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

console.log(`Optimized: ${optimized}`);
console.log(`Skipped: ${skipped}`);
console.log(`Before: ${mb(beforeBytes)}`);
console.log(`After: ${mb(afterBytes)}`);
console.log(`Saved: ${mb(beforeBytes - afterBytes)}`);
