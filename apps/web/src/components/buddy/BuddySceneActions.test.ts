import { describe, expect, it } from 'vitest';
import {
  actionRotationForEffect,
  activeItemInteractions,
  buddyInteractionItemIds,
} from './BuddySceneActions';

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

  it('prioritizes equipped item interactions ahead of personality and effect actions', () => {
    const actions = actionRotationForEffect('home', 'comfort', 'TENDER', [
      'held_watering_can',
    ]).map((action) => action.id);

    expect(actions[0]).toBe('water-practice');
    expect(actions).toContain('nap');
    expect(actions.indexOf('water-practice')).toBeLessThan(actions.indexOf('nap'));
  });

  it('uses travel item interactions while journeying', () => {
    const actions = actionRotationForEffect('traveling', 'adventure', 'RESILIENT', [
      'held_lantern',
      'glasses_sun',
    ]).map((action) => action.id);

    expect(actions.slice(0, 2)).toEqual(['travel-lantern-scout', 'travel-shades-lookout']);
  });

  it('finds active interactions from equipped and placed item ids', () => {
    const itemIds = buddyInteractionItemIds(
      { heldItem: 'held_trowel', glasses: 'glasses_round' },
      { slotA: 'furn_fountain' },
    );
    const interactions = activeItemInteractions(itemIds).map((interaction) => interaction.label);

    expect(interactions).toContain('Soil scouting');
    expect(interactions).toContain('Care scholar');
    expect(interactions).toContain('Fountain sip');
  });
});
