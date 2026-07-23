import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearDrPlantOwnedStorage,
  clearLegacyAuthStorage,
  createSingleFlight,
  getAccessToken,
  setAccessToken,
} from './authSession';

describe('authSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setAccessToken(null);
  });

  it('keeps the access token only in memory', () => {
    setAccessToken('access-1');

    expect(getAccessToken()).toBe('access-1');
    expect(window.localStorage.getItem('accessToken')).toBeNull();
  });

  it('removes legacy auth values without touching unrelated origin storage', () => {
    window.localStorage.setItem('accessToken', 'legacy-access');
    window.localStorage.setItem('refreshToken', 'legacy-refresh');
    window.localStorage.setItem('unrelated-product', 'keep');

    clearLegacyAuthStorage();

    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('refreshToken')).toBeNull();
    expect(window.localStorage.getItem('unrelated-product')).toBe('keep');
  });

  it('clears only Dr. Plant-owned storage keys', () => {
    window.localStorage.setItem('dr-plant:analytics:first_task', 'yes');
    window.localStorage.setItem('drplant.buddy.floatingDisplay', 'hidden');
    window.localStorage.setItem('plantcare_device_push_token', 'push');
    window.localStorage.setItem('another-app', 'keep');

    clearDrPlantOwnedStorage();

    expect(window.localStorage.length).toBe(1);
    expect(window.localStorage.getItem('another-app')).toBe('keep');
  });

  it('shares one in-flight operation across concurrent callers', async () => {
    let resolveOperation!: (value: string) => void;
    const operation = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveOperation = resolve;
        }),
    );
    const run = createSingleFlight(operation);

    const first = run();
    const second = run();
    resolveOperation('rotated');

    await expect(Promise.all([first, second])).resolves.toEqual(['rotated', 'rotated']);
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
