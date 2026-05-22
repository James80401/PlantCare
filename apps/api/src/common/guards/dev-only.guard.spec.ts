import { ForbiddenException } from '@nestjs/common';
import { DevOnlyGuard } from './dev-only.guard';

describe('DevOnlyGuard', () => {
  const guard = new DevOnlyGuard();
  const env = process.env;

  afterEach(() => {
    process.env = { ...env };
  });

  it('allows when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_DEV_ROUTES;
    expect(guard.canActivate()).toBe(true);
  });

  it('blocks production without ENABLE_DEV_ROUTES', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ENABLE_DEV_ROUTES;
    expect(() => guard.canActivate()).toThrow(ForbiddenException);
  });

  it('allows production when ENABLE_DEV_ROUTES is true', () => {
    process.env.NODE_ENV = 'production';
    process.env.ENABLE_DEV_ROUTES = 'true';
    expect(guard.canActivate()).toBe(true);
  });
});
