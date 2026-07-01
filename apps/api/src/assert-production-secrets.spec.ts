import { assertProductionSecrets } from './assert-production-secrets';

describe('assertProductionSecrets', () => {
  it('does nothing outside production', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => assertProductionSecrets({})).not.toThrow();
  });

  it('throws in production when JWT_SECRET is missing', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_REFRESH_SECRET: 'real-refresh-secret',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('throws in production when JWT_REFRESH_SECRET is missing', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_SECRET: 'real-secret',
      }),
    ).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('throws in production when a secret is set but blank', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_SECRET: '   ',
        JWT_REFRESH_SECRET: 'real-refresh-secret',
      }),
    ).toThrow(/JWT_SECRET/);
  });

  it('passes in production when both secrets are set', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        JWT_SECRET: 'real-secret',
        JWT_REFRESH_SECRET: 'real-refresh-secret',
      }),
    ).not.toThrow();
  });
});
