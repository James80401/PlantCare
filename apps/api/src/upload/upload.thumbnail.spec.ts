import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { UploadService } from './upload.service';

describe('UploadService thumbnails', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), '.test-thumbnails-'));
  });

  afterEach(async () => {
    sharp.cache(false);
    await new Promise((resolve) => setTimeout(resolve, 100));
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('creates and reuses a small WebP thumbnail for an existing upload', async () => {
    const sourcePath = path.join(tempDir, 'plant.jpg');
    await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 3,
        background: '#15803d',
      },
    })
      .jpeg({ quality: 95 })
      .toFile(sourcePath);

    const config = {
      get: jest.fn((key: string, fallback?: string | number) =>
        key === 'UPLOAD_DIR' ? tempDir : fallback,
      ),
    } as unknown as ConfigService;
    const service = new UploadService(config);

    const first = await service.getThumbnailPath('/uploads/plant.jpg', 160);
    const second = await service.getThumbnailPath('/uploads/plant.jpg', 160);

    expect(first).toBe(second);
    expect(first).toBeTruthy();
    expect(fs.statSync(first!).size).toBeLessThan(fs.statSync(sourcePath).size);
    await expect(sharp(first!).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 160,
      height: 160,
    });
  });

  it('rejects sources outside supported local asset paths', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string | number) =>
        key === 'UPLOAD_DIR' ? tempDir : fallback,
      ),
    } as unknown as ConfigService;
    const service = new UploadService(config);

    await expect(service.getThumbnailPath('/etc/passwd', 160)).resolves.toBeNull();
    await expect(
      service.getThumbnailPath('/care-guides/photos/../../secret.jpg', 160),
    ).resolves.toBeNull();
  });
});
