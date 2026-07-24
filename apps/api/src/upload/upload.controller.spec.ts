import type { Response } from 'express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
  it('serves generated thumbnails from the managed dot-directory', async () => {
    const thumbnailPath = '/tmp/uploads/.thumbnails/plant.webp';
    const upload = {
      getThumbnailPath: jest.fn().mockResolvedValue(thumbnailPath),
    } as unknown as UploadService;
    const response = {
      set: jest.fn(),
      sendFile: jest.fn().mockReturnValue(undefined),
    } as unknown as Response;

    const controller = new UploadController(upload);
    await controller.thumbnail('/uploads/plant.jpg', '160', response);

    expect(response.set).toHaveBeenCalledWith({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/webp',
    });
    expect(response.sendFile).toHaveBeenCalledWith(thumbnailPath, {
      dotfiles: 'allow',
    });
  });
});
