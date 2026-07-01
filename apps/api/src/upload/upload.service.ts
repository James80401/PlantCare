import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { createHash, randomUUID } from 'crypto';
import sharp from 'sharp';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private publicBaseUrl: string;
  private thumbnailDir: string;
  private thumbnailJobs = new Map<string, Promise<string>>();

  constructor(private config: ConfigService) {
    const configured = this.config.get<string>('UPLOAD_DIR', './apps/api/uploads');
    this.uploadDir = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
    this.publicBaseUrl =
      this.config.get<string>('S3_PUBLIC_URL') ||
      `http://localhost:${this.config.get('PORT', 3001)}/uploads`;
    this.thumbnailDir = path.join(this.uploadDir, '.thumbnails');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    return this.config.get<string>('S3_PUBLIC_URL')
      ? `${this.publicBaseUrl.replace(/\/$/, '')}/${filename}`
      : `/uploads/${filename}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    const filename = url.split('/').pop();
    if (!filename) return;
    const filepath = this.resolveWithinRoot(this.uploadDir, filename);
    if (!filepath) return;
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  /**
   * Joins `relativePath` onto `root` and verifies the resolved path is actually inside
   * `root`, rejecting anything (e.g. a trailing `..` segment) that would otherwise
   * escape it. Returns null instead of throwing so callers can treat it as "not found".
   */
  private resolveWithinRoot(root: string, relativePath: string): string | null {
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(resolvedRoot, relativePath);
    if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
      return null;
    }
    return resolved;
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
    const thumbnailPath = path.join(this.thumbnailDir, `${cacheKey}.webp`);
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

  private resolveLocalAssetPath(sourceUrl: string): string | null {
    let pathname = sourceUrl;
    if (/^https?:\/\//i.test(sourceUrl)) {
      try {
        pathname = new URL(sourceUrl).pathname;
      } catch {
        return null;
      }
    }

    if (pathname.startsWith('/uploads/')) {
      const filename = path.basename(pathname);
      return this.resolveWithinRoot(this.uploadDir, filename);
    }

    const carePrefix = '/care-guides/photos/';
    if (!pathname.startsWith(carePrefix)) return null;
    const relativePath = pathname.slice(carePrefix.length);
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
