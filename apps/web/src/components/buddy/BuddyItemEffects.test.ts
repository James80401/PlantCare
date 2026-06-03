import { describe, expect, it } from 'vitest';
import { itemEffectFor, summarizeItemEffects } from './BuddyItemEffects';
import type { ShopItem } from '../../hooks/buddy/shopTypes';

function item(overrides: Pick<ShopItem, 'id' | 'category'>): ShopItem {
  return {
    id: overrides.id,
    category: overrides.category,
    name: overrides.id,
    description: '',
    tier: 1,
    cost: 0,
    requiresPremium: false,
    speciesLocked: null,
    unlockType: 'PURCHASE',
    imageKey: overrides.id,
    sortOrder: 1,
  };
}

describe('BuddyItemEffects', () => {
  it('uses item-specific effects before category defaults', () => {
    expect(itemEffectFor(item({ id: 'held_watering_can_gold', category: 'HELD_ITEM' }))).toMatchObject({
      kind: 'sunlight',
      value: 3,
    });
  });

  it('summarizes equipped items into a strongest primary effect', () => {
    const summary = summarizeItemEffects([
      item({ id: 'held_lantern', category: 'HELD_ITEM' }),
      item({ id: 'furn_fountain', category: 'FURNITURE' }),
      item({ id: 'hat_sun', category: 'HAT' }),
    ]);

    expect(summary.totalScore).toBe(7);
    expect(summary.primary).toBe('dewdrops');
    expect(summary.effects.map((effect) => effect.kind)).toContain('adventure');
    expect(summary.sceneHint).toContain('Dewdrop');
  });
});
