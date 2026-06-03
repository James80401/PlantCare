import { describe, expect, it } from 'vitest';
import { personalityForTrait } from './BuddyPersonality';

describe('personalityForTrait', () => {
  it('returns a trait-specific profile', () => {
    const profile = personalityForTrait('WILD');

    expect(profile.label).toBe('Wild');
    expect(profile.preferredHomeActions[0]).toBe('object-play');
    expect(profile.preferredTravelActions[0]).toBe('travel-find');
  });

  it('falls back to resilient when no trait is available', () => {
    expect(personalityForTrait(null)).toMatchObject({
      trait: 'RESILIENT',
      label: 'Resilient',
    });
  });
});
