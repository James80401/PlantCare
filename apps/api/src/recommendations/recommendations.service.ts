import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  RecommendationPriority,
  RecommendationSource,
  RecommendationStatus,
  TaskStatus,
  TaskType,
  type Plant,
  type PlantProgressEntry,
  type PlantSpecies,
  type Recommendation,
} from '@prisma/client';
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns';
import { userCanCompletePlantTask, userCanViewPlantTasks, sharedPlantInclude } from '../gardens/task-access';
import { PrismaService } from '../prisma/prisma.service';
import { isSucculentSpecies, speciesDiscoveryTags } from '../species/species-catalog-meta';
import { getLocalDayStart } from '../weather/weather-cache.util';

type RecommendationPlant = Plant & {
  species: PlantSpecies;
  progressEntries: PlantProgressEntry[];
  garden: { id: string; name: string; location: string | null };
};

type RecommendationGarden = {
  id: string;
  name: string;
  location: string | null;
  plantCount: number;
};

type UpsertRecommendationInput = {
  userId: string;
  plantId?: string | null;
  gardenId?: string | null;
  source: RecommendationSource;
  sourceKey: string;
  priority: RecommendationPriority;
  title: string;
  body: string;
  actionLabel?: string;
  actionPath?: string;
  suggestedTaskType?: TaskType;
  suggestedTaskDueInDays?: number;
  metadata?: Record<string, unknown>;
};

export type DrPlantRecommendationInput = Omit<
  UpsertRecommendationInput,
  'source' | 'userId'
> & {
  userId: string;
};

