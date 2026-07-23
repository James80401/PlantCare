import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
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

  describe('deleteByUrl', () => {
    function makeService() {
      const config = {
        get: jest.fn((key: string, fallback?: string | number) => {
          if (key === 'UPLOAD_DIR') return '/srv/plantcare/uploads';
          return fallback;
        }),
      } as unknown as ConfigService;
      return new UploadService(config);
    }

    it('deletes a file that lives inside the upload dir', async () => {
      const service = makeService();
      const fs = jest.requireMock('fs') as { unlinkSync: jest.Mock };

      await service.deleteByUrl('/uploads/leaf-abc123.jpg');

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        resolve('/srv/plantcare/uploads', 'leaf-abc123.jpg'),
      );
    });

    it('refuses to delete when the last path segment is a traversal escape', async () => {
      const service = makeService();
      const fs = jest.requireMock('fs') as { unlinkSync: jest.Mock };

      // '/uploads/..' splits to a final segment of '..', which would resolve outside
      // the upload dir if joined naively.
      await service.deleteByUrl('/uploads/..');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });

    it('does nothing for an empty url', async () => {
      const service = makeService();
      const fs = jest.requireMock('fs') as { unlinkSync: jest.Mock };

      await service.deleteByUrl('');

      expect(fs.unlinkSync).not.toHaveBeenCalled();
    });
  });
});
