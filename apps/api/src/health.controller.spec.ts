import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  function make(opts: { dbOk?: boolean; uploadDir?: string } = {}) {
    const prisma = {
      $queryRaw: jest.fn(() =>
        opts.dbOk === false ? Promise.reject(new Error('connection refused')) : Promise.resolve([{ 1: 1 }]),
      ),
    };
    const upload = {
      // A path that exists and is writable in the test runner CWD.
      getUploadDir: jest.fn(() => opts.uploadDir ?? process.cwd()),
    };
    const config = {
      get: jest.fn((key: string, fallback: string) => {
        if (key === 'APP_VERSION') return '1.2.3';
        if (key === 'APP_COMMIT_SHA') return 'abc123';
        return fallback;
      }),
    };
    return {
      controller: new HealthController(prisma as never, upload as never, config as never),
      prisma,
      upload,
    };
  }

  it('liveness returns ok without touching dependencies', () => {
    const { controller, prisma } = make();
    const res = controller.check();
    expect(res.status).toBe('ok');
    expect(res.version).toBe('1.2.3');
    expect(res.commit).toBe('abc123');
    expect(res.features).toEqual({ plantBuddy: false, premiumBilling: false });
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('readiness returns ready when DB and uploads are healthy', async () => {
    const { controller, prisma } = make({ dbOk: true });
    const res = await controller.ready();
    expect(res.status).toBe('ready');
    expect(res.checks.database.ok).toBe(true);
    expect(res.checks.uploads.ok).toBe(true);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('readiness throws 503 when the database is unreachable', async () => {
    const { controller } = make({ dbOk: false });
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('readiness throws 503 when the upload dir is not writable', async () => {
    const { controller } = make({ dbOk: true, uploadDir: '/definitely/not/a/real/writable/path/xyz' });
    await expect(controller.ready()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
