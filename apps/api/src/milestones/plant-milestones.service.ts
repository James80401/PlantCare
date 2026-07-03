import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildMilestoneDtos,
  milestoneKeysToUnlock,
  type MilestoneEngagementSnapshot,
  type PlantMilestoneDto,
  plantLifeMilestoneKey,
  type PlantLifeMilestoneId,
  PLANT_LIFE_MILESTONE_DEFS,
  PLANT_MILESTONE_DEFS,
} from './plant-milestone.defs';

type PlantLifeProgressSnapshot = {
  overallHealth: string;
  growthChange: string | null;
  photoUrl: string | null;
  createdAt: Date;
};

@Injectable()
export class PlantMilestonesService {
  constructor(private prisma: PrismaService) {}

  async syncAndListForUser(
    userId: string,
    snapshot: MilestoneEngagementSnapshot,
  ): Promise<PlantMilestoneDto[]> {
    const existing = await this.prisma.plantMilestone.findMany({
      where: { userId },
      select: { milestoneKey: true, unlockedAt: true },
    });
    const persistedKeys = new Set(existing.map((row) => row.milestoneKey));

    const newlyEligible = milestoneKeysToUnlock(snapshot).filter(
      (key) => !persistedKeys.has(key),
    );

    if (newlyEligible.length) {
      const titleByKey = new Map(
        PLANT_MILESTONE_DEFS.map((definition) => [definition.id, definition.title]),
      );
      await this.prisma.plantMilestone.createMany({
        data: newlyEligible.map((milestoneKey) => ({
          userId,
          milestoneKey,
          title: titleByKey.get(milestoneKey) ?? milestoneKey,
        })),
      });
    }

    const rows = await this.prisma.plantMilestone.findMany({
      where: { userId },
      select: { milestoneKey: true, unlockedAt: true },
    });

    const persisted = new Map(
      rows.map((row) => [row.milestoneKey, row.unlockedAt] as const),
    );

    return buildMilestoneDtos(persisted, snapshot);
  }

  async syncPlantLifeMilestones(
    userId: string,
    plantId: string,
    progressEntries: PlantLifeProgressSnapshot[],
  ) {
    if (!progressEntries.length) return;

    const eligible = this.plantLifeMilestonesToUnlock(plantId, progressEntries);
    if (!eligible.length) return;

    const keys = eligible.map((definition) => plantLifeMilestoneKey(plantId, definition.id));
    const existing = await this.prisma.plantMilestone.findMany({
      where: { userId, milestoneKey: { in: keys } },
      select: { milestoneKey: true },
    });
    const existingKeys = new Set(existing.map((row) => row.milestoneKey));
    const rows = eligible.filter(
      (definition) => !existingKeys.has(plantLifeMilestoneKey(plantId, definition.id)),
    );

    if (!rows.length) return;

    await this.prisma.plantMilestone.createMany({
      data: rows.map((definition) => ({
        userId,
        plantId,
        milestoneKey: plantLifeMilestoneKey(plantId, definition.id),
        title: definition.title,
      })),
    });
  }

  private plantLifeMilestonesToUnlock(
    plantId: string,
    progressEntries: PlantLifeProgressSnapshot[],
  ) {
    const definitionsById = new Map(
      PLANT_LIFE_MILESTONE_DEFS.map((definition) => [definition.id, definition]),
    );
    const unlocked = new Set<PlantLifeMilestoneId>();

    if (progressEntries.length >= 1) unlocked.add('baseline');
    if (progressEntries.length >= 3) unlocked.add('three_check_ins');
    if (progressEntries.some((entry) => entry.photoUrl)) unlocked.add('progress_photo');
    if (progressEntries.some((entry) => entry.growthChange === 'NEW_GROWTH')) {
      unlocked.add('new_growth');
    }

    const newestFirst = [...progressEntries].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const latestThree = newestFirst.slice(0, 3);
    if (
      latestThree.length >= 3 &&
      latestThree.every((entry) => ['THRIVING', 'STABLE'].includes(entry.overallHealth))
    ) {
      unlocked.add('stable_streak');
    }

    const oldestFirst = [...progressEntries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const hasRecovery = oldestFirst.some((entry, index) => {
      if (index === 0) return false;
      const previous = oldestFirst[index - 1];
      return (
        ['CONCERNED', 'DECLINING'].includes(previous.overallHealth) &&
        ['STABLE', 'THRIVING'].includes(entry.overallHealth)
      );
    });
    if (hasRecovery) unlocked.add('recovery_signal');

    return [...unlocked]
      .map((id) => definitionsById.get(id))
      .filter((definition): definition is NonNullable<typeof definition> => Boolean(definition));
  }
}
