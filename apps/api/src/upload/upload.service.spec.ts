import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('UploadService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns a portable API-relative URL for local uploads', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string | number) => {
        if (key === 'UPLOAD_DIR') return 'test-uploads';
        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new UploadService(config);

    const url = await service.saveFile({
      originalname: 'plant.jpg',
      buffer: Buffer.from('photo'),
    } as Express.Multer.File);

    expect(url).toMatch(/^\/uploads\/.+\.jpg$/);
  });

  it('uses the configured public storage URL without duplicate slashes', async () => {
    const config = {
      get: jest.fn((key: string, fallback?: string | number) => {
        if (key === 'UPLOAD_DIR') return 'test-uploads';
        if (key === 'S3_PUBLIC_URL') return 'https://cdn.example.com/plants/';
        return fallback;
      }),
    } as unknown as ConfigService;
    const service = new UploadService(config);

    const url = await service.saveFile({
      originalname: 'plant.png',
      buffer: Buffer.from('photo'),
    } as Express.Multer.File);

    expect(url).toMatch(/^https:\/\/cdn\.example\.com\/plants\/.+\.png$/);
  });
});
