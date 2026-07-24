import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UploadService } from './upload.service';

const ALLOWED_THUMBNAIL_SIZES = new Set([96, 160, 320, 640]);

@Controller('media')
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  @Get('thumbnail')
  async thumbnail(
    @Query('src') sourceUrl: string | undefined,
    @Query('size') requestedSize: string | undefined,
    @Res() response: Response,
  ) {
    if (!sourceUrl) throw new BadRequestException('Missing thumbnail source.');
    const size = Number(requestedSize ?? 160);
    if (!ALLOWED_THUMBNAIL_SIZES.has(size)) {
      throw new BadRequestException('Unsupported thumbnail size.');
    }

    const thumbnailPath = await this.upload.getThumbnailPath(sourceUrl, size);
    if (!thumbnailPath) throw new NotFoundException('Thumbnail source not found.');

    response.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': 'image/webp',
    });
    return response.sendFile(thumbnailPath, { dotfiles: 'allow' });
  }
}
