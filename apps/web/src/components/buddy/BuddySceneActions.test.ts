import { describe, expect, it } from 'vitest';
import { actionRotationForEffect } from './BuddySceneActions';

describe('actionRotationForEffect', () => {
  it('prioritizes personality home actions before item effect actions', () => {
    const actions = actionRotationForEffect('home', 'sunlight', 'WILD').map((action) => action.id);

    expect(actions.slice(0, 4)).toEqual(['object-play', 'wander', 'treasure', 'celebrate']);
    expect(actions.indexOf('weather-watch')).toBeGreaterThan(actions.indexOf('celebrate'));
  });

  it('uses travel personality preferences when Buddy is journeying', () => {
    const actions = actionRotationForEffect('traveling', 'comfort', 'TENDER').map(
      (action) => action.id,
    );

    expect(actions.slice(0, 3)).toEqual(['travel-rest', 'travel-scout', 'travel-find']);
  });
});
