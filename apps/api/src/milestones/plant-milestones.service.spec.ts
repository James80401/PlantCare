import { PlantMilestonesService } from './plant-milestones.service';

describe('PlantMilestonesService', () => {
  const userId = 'user-1';
  const unlockedAt = new Date('2026-05-01T12:00:00.000Z');

  function createService() {
    const rows: Array<{ milestoneKey: string; unlockedAt: Date }> = [];
    const prisma = {
      plantMilestone: {
        findMany: jest.fn(async () =>
          rows.map((row) => ({ milestoneKey: row.milestoneKey, unlockedAt: row.unlockedAt })),
        ),
        createMany: jest.fn(async ({ data }: { data: Array<{ milestoneKey: string; title: string }> }) => {
          for (const item of data) {
            if (!rows.some((row) => row.milestoneKey === item.milestoneKey)) {
              rows.push({ milestoneKey: item.milestoneKey, unlockedAt: new Date() });
            }
          }
          return { count: data.length };
        }),
      },
    };
    return { service: new PlantMilestonesService(prisma as never), prisma, rows };
  }

  it('persists newly eligible milestones and returns unlocked state', async () => {
    const { service, prisma } = createService();

    const result = await service.syncAndListForUser(userId, {
      plantCount: 3,
      plantCreatedAts: [new Date('2026-01-01')],
      completedInRange: 2,
      streak: 4,
    });

    expect(prisma.plantMilestone.createMany).toHaveBeenCalled();
    expect(result.find((item) => item.id === 'first_plant')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'growing_garden')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'care_rhythm_3')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'care_rhythm_7')?.unlocked).toBe(false);
  });

  it('keeps milestones unlocked after stats drop', async () => {
    const { service, rows } = createService();
    rows.push({ milestoneKey: 'growing_garden', unlockedAt });

    const result = await service.syncAndListForUser(userId, {
      plantCount: 1,
      plantCreatedAts: [],
      completedInRange: 0,
      streak: 0,
    });

    expect(result.find((item) => item.id === 'growing_garden')?.unlocked).toBe(true);
    expect(result.find((item) => item.id === 'growing_garden')?.unlockedAt).toBe(
      unlockedAt.toISOString(),
    );
  });
});
