import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let tempDir: string;
  let service: UploadService;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(process.cwd(), '.test-uploads-'));
    const config = {
      get: jest.fn((key: string, fallback?: string | number) =>
        key === 'UPLOAD_DIR' ? tempDir : fallback,
      ),
    } as unknown as ConfigService;
    service = new UploadService(config);
  });

  afterEach(async () => {
    sharp.cache(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });

  it('normalizes a real image to WebP and strips embedded metadata', async () => {
    const input = await sharp({
      create: {
        width: 320,
        height: 240,
        channels: 3,
        background: '#15803d',
      },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: 'private-location-owner' } } })
      .toBuffer();

    const url = await service.saveFile({
      originalname: '../../unsafe-name.jpg',
      mimetype: 'image/jpeg',
      buffer: input,
    } as Express.Multer.File);

    expect(url).toMatch(/^\/uploads\/[0-9a-f-]+\.webp$/);
    const saved = path.join(tempDir, path.basename(url));
    await expect(sharp(saved).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 320,
      height: 240,
    });
    expect((await sharp(saved).metadata()).exif).toBeUndefined();
  });

  it('rejects a declared image whose bytes are not an image', async () => {
    await expect(
      service.saveFile({
        originalname: 'not-a-photo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('<script>alert(1)</script>'),
      } as Express.Multer.File),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.readdirSync(tempDir).filter((name) => name !== '.thumbnails')).toEqual([]);
  });

  it('deletes a managed file and its generated thumbnails', async () => {
    const sourcePath = path.join(tempDir, 'leaf-abc123.jpg');
    await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: '#166534',
      },
    })
      .jpeg()
      .toFile(sourcePath);
    const thumbnail = await service.getThumbnailPath('/uploads/leaf-abc123.jpg', 160);

    await service.deleteByUrl('/uploads/leaf-abc123.jpg');

    expect(fs.existsSync(sourcePath)).toBe(false);
    expect(thumbnail && fs.existsSync(thumbnail)).toBe(false);
  });

  it('does not delete external, nested, traversal, or empty URLs', async () => {
    const keep = path.join(tempDir, 'keep.jpg');
    fs.writeFileSync(keep, 'keep');

    await service.deleteByUrl('https://example.com/images/keep.jpg');
    await service.deleteByUrl('/uploads/nested/keep.jpg');
    await service.deleteByUrl('/uploads/..');
    await service.deleteByUrl('');

    expect(fs.readFileSync(keep, 'utf8')).toBe('keep');
  });
});
