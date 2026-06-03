import { describe, expect, it } from 'vitest';
import { potHomeInfo } from './BuddyItemVisuals';

describe('potHomeInfo', () => {
  it('returns named Buddy home metadata for equipped homes', () => {
    expect(potHomeInfo('pot_mason')).toMatchObject({
      label: 'Glass Jar Loft',
      subtitle: 'Sparkly little lookout',
    });
  });

  it('falls back to the starter home for missing ids', () => {
    expect(potHomeInfo(null)).toMatchObject({
      id: 'pot_terra_cotta',
      label: 'Clay Cottage',
    });
  });
});
