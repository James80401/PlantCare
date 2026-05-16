import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'care-guides');

function copyDir(src, dest, label) {
  if (!existsSync(src)) {
    console.warn(`Missing ${label}:`, src);
    return;
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`Copied ${label} →`, dest);
}

copyDir(join(root, 'src', 'care-guides', 'images'), join(dist, 'images'), 'SVG images');
copyDir(join(root, 'src', 'care-guides', 'photos'), join(dist, 'photos'), 'photos');
