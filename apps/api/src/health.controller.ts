import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { promises as fs, constants as fsConstants } from 'fs';
import { PrismaService } from './prisma/prisma.service';
import { UploadService } from './upload/upload.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  /**
   * Liveness — cheap, no dependencies. Answers "is the process up and serving?".
   * An orchestrator uses this to decide whether to restart the container.
   */
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness — answers "can this instance actually do work right now?".
   * Checks DB connectivity and upload-dir writability. A load balancer / orchestrator
   * uses this to decide whether to route traffic here. Returns 503 if any check fails,
   * so a process with a dead DB connection is pulled out of rotation instead of
   * serving errors.
   */
  @Get('ready')
  async ready() {
    const [database, uploads] = await Promise.all([
      this.checkDatabase(),
      this.checkUploads(),
    ]);

    const checks = { database, uploads };
    const ok = Object.values(checks).every((c) => c.ok);

    const body = {
      status: ok ? 'ready' : 'unavailable',
      timestamp: new Date().toISOString(),
      checks,
    };

    if (!ok) {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }

  private async checkDatabase(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private async checkUploads(): Promise<{ ok: boolean; error?: string }> {
    try {
      await fs.access(this.upload.getUploadDir(), fsConstants.W_OK);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
