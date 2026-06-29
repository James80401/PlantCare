#!/usr/bin/env node
// CI guardrail: assert that the built `dist/` is a valid PRIVATE-mode build —
// empty sitemap, robots disallows everything, HTML is noindex, and no llms.txt
// leaks. "Launch mode enabled too early" is a top risk, so this fails the build
// rather than catching it after public exposure.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const read = (name) => readFileSync(resolve(distDir, name), 'utf8').replace(/\r\n/g, '\n');

const failures = [];
const check = (label, ok) => {
  if (!ok) failures.push(label);
};

try {
  const robots = read('robots.txt');
  const sitemap = read('sitemap.xml');
  const html = read('index.html');

  check('robots.txt: User-agent: * must Disallow: /', /User-agent: \*\nDisallow: \/\n/.test(robots));
  check('sitemap.xml: must contain no <url> entries', !sitemap.includes('<url>'));
  check('sitemap.xml: must contain no <loc> entries', !sitemap.includes('<loc>'));
  check('index.html: initial HTML must be noindex,nofollow', html.includes('noindex,nofollow'));
  check('index.html: initial HTML must not be index,follow', !html.includes('index,follow'));
  check('llms.txt: must not be emitted in private mode', !existsSync(resolve(distDir, 'llms.txt')));
} catch (err) {
  console.error(`✗ Could not read build output in ${distDir}: ${err.message}`);
  console.error('  Run `npm run build -w @plant-care/web` (private/default mode) first.');
  process.exit(1);
}

if (failures.length) {
  console.error('✗ Private SEO build assertion FAILED:');
  failures.forEach((f) => console.error(`  - ${f}`));
  console.error('\nThis build is not safe to deploy while Dr. Plant is private.');
  process.exit(1);
}

console.log('✓ Private SEO build verified: empty sitemap, noindex HTML, robots Disallow: /, no llms.txt.');
