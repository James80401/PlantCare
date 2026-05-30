import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: MAX_IMAGE_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype || !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase())) {
      cb(new BadRequestException(`Unsupported image type: ${file.mimetype}`), false);
      return;
    }
    cb(null, true);
  },
};
