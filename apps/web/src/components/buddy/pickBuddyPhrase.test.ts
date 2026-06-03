import { describe, expect, it } from 'vitest';
import { buildBuddyPhraseContext, EMPTY_GARDEN_METRICS } from './buddyPhraseContext';
import { pickBuddyPhrase, pushRecentPhraseId } from './pickBuddyPhrase';
import type { BuddyState } from '../../hooks/buddy/types';

const baseBuddy: BuddyState = {
  id: 'b1',
  name: 'Monty',
  speciesId: 'monstera',
  trait: 'RESILIENT',
  growthStage: 'SPROUT',
  journeyCount: 0,
  dewdrops: 10,
  experiencePoints: 0,
  level: 1,
  levelProgress: {
    level: 1,
    experiencePoints: 0,
    currentLevelXp: 0,
    nextLevelXp: 60,
    xpIntoLevel: 0,
    xpForNextLevel: 60,
    progressPercent: 0,
  },
  bloomTokens: 0,
  bloomTokensEnabled: false,
  sunlightToday: 50,
  tasksToday: 1,
  mood: 'HAPPY',
  streakDays: 5,
  longestStreak: 5,
  gardenCode: 'ABC123',
  equippedItems: {},
  unlockedSpecies: ['monstera'],
  unlockedBiomes: [],
  currentBiome: 'meadow',
  terrariumLayout: {},
  terrariumBackground: 'default',
  floatingCompanionMode: 'visible',
  journeyReady: false,
  hasActiveJourney: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('pickBuddyPhrase', () => {
  it('prefers overdue task lines when overdue > 0', () => {
    const ctx = buildBuddyPhraseContext(
      baseBuddy,
      null,
      false,
      { ...EMPTY_GARDEN_METRICS, totalPlants: 2, overdue: 3 },
    );
    const results = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const picked = pickBuddyPhrase({ context: ctx, recentIds: [], tick: i });
      results.add(picked.id);
    }
    expect(results.has('task-over-1') || results.has('task-over-2')).toBe(true);
  });

  it('avoids recent phrase ids when possible', () => {
    const ctx = buildBuddyPhraseContext(baseBuddy, null, false, EMPTY_GARDEN_METRICS);
    const first = pickBuddyPhrase({ context: ctx, recentIds: [] });
    const second = pickBuddyPhrase({
      context: ctx,
      recentIds: pushRecentPhraseId([], first.id),
    });
    expect(second.id).not.toBe(first.id);
  });
});
