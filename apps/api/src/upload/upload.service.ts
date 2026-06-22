import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private publicBaseUrl: string;

  constructor(private config: ConfigService) {
    const configured = this.config.get<string>('UPLOAD_DIR', './apps/api/uploads');
    this.uploadDir = path.isAbsolute(configured)
      ? configured
      : path.resolve(process.cwd(), configured);
    this.publicBaseUrl =
      this.config.get<string>('S3_PUBLIC_URL') ||
      `http://localhost:${this.config.get('PORT', 3001)}/uploads`;
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
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
    const filepath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }

  getUploadDir(): string {
    return path.resolve(this.uploadDir);
  }
}
