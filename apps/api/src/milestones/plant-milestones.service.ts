import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildMilestoneDtos,
  milestoneKeysToUnlock,
  type MilestoneEngagementSnapshot,
  type PlantMilestoneDto,
  PLANT_MILESTONE_DEFS,
} from './plant-milestone.defs';

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
}
