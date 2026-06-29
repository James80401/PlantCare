import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackEvent, trackOnce } from './analytics';

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const w = window as GtagWindow;

describe('analytics', () => {
  beforeEach(() => {
    window.localStorage.clear();
    w.gtag = vi.fn();
  });

  afterEach(() => {
    delete w.gtag;
    vi.restoreAllMocks();
  });

  it('forwards events to gtag with their properties', () => {
    trackEvent('marketing_cta_click', { route: '/', target: '/register', label: 'Start', siteMode: 'private' });
    expect(w.gtag).toHaveBeenCalledWith('event', 'marketing_cta_click', {
      route: '/',
      target: '/register',
      label: 'Start',
      siteMode: 'private',
    });
  });

  it('fires a trackOnce activation event only once per storage key', () => {
    trackOnce('first_plant_added', 'first_plant_added', { speciesId: 'pothos' });
    trackOnce('first_plant_added', 'first_plant_added', { speciesId: 'monstera' });

    const calls = (w.gtag as ReturnType<typeof vi.fn>).mock.calls.filter((c) => c[1] === 'first_plant_added');
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual({ speciesId: 'pothos' });
    expect(window.localStorage.getItem('dr-plant:analytics:first_plant_added')).toBeTruthy();
  });

  it('still emits when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    trackOnce('first_task_completed', 'first_task_completed', { source: 'test' });
    expect(w.gtag).toHaveBeenCalledWith('event', 'first_task_completed', { source: 'test' });
  });
});
