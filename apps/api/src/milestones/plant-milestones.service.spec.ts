import { PlantMilestonesService } from './plant-milestones.service';

describe('PlantMilestonesService', () => {
  const userId = 'user-1';
  const unlockedAt = new Date('2026-05-01T12:00:00.000Z');

  function createDashboardService() {
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

  function createPlantLifeService(existingKeys: string[] = []) {
    const prisma = {
      plantMilestone: {
        findMany: jest.fn().mockResolvedValue(
          existingKeys.map((milestoneKey) => ({ milestoneKey })),
        ),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    return {
      service: new PlantMilestonesService(prisma as never),
      prisma,
    };
  }

  it('persists newly eligible milestones and returns unlocked state', async () => {
    const { service, prisma } = createDashboardService();

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
    const { service, rows } = createDashboardService();
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

  it('persists newly earned per-plant progress milestones', async () => {
    const { service, prisma } = createPlantLifeService([
      'plant_life:plant-1:baseline',
    ]);

    await service.syncPlantLifeMilestones('user-1', 'plant-1', [
      {
        overallHealth: 'THRIVING',
        growthChange: 'NEW_GROWTH',
        photoUrl: '/uploads/third.jpg',
        createdAt: new Date('2026-07-03T12:00:00Z'),
      },
      {
        overallHealth: 'STABLE',
        growthChange: null,
        photoUrl: null,
        createdAt: new Date('2026-07-02T12:00:00Z'),
      },
      {
        overallHealth: 'STABLE',
        growthChange: null,
        photoUrl: null,
        createdAt: new Date('2026-07-01T12:00:00Z'),
      },
    ]);

    expect(prisma.plantMilestone.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        milestoneKey: {
          in: expect.arrayContaining([
            'plant_life:plant-1:baseline',
            'plant_life:plant-1:three_check_ins',
            'plant_life:plant-1:progress_photo',
            'plant_life:plant-1:new_growth',
            'plant_life:plant-1:stable_streak',
          ]),
        },
      },
      select: { milestoneKey: true },
    });
    expect(prisma.plantMilestone.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          plantId: 'plant-1',
          milestoneKey: 'plant_life:plant-1:three_check_ins',
          title: 'Three check-ins',
        }),
        expect.objectContaining({
          milestoneKey: 'plant_life:plant-1:progress_photo',
          title: 'Photo record',
        }),
        expect.objectContaining({
          milestoneKey: 'plant_life:plant-1:new_growth',
          title: 'New growth noted',
        }),
        expect.objectContaining({
          milestoneKey: 'plant_life:plant-1:stable_streak',
          title: 'Stable streak',
        }),
      ]),
    });
    expect(prisma.plantMilestone.createMany).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ milestoneKey: 'plant_life:plant-1:baseline' }),
        ]),
      }),
    );
  });

  it('recognizes a recovery signal when health improves after concern', async () => {
    const { service, prisma } = createPlantLifeService();

    await service.syncPlantLifeMilestones('user-1', 'plant-1', [
      {
        overallHealth: 'STABLE',
        growthChange: null,
        photoUrl: null,
        createdAt: new Date('2026-07-03T12:00:00Z'),
      },
      {
        overallHealth: 'CONCERNED',
        growthChange: null,
        photoUrl: null,
        createdAt: new Date('2026-07-01T12:00:00Z'),
      },
    ]);

    expect(prisma.plantMilestone.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          milestoneKey: 'plant_life:plant-1:recovery_signal',
          title: 'Recovery signal',
        }),
      ]),
    });
  });
});
