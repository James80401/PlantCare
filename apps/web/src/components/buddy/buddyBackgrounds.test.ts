import { describe, expect, it } from 'vitest';
import {
  BUDDY_BACKGROUNDS,
  buddyBackgroundAccent,
  buddyBackgroundClass,
} from './buddyBackgrounds';

describe('buddy backgrounds', () => {
  it('has a distinct gradient for each real background key', () => {
    const keys = ['sunny_windowsill', 'greenhouse', 'rainy_window', 'forest'];
    const gradients = keys.map((k) => BUDDY_BACKGROUNDS[k]);
    // every key resolves and they are all different from one another
    expect(gradients.every(Boolean)).toBe(true);
    expect(new Set(gradients).size).toBe(keys.length);
  });

  it('accepts both the key and the bg_-prefixed shop id', () => {
    expect(buddyBackgroundClass('rainy_window')).toBe(buddyBackgroundClass('bg_rainy_window'));
    expect(buddyBackgroundClass('forest')).toBe(BUDDY_BACKGROUNDS.forest);
  });

  it('does not collapse rainy/forest into the default gradient', () => {
    const def = buddyBackgroundClass('sunny_windowsill');
    expect(buddyBackgroundClass('bg_rainy_window')).not.toBe(def);
    expect(buddyBackgroundClass('bg_forest')).not.toBe(def);
  });

  it('falls back to sunny for unknown ids', () => {
    expect(buddyBackgroundClass('bg_unknown')).toBe(BUDDY_BACKGROUNDS.sunny_windowsill);
  });

  it('maps each background to a distinct decorative accent', () => {
    expect(buddyBackgroundAccent('bg_rainy_window')).toBe('rain');
    expect(buddyBackgroundAccent('forest')).toBe('trees');
    expect(buddyBackgroundAccent('greenhouse')).toBe('leaves');
    expect(buddyBackgroundAccent('sunny_windowsill')).toBe('sun');
  });
});
