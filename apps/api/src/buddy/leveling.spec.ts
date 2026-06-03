import {
  buddyLevelFromXp,
  buddyLevelProgress,
  levelRequiredForShopTier,
} from './constants/leveling';

describe('buddy leveling', () => {
  it('maps cumulative XP to buddy levels', () => {
    expect(buddyLevelFromXp(0)).toBe(1);
    expect(buddyLevelFromXp(60)).toBe(2);
    expect(buddyLevelFromXp(249)).toBe(3);
    expect(buddyLevelFromXp(250)).toBe(4);
  });

  it('reports current-level XP progress', () => {
    expect(buddyLevelProgress(100)).toMatchObject({
      level: 2,
      currentLevelXp: 60,
      nextLevelXp: 140,
      xpIntoLevel: 40,
      xpForNextLevel: 80,
      progressPercent: 50,
    });
  });

  it('uses shop tiers as level unlock bands', () => {
    expect(levelRequiredForShopTier(1)).toBe(1);
    expect(levelRequiredForShopTier(2)).toBe(4);
    expect(levelRequiredForShopTier(3)).toBe(8);
  });
});
