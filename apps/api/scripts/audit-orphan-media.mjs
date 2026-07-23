import { PrismaClient } from '@prisma/client';
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function managedFileName(value) {
  if (!value || typeof value !== 'string') return null;
  let pathname = value.trim();
  try {
    pathname = new URL(pathname, 'http://local.invalid').pathname;
  } catch {
    return null;
  }
  if (!pathname.startsWith('/uploads/')) return null;
  const relative = pathname.slice('/uploads/'.length);
  if (!relative || relative.includes('/') || relative.includes('\\')) return null;
  const decoded = decodeURIComponent(relative);
  return decoded === path.basename(decoded) ? decoded : null;
}

function collectReferences(rows) {
  const references = new Set();
  for (const values of rows) {
    for (const value of values) {
      const fileName = managedFileName(value);
      if (fileName) references.add(fileName);
    }
  }
  return references;
}

async function readFiles(directory) {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function readReferences(name, query) {
  try {
    return { name, values: await query(), error: null };
  } catch (error) {
    return {
      name,
      values: [],
      error: {
        code: typeof error?.code === 'string' ? error.code : 'QUERY_FAILED',
        message: error instanceof Error ? error.message.split('\n').at(-1) : String(error),
      },
    };
  }
}

async function main() {
  const deleteMode = process.argv.includes('--delete');
  const unexpected = process.argv.slice(2).filter((argument) => argument !== '--delete');
  if (unexpected.length) {
    throw new Error(`Unknown argument(s): ${unexpected.join(', ')}`);
  }

  const uploadDir = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'apps', 'api', 'uploads'),
  );
  const thumbnailDir = path.join(uploadDir, '.thumbnails');
  const prisma = new PrismaClient();

  try {
    const queryResults = await Promise.all([
      readReferences('plants', () =>
        prisma.plant.findMany({ select: { imageUrl: true } }).then((rows) =>
          rows.map((row) => row.imageUrl),
        ),
      ),
      readReferences('journalEntries', () =>
        prisma.journalEntry.findMany({ select: { photoUrl: true } }).then((rows) =>
          rows.map((row) => row.photoUrl),
        ),
      ),
      readReferences('plantProgressEntries', () =>
        prisma.plantProgressEntry.findMany({ select: { photoUrl: true } }).then((rows) =>
          rows.map((row) => row.photoUrl),
        ),
      ),
      readReferences('diagnoses', () =>
        prisma.diagnosis.findMany({ select: { imageUrl: true } }).then((rows) =>
          rows.map((row) => row.imageUrl),
        ),
      ),
      readReferences('diagnosisMessages', () =>
        prisma.diagnosisMessage.findMany({ select: { imageUrl: true } }).then((rows) =>
          rows.map((row) => row.imageUrl),
        ),
      ),
      readReferences('communityPosts', () =>
        prisma.communityPost.findMany({ select: { imageUrl: true } }).then((rows) =>
          rows.map((row) => row.imageUrl),
        ),
      ),
    ]);

    const queryFailures = queryResults
      .filter((result) => result.error)
      .map(({ name, error }) => ({ name, ...error }));
    const references = collectReferences(queryResults.map((result) => result.values));
    const storedFiles = await readFiles(uploadDir);
    const thumbnails = await readFiles(thumbnailDir);
    const storedSet = new Set(storedFiles);
    const orphanFiles = storedFiles.filter((fileName) => !references.has(fileName));
    const missingFiles = [...references].filter((fileName) => !storedSet.has(fileName)).sort();
    const orphanThumbnails = thumbnails.filter((fileName) => {
      const source = storedFiles.find((stored) => fileName.startsWith(`${stored}-`));
      return !source || orphanFiles.includes(source);
    });

    const report = {
      mode: deleteMode ? 'delete' : 'dry-run',
      uploadDir,
      referencedFiles: references.size,
      storedFiles: storedFiles.length,
      orphanFiles,
      missingFiles,
      orphanThumbnails,
      queryFailures,
      deletionBlocked: deleteMode && queryFailures.length > 0,
      deletedFiles: 0,
    };

    if (deleteMode && queryFailures.length === 0) {
      for (const fileName of orphanFiles) {
        await rm(path.join(uploadDir, fileName), { force: true });
      }
      for (const fileName of orphanThumbnails) {
        await rm(path.join(thumbnailDir, fileName), { force: true });
      }
      report.deletedFiles = orphanFiles.length + orphanThumbnails.length;
    }

    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (missingFiles.length || queryFailures.length) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

export { collectReferences, managedFileName };