const ACTIVE_STATUSES = [RecommendationStatus.ACTIVE, RecommendationStatus.SNOOZED];

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async refreshForUser(userId: string, now = new Date()) {
    await this.reactivateExpiredSnoozes(userId, now);
    const plants = await this.prisma.plant.findMany({
      where: { userId },
      include: {
        species: true,
        garden: { select: { id: true, name: true, location: true } },
        progressEntries: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
    const recommendations = this.buildGeneratedRecommendations(userId, plants, now);

    for (const recommendation of recommendations) {
      await this.upsertActiveRecommendation(recommendation, now);
    }

    return this.listForUser(userId, { now });
  }

  async listForUser(
    userId: string,
    options: { plantId?: string; now?: Date; limit?: number } = {},
  ) {
    const now = options.now ?? new Date();
    return this.prisma.recommendation.findMany({
      where: {
        userId,
        ...(options.plantId ? { plantId: options.plantId } : {}),
        status: { in: ACTIVE_STATUSES },
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }],
      },
      include: {
        plant: {
          select: {
            id: true,
            nickname: true,
            imageUrl: true,
            species: { select: { commonName: true, defaultImageUrl: true } },
          },
        },
        garden: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { lastRefreshedAt: 'desc' }],
      take: options.limit ?? 12,
    });
  }

  async markDone(userId: string, recommendationId: string) {
    const recommendation = await this.loadForUser(userId, recommendationId);
    return this.prisma.recommendation.update({
      where: { id: recommendation.id },
      data: {
        status: RecommendationStatus.DONE,
        completedAt: new Date(),
        snoozedUntil: null,
      },
    });
  }

  async dismiss(userId: string, recommendationId: string) {
    const recommendation = await this.loadForUser(userId, recommendationId);
    return this.prisma.recommendation.update({
      where: { id: recommendation.id },
      data: {
        status: RecommendationStatus.DISMISSED,
        dismissedAt: new Date(),
        snoozedUntil: null,
      },
    });
  }

  async snoozeUntilTomorrow(userId: string, recommendationId: string) {
    const recommendation = await this.loadForUser(userId, recommendationId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const snoozedUntil = getLocalDayStart(user?.timezone || 'UTC', 1);
    return this.prisma.recommendation.update({
      where: { id: recommendation.id },
      data: {
        status: RecommendationStatus.SNOOZED,
        snoozedUntil,
      },
    });
  }

  async convertToTask(userId: string, recommendationId: string) {
    const recommendation = await this.loadForUser(userId, recommendationId);
    if (!recommendation.plantId || !recommendation.suggestedTaskType) {
      throw new BadRequestException('This recommendation cannot become a task yet.');
    }

    const plant = await this.prisma.plant.findFirst({
      where: { id: recommendation.plantId },
      include: sharedPlantInclude,
    });
    if (!plant || !userCanCompletePlantTask(userId, plant)) {
      throw new NotFoundException('Recommendation not found');
    }

    const dueDate = addDays(
      startOfDay(new Date()),
      recommendation.suggestedTaskDueInDays ?? 1,
    );
    const task = await this.prisma.task.create({
      data: {
        plantId: recommendation.plantId,
        gardenId: plant.gardenId,
        taskType: recommendation.suggestedTaskType,
        dueDate,
        status: TaskStatus.PENDING,
      },
      include: { plant: { include: { species: true } } },
    });

    await this.prisma.recommendation.update({
      where: { id: recommendation.id },
      data: {
        status: RecommendationStatus.DONE,
        completedAt: new Date(),
        metadataJson: this.mergeMetadata(recommendation, { convertedTaskId: task.id }),
      },
    });

    return task;
  }

  async refreshPlant(userId: string, plantId: string, now = new Date()) {
    const plant = await this.prisma.plant.findFirst({
      where: { id: plantId },
      include: {
        species: true,
        garden: {
          select: {
            id: true,
            name: true,
            location: true,
            members: { select: { userId: true, role: true } },
          },
        },
        progressEntries: { orderBy: { createdAt: 'desc' }, take: 1 },
        shares: {
          include: {
            garden: {
              include: {
                members: { select: { userId: true, role: true } },
              },
            },
          },
        },
      },
    });
    if (!plant || !userCanViewPlantTasks(userId, plant)) {
      throw new NotFoundException('Plant not found');
    }
    if (plant.userId !== userId) return this.listForUser(userId, { plantId, now });

    await this.reactivateExpiredSnoozes(userId, now);
    const recommendations = this.buildGeneratedRecommendations(userId, [plant], now);
    for (const recommendation of recommendations) {
      await this.upsertActiveRecommendation(recommendation, now);
    }
    return this.listForUser(userId, { plantId, now });
  }

  async createDrPlantRecommendation(input: DrPlantRecommendationInput) {
    return this.upsertActiveRecommendation(
      {
        ...input,
        source: RecommendationSource.DR_PLANT,
      },
      new Date(),
    );
  }

  async completePlantCheckInForPlant(userId: string, plantId: string, now = new Date()) {
    return this.prisma.recommendation.updateMany({
      where: {
        userId,
        plantId,
        source: RecommendationSource.PLANT_CHECK_IN,
        status: { in: ACTIVE_STATUSES },
      },
      data: {
        status: RecommendationStatus.DONE,
        completedAt: now,
        snoozedUntil: null,
      },
    });
  }

  private buildGeneratedRecommendations(
    userId: string,
    plants: RecommendationPlant[],
    now: Date,
  ): UpsertRecommendationInput[] {
    const plantRecommendations = plants.flatMap((plant) => {
      const items: UpsertRecommendationInput[] = [];
      const checkIn = this.buildPlantCheckInRecommendation(userId, plant, now);
      if (checkIn) items.push(checkIn);
      const flush = this.buildFlushSoilRecommendation(userId, plant, now);
      if (flush) items.push(flush);
      const harvest = this.buildHarvestRecommendation(userId, plant, now);
      if (harvest) items.push(harvest);
      const protect = this.buildMoveProtectRecommendation(userId, plant, now);
      if (protect) items.push(protect);
      return items;
    });
    return [
      ...plantRecommendations,
      ...this.buildGardenRecommendations(userId, this.gardensFromPlants(plants), now),
    ];
  }

  private buildPlantCheckInRecommendation(
    userId: string,
    plant: RecommendationPlant,
    now: Date,
  ): UpsertRecommendationInput | null {
    const latest = plant.progressEntries[0];
    const interval = this.plantCheckInIntervalDays(latest);
    const anchor = latest?.createdAt ?? plant.createdAt;
    const dueDate = addDays(startOfDay(anchor), latest ? interval : 7);
    if (differenceInCalendarDays(now, dueDate) < 0) return null;
    const plantName = this.plantName(plant);

    return {
      userId,
      plantId: plant.id,
      gardenId: plant.gardenId,
      source: RecommendationSource.PLANT_CHECK_IN,
      sourceKey: `plant-check-in:${plant.id}:${format(dueDate, 'yyyy-MM-dd')}`,
      priority: latest && this.isConcernedProgress(latest)
        ? RecommendationPriority.HIGH
        : RecommendationPriority.MEDIUM,
      title: `Check in on ${plantName}`,
      body: latest
        ? 'Add a Plant Check-In so Dr. Plant can compare the latest status with the previous health story.'
        : 'Add the first Plant Check-In to start this plant\'s health and growth story.',
      actionLabel: 'Plant Check-In',
      actionPath: `/garden/plants/${plant.id}/journal#progress-check-in`,
      metadata: { dueDate: dueDate.toISOString(), intervalDays: interval },
    };
  }

  private buildGardenRecommendations(
    userId: string,
    gardens: RecommendationGarden[],
    now: Date,
  ): UpsertRecommendationInput[] {
    return gardens.flatMap((garden) => {
      const environment = (garden.location ?? '').toLowerCase();
      const items: UpsertRecommendationInput[] = [];

      // Outdoor weather protection is already covered per-plant by
      // buildMoveProtectRecommendation; a garden-level card here would just
      // duplicate it for every outdoor garden.
      if (environment.includes('indoor') && garden.plantCount >= 1) {
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        items.push({
          userId,
          gardenId: garden.id,
          source: RecommendationSource.ENVIRONMENT,
          sourceKey: `garden-light-audit:${garden.id}:${now.getFullYear()}-Q${quarter}`,
          priority: RecommendationPriority.LOW,
          title: `Review light balance in ${garden.name}`,
          body:
            'Indoor light shifts through the year. Check whether plants are leaning, stretching, or sitting in more shade than expected.',
          actionLabel: 'Open garden',
          actionPath: `/garden/gardens/${garden.id}`,
          metadata: {
            environment: garden.location,
            plantCount: garden.plantCount,
            quarter,
          },
        });
      }

      return items;
    });
  }

  private buildFlushSoilRecommendation(
    userId: string,
    plant: RecommendationPlant,
    now: Date,
  ): UpsertRecommendationInput | null {
    const interval = isSucculentSpecies(plant.species) ? 90 : 60;
    const anchor = addDays(startOfDay(plant.createdAt), interval);
    if (differenceInCalendarDays(now, anchor) < 0) return null;
    const cycle = Math.floor(differenceInCalendarDays(now, anchor) / interval);
    const dueDate = addDays(anchor, cycle * interval);
    const plantName = this.plantName(plant);

    return {
      userId,
      plantId: plant.id,
      gardenId: plant.gardenId,
      source: RecommendationSource.CARE_TIMING,
      sourceKey: `flush-soil:${plant.id}:${format(dueDate, 'yyyy-MM-dd')}`,
      priority: RecommendationPriority.LOW,
      title: `Consider a soil flush for ${plantName}`,
      body:
        'If you fertilize or see mineral crust, run plain water through the soil and let the pot drain fully.',
      actionLabel: 'Open care guide',
      actionPath: `/garden/plants/${plant.id}/care`,
      metadata: { dueDate: dueDate.toISOString(), intervalDays: interval },
    };
  }

  private buildHarvestRecommendation(
    userId: string,
    plant: RecommendationPlant,
    now: Date,
  ): UpsertRecommendationInput | null {
    if (!speciesDiscoveryTags(plant.species).includes('Edible')) return null;
    const dueDate = addDays(startOfDay(plant.createdAt), 21);
    if (differenceInCalendarDays(now, dueDate) < 0) return null;
    const plantName = this.plantName(plant);

    return {
      userId,
      plantId: plant.id,
      gardenId: plant.gardenId,
      source: RecommendationSource.CARE_TIMING,
      sourceKey: `harvest:${plant.id}:${format(now, 'yyyy-MM')}`,
      priority: RecommendationPriority.LOW,
      title: `Check harvest timing for ${plantName}`,
      body:
        'Edible plants are best harvested at the right stage. Look for mature leaves, fruit, or stems before cutting.',
      actionLabel: 'Open plant',
      actionPath: `/garden/plants/${plant.id}/overview`,
      metadata: { edible: true },
    };
  }

  private buildMoveProtectRecommendation(
    userId: string,
    plant: RecommendationPlant,
    now: Date,
  ): UpsertRecommendationInput | null {
    const environment = `${plant.location ?? ''} ${plant.garden.location ?? ''}`.toLowerCase();
    if (!environment.includes('outdoor')) return null;
    const month = now.getMonth();
    if (![0, 1, 5, 6, 7, 11].includes(month)) return null;
    const plantName = this.plantName(plant);

    return {
      userId,
      plantId: plant.id,
      gardenId: plant.gardenId,
      source: RecommendationSource.ENVIRONMENT,
      sourceKey: `move-protect:${plant.id}:${format(now, 'yyyy-MM')}`,
      priority: RecommendationPriority.MEDIUM,
      title: `Review outdoor protection for ${plantName}`,
      body:
        'Outdoor plants may need shade, wind protection, or indoor backup during harsher weather windows.',
      actionLabel: 'Open plant',
      actionPath: `/garden/plants/${plant.id}/overview`,
      metadata: { environment: plant.location ?? plant.garden.location },
    };
  }

  private async upsertActiveRecommendation(input: UpsertRecommendationInput, now: Date) {
    const existing = await this.prisma.recommendation.findUnique({
      where: { userId_sourceKey: { userId: input.userId, sourceKey: input.sourceKey } },
    });

    if (
      existing &&
      (existing.status === RecommendationStatus.DONE ||
        existing.status === RecommendationStatus.DISMISSED)
    ) {
      return existing;
    }

    const data = {
      plantId: input.plantId,
      gardenId: input.gardenId,
      source: input.source,
      priority: input.priority,
      title: input.title,
      body: input.body,
      actionLabel: input.actionLabel,
      actionPath: input.actionPath,
      suggestedTaskType: input.suggestedTaskType,
      suggestedTaskDueInDays: input.suggestedTaskDueInDays,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined,
      lastRefreshedAt: now,
    };

    return this.prisma.recommendation.upsert({
      where: { userId_sourceKey: { userId: input.userId, sourceKey: input.sourceKey } },
      create: {
        userId: input.userId,
        sourceKey: input.sourceKey,
        status: RecommendationStatus.ACTIVE,
        ...data,
      },
      update: data,
    });
  }

  private async reactivateExpiredSnoozes(userId: string, now: Date) {
    await this.prisma.recommendation.updateMany({
      where: {
        userId,
        status: RecommendationStatus.SNOOZED,
        snoozedUntil: { lte: now },
      },
      data: { status: RecommendationStatus.ACTIVE, snoozedUntil: null, notifiedAt: null },
    });
  }

  private async loadForUser(userId: string, recommendationId: string): Promise<Recommendation> {
    const recommendation = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, userId },
    });
    if (!recommendation) throw new NotFoundException('Recommendation not found');
    return recommendation;
  }

  private plantCheckInIntervalDays(latest?: PlantProgressEntry) {
    if (!latest) return 7;
    if (this.isConcernedProgress(latest)) return 7;
    if (latest.overallHealth === 'CONCERNED') return 14;
    return 30;
  }

  private isConcernedProgress(entry: PlantProgressEntry) {
    return (
      entry.overallHealth === 'DECLINING' ||
      entry.leafCondition === 'WILTING' ||
      entry.leafCondition === 'PEST_DAMAGE' ||
      entry.pestSigns === 'VISIBLE_PESTS' ||
      entry.pestSigns === 'WEBBING' ||
      entry.pestSigns === 'STICKY_RESIDUE'
    );
  }

  private plantName(plant: RecommendationPlant) {
    return plant.nickname || plant.species.commonName;
  }

  private gardensFromPlants(plants: RecommendationPlant[]): RecommendationGarden[] {
    const byGarden = new Map<string, RecommendationGarden>();
    for (const plant of plants) {
      const existing = byGarden.get(plant.garden.id);
      if (existing) {
        existing.plantCount += 1;
      } else {
        byGarden.set(plant.garden.id, {
          id: plant.garden.id,
          name: plant.garden.name,
          location: plant.garden.location,
          plantCount: 1,
        });
      }
    }
    return [...byGarden.values()];
  }

  private mergeMetadata(recommendation: Recommendation, patch: Record<string, unknown>) {
    let base: Record<string, unknown> = {};
    if (recommendation.metadataJson) {
      try {
        base = JSON.parse(recommendation.metadataJson) as Record<string, unknown>;
      } catch {
        base = {};
      }
    }
    return JSON.stringify({ ...base, ...patch });
  }
}
