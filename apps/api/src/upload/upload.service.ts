import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import sharp from 'sharp';

const ALLOWED_DECODED_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'heif']);
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 40_000_000;
export const NORMALIZED_IMAGE_DIMENSION = 4096;

@Injectable()
export class UploadService {
  private uploadDir: string;
  private thumbnailDir: string;
  private thumbnailJobs = new Map<string, Promise<string>>();

  constructor(private config: ConfigService) {
    const configured = this.config.get<string>('UPLOAD_DIR', './apps/api/uploads');
    this.uploadDir = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
    this.thumbnailDir = path.join(this.uploadDir, '.thumbnails');
    fs.mkdirSync(this.uploadDir, { recursive: true });
    fs.mkdirSync(this.thumbnailDir, { recursive: true });
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    let normalized: Buffer;
    try {
      const decoder = sharp(file.buffer, {
        animated: false,
        failOn: 'error',
        limitInputPixels: MAX_IMAGE_PIXELS,
      });
      const metadata = await decoder.metadata();
      if (
        !metadata.format ||
        !ALLOWED_DECODED_FORMATS.has(metadata.format) ||
        !metadata.width ||
        !metadata.height
      ) {
        throw new Error('Unsupported or unreadable image signature');
      }
      if (
        metadata.width > MAX_IMAGE_DIMENSION ||
        metadata.height > MAX_IMAGE_DIMENSION ||
        metadata.width * metadata.height > MAX_IMAGE_PIXELS
      ) {
        throw new Error('Image dimensions exceed the upload limit');
      }

      normalized = await decoder
        .rotate()
        .resize({
          width: NORMALIZED_IMAGE_DIMENSION,
          height: NORMALIZED_IMAGE_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'The uploaded file is not a supported image or its dimensions are too large.',
      );
    }

    const filename = `${randomUUID()}.webp`;
    const filepath = this.resolveWithinRoot(this.uploadDir, filename);
    if (!filepath) throw new BadRequestException('Could not create a safe upload path.');
    await fs.promises.writeFile(filepath, normalized, { flag: 'wx' });
    return `/uploads/${filename}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    const filename = this.managedUploadFilename(url);
    if (!filename) return;
    const filepath = this.resolveWithinRoot(this.uploadDir, filename);
    if (!filepath) return;
    await fs.promises.unlink(filepath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });

    const thumbnails = await fs.promises.readdir(this.thumbnailDir).catch(() => []);
    await Promise.all(
      thumbnails
        .filter((candidate) => candidate.startsWith(`${filename}-`))
        .map(async (candidate) => {
          const thumbnailPath = this.resolveWithinRoot(this.thumbnailDir, candidate);
          if (!thumbnailPath) return;
          await fs.promises.unlink(thumbnailPath).catch((error: NodeJS.ErrnoException) => {
            if (error.code !== 'ENOENT') throw error;
          });
        }),
    );
  }

  getUploadDir(): string {
    return path.resolve(this.uploadDir);
  }

  async getThumbnailPath(sourceUrl: string, size: number): Promise<string | null> {
    const sourcePath = this.resolveLocalAssetPath(sourceUrl);
    if (!sourcePath || !fs.existsSync(sourcePath)) return null;

    const stats = fs.statSync(sourcePath);
    const cacheKey = createHash('sha256')
      .update(`${sourcePath}:${stats.mtimeMs}:${stats.size}:${size}`)
      .digest('hex');
    const sourceName = path.basename(sourcePath);
    const thumbnailPath = path.join(
      this.thumbnailDir,
      `${sourceName}-${cacheKey}.webp`,
    );
    if (fs.existsSync(thumbnailPath)) return thumbnailPath;

    const existingJob = this.thumbnailJobs.get(thumbnailPath);
    if (existingJob) return existingJob;

    const job = sharp(sourcePath)
      .rotate()
      .resize(size, size, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 72, effort: 4 })
      .toFile(thumbnailPath)
      .then(() => thumbnailPath)
      .finally(() => this.thumbnailJobs.delete(thumbnailPath));
    this.thumbnailJobs.set(thumbnailPath, job);
    return job;
  }

  private managedUploadFilename(sourceUrl: string): string | null {
    if (!sourceUrl) return null;
    let pathname: string;
    try {
      pathname = new URL(sourceUrl, 'https://local.invalid').pathname;
      pathname = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const prefix = '/uploads/';
    if (!pathname.startsWith(prefix)) return null;
    const filename = pathname.slice(prefix.length);
    if (
      !filename ||
      filename === '.' ||
      filename === '..' ||
      filename.includes('/') ||
      filename.includes('\\') ||
      !/^[A-Za-z0-9._-]+$/.test(filename)
    ) {
      return null;
    }
    return filename;
  }

  /**
   * Joins `relativePath` onto `root` and verifies the resolved path is inside
   * `root`. Returns null so callers can safely treat rejected paths as missing.
   */
  private resolveWithinRoot(root: string, relativePath: string): string | null {
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(resolvedRoot, relativePath);
    if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
      return null;
    }
    return resolved;
  }

  private resolveLocalAssetPath(sourceUrl: string): string | null {
    const managedFilename = this.managedUploadFilename(sourceUrl);
    if (managedFilename) {
      return this.resolveWithinRoot(this.uploadDir, managedFilename);
    }

    let pathname = sourceUrl;
    if (/^https?:\/\//i.test(sourceUrl)) {
      try {
        pathname = new URL(sourceUrl).pathname;
      } catch {
        return null;
      }
    }

    const carePrefix = '/care-guides/photos/';
    if (!pathname.startsWith(carePrefix)) return null;
    let relativePath: string;
    try {
      relativePath = decodeURIComponent(pathname.slice(carePrefix.length));
    } catch {
      return null;
    }
    if (!relativePath) return null;

    const candidateRoots = [
      path.join(process.cwd(), 'apps', 'api', 'dist', 'care-guides', 'photos'),
      path.join(process.cwd(), 'apps', 'api', 'src', 'care-guides', 'photos'),
      path.join(process.cwd(), 'dist', 'care-guides', 'photos'),
      path.join(process.cwd(), 'src', 'care-guides', 'photos'),
    ];
    for (const root of candidateRoots) {
      const candidate = this.resolveWithinRoot(root, relativePath);
      if (candidate && fs.existsSync(candidate)) return candidate;
    }
    return null;
  }
}
