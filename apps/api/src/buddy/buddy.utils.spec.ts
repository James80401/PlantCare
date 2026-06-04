import { computeJourneyDurationMs, computeStreakUpdate, formatBuddy } from './buddy.utils';

describe('computeStreakUpdate (midnight streak)', () => {
  const now = new Date(2026, 5, 4, 10); // Thu Jun 4 2026, local
  const today = new Date(2026, 5, 4, 1);
  const yesterday = new Date(2026, 5, 3, 8);
  const threeDaysAgo = new Date(2026, 5, 1, 12);

  it('starts a streak at 1 when there is no prior activity', () => {
    const result = computeStreakUpdate({ streakDays: 5, longestStreak: 9 }, null, now);
    expect(result).toMatchObject({ alreadyActiveToday: false, streakDays: 1, longestStreak: 9 });
  });

  it('extends the streak on a consecutive day', () => {
    const result = computeStreakUpdate({ streakDays: 5, longestStreak: 9 }, yesterday, now);
    expect(result.streakDays).toBe(6);
    expect(result.bonusDewdrops).toBe(0);
  });

  it('is a no-op when already active today', () => {
    const result = computeStreakUpdate({ streakDays: 5, longestStreak: 9 }, today, now);
    expect(result.alreadyActiveToday).toBe(true);
    expect(result.streakDays).toBe(5);
  });

  it('resets to 1 after a gap', () => {
    const result = computeStreakUpdate({ streakDays: 5, longestStreak: 9 }, threeDaysAgo, now);
    expect(result.streakDays).toBe(1);
    expect(result.longestStreak).toBe(9);
  });

  it('awards milestone bonuses at 7 and 30 days', () => {
    expect(
      computeStreakUpdate({ streakDays: 6, longestStreak: 6 }, yesterday, now).bonusDewdrops,
    ).toBe(50);
    expect(
      computeStreakUpdate({ streakDays: 29, longestStreak: 29 }, yesterday, now),
    ).toMatchObject({ streakDays: 30, longestStreak: 30, bonusDewdrops: 200 });
  });
});

describe('formatBuddy journey gating', () => {
  function buddy(overrides: Record<string, unknown> = {}) {
    return {
      id: 'b1',
      name: 'Sprout',
      speciesId: 'fern',
      experiencePoints: 0,
      sunlightToday: 0,
      streakDays: 0,
      longestStreak: 0,
      bloomTokens: 0,
      journeys: [],
      ...overrides,
    } as never;
  }

  it('is journey-ready only with full sunlight and no active journey', () => {
    expect(formatBuddy(buddy({ sunlightToday: 100 })).journeyReady).toBe(true);
    expect(formatBuddy(buddy({ sunlightToday: 80 })).journeyReady).toBe(false);
  });

  it('reports an active journey and blocks readiness while one runs', () => {
    const withJourney = formatBuddy(
      buddy({ sunlightToday: 100, journeys: [{ id: 'j1', completed: false }] }),
    );
    expect(withJourney.hasActiveJourney).toBe(true);
    expect(withJourney.journeyReady).toBe(false);
  });

  it('enables bloom tokens only for the rose species', () => {
    expect(formatBuddy(buddy({ speciesId: 'rose' })).bloomTokensEnabled).toBe(true);
    expect(formatBuddy(buddy({ speciesId: 'fern' })).bloomTokensEnabled).toBe(false);
  });
});

describe('computeJourneyDurationMs (accelerated timer)', () => {
  it('uses an explicit minutes override with a 1-minute floor', () => {
    expect(
      computeJourneyDurationMs({ demoMinutes: '5', isProduction: true, biomeHours: 8 }),
    ).toBe(5 * 60 * 1000);
    // "0" floors to 1 minute rather than an instant journey.
    expect(
      computeJourneyDurationMs({ demoMinutes: '0', isProduction: false, biomeHours: 8 }),
    ).toBe(60 * 1000);
  });

  it('defaults to 2 minutes outside production', () => {
    expect(
      computeJourneyDurationMs({ demoMinutes: null, isProduction: false, biomeHours: 8 }),
    ).toBe(2 * 60 * 1000);
  });

  it('uses the biome hours in production', () => {
    expect(
      computeJourneyDurationMs({ demoMinutes: undefined, isProduction: true, biomeHours: 8 }),
    ).toBe(8 * 60 * 60 * 1000);
  });
});
