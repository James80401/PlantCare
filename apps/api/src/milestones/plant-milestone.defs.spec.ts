import { buildMilestoneDtos, milestoneKeysToUnlock } from './plant-milestone.defs';

describe('plant-milestone.defs', () => {
  it('lists keys eligible for first unlock', () => {
    const keys = milestoneKeysToUnlock({
      plantCount: 1,
      plantCreatedAts: [new Date('2026-01-01')],
      completedInRange: 1,
      streak: 0,
    });
    expect(keys).toContain('first_plant');
    expect(keys).toContain('first_care');
    expect(keys).not.toContain('growing_garden');
  });

  it('marks persisted keys as unlocked with timestamps', () => {
    const persisted = new Map([['first_plant', new Date('2026-05-01')]] as const);
    const dtos = buildMilestoneDtos(persisted, {
      plantCount: 0,
      plantCreatedAts: [],
      completedInRange: 0,
      streak: 0,
    });
    const first = dtos.find((item) => item.id === 'first_plant');
    expect(first?.unlocked).toBe(true);
    expect(first?.unlockedAt).toBe(new Date('2026-05-01').toISOString());
  });
});
