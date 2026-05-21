#!/usr/bin/env node
/**
 * Verify relative markdown links under docs/ resolve to existing files.
 * Does not validate external URLs or content accuracy.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const docsRoot = path.join(repoRoot, 'docs');

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;
const SKIP_PREFIXES = ['http://', 'https://', 'mailto:', '#'];

function collectMdFiles(dir) {
  const acc = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) acc.push(...collectMdFiles(full));
    else if (name.name.endsWith('.md')) acc.push(full);
  }
  return acc;
}

function resolveLink(fromFile, target) {
  const withoutHash = target.split('#')[0];
  if (!withoutHash) return { ok: true };
  const resolved = path.normalize(path.join(path.dirname(fromFile), withoutHash));
  return { ok: fs.existsSync(resolved), resolved };
}

const files = collectMdFiles(docsRoot);
const errors = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    const raw = m[1].trim();
    if (SKIP_PREFIXES.some((p) => raw.startsWith(p))) continue;
    if (raw.startsWith('/')) continue;
    const { ok, resolved } = resolveLink(file, raw);
    if (!ok) {
      errors.push({
        from: path.relative(repoRoot, file),
        link: raw,
        resolved: path.relative(repoRoot, resolved),
      });
    }
  }
}

if (errors.length) {
  console.error(`Broken docs links (${errors.length}):\n`);
  for (const e of errors) {
    console.error(`  ${e.from}`);
    console.error(`    (${e.link}) → missing ${e.resolved}\n`);
  }
  process.exit(1);
}

console.log(`OK: ${files.length} markdown files under docs/, links verified.`);
