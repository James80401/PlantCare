import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlantLifeStage, PlanTier } from '@prisma/client';
import { CareGuidesService } from '../care-guides/care-guides.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { UploadService } from '../upload/upload.service';
import { ImageModerationService } from '../common/image-moderation.service';
import { sharedPlantInclude, userCanViewPlantTasks } from '../gardens/task-access';
import { canEditGarden, parseGardenRole } from '../gardens/garden-authz';
import { PlantNetService } from './plantnet.service';
import { PerenualService } from '../species/perenual.service';
import { WeatherService } from '../weather/weather.service';
import { freePlanLimits, IDENTIFY_WINDOW_DAYS } from '../billing/billing-limits';
import { resolveCareArchetype } from '../plant-intelligence/care-archetypes';
import { buildMetadataForSpecies, serializeSpeciesMetadata } from '../species/species-metadata';
import { CreatePlantDto } from './dto/create-plant.dto';
import { ConfirmExternalSpeciesDto } from './dto/confirm-external-species.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { buildPlantTimeline } from './plant-timeline.builder';

@Injectable()
export class PlantsService {
  constructor(
    private prisma: PrismaService,
    private careGuides: CareGuidesService,
    private scheduler: SchedulerService,
    private upload: UploadService,
    private plantNet: PlantNetService,
    private perenual: PerenualService,
    private weather: WeatherService,
    private config: ConfigService,
    private imageModeration: ImageModerationService,
  ) {}

  async findAll(userId: string) {
    await this.scheduler.autoPostponeOutdoorWateringFromWeather(userId);
    const rows = await this.prisma.plant.findMany({
      where: { userId },
      include: {
        species: true,
        tasks: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
        diagnoses: {
          where: { resolved: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { resultLabel: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(({ diagnoses, ...plant }) => ({
      ...plant,
      unresolvedDiagnosis: diagnoses[0]
        ? {
            resultLabel: diagnoses[0].resultLabel,
            createdAt: diagnoses[0].createdAt.toISOString(),
          }
        : null,
    }));
  }

  async findOne(userId: string, id: string) {
    const weatherStatus = await this.weather.getAdviceStatus(userId);
    await this.scheduler.autoPostponeOutdoorWateringFromWeather(userId);

    const plant = await this.prisma.plant.findFirst({
      where: { id },
      include: {
        species: true,
        tasks: {
          orderBy: { dueDate: 'desc' },
          take: 40,
          include: {
            // Fetch the full feedback trail (newest first) so the UI can pick the
            // terminal complete/skip reason and count reschedules, instead of
            // blindly using the most recent row (which may be a SNOOZE).
            feedback: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
        journalEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
        progressEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
        milestones: {
          where: { plantId: id },
          orderBy: { unlockedAt: 'desc' },
          select: { id: true, milestoneKey: true, title: true, unlockedAt: true },
        },
        diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 },
        ...sharedPlantInclude,
      },
    });
    if (!plant || !userCanViewPlantTasks(userId, plant)) {
      throw new NotFoundException('Plant not found');
    }
    const careOverview = this.careGuides.buildPlantCareOverview(
      plant,
      weatherStatus.cachedAdvice,
    );
    return { ...plant, careOverview };
  }

  async getTimeline(userId: string, id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id },
      include: sharedPlantInclude,
    });
    if (!plant || !userCanViewPlantTasks(userId, plant)) {
      throw new NotFoundException('Plant not found');
    }

    const [journalEntries, tasks, diagnoses, progressEntries] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { plantId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.task.findMany({
        where: {
          plantId: id,
          status: { in: ['DONE', 'SKIPPED'] },
          completedAt: { not: null },
        },
        orderBy: { completedAt: 'desc' },
        take: 50,
        include: {
          feedback: { orderBy: { createdAt: 'desc' }, take: 20 },
        },
      }),
      this.prisma.diagnosis.findMany({
        where: { plantId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.plantProgressEntry.findMany({
        where: { plantId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return buildPlantTimeline(journalEntries, tasks, diagnoses, progressEntries);
  }

  async create(userId: string, planTier: PlanTier, dto: CreatePlantDto) {
    const currentPlanTier = await this.planTierForUser(userId, planTier);
    await this.assertCanCreatePlant(userId, currentPlanTier);
    const gardenArea = await this.assertCanEditGarden(userId, dto.gardenId);
    await this.perenual.getOrFetchById(dto.speciesId);

    const plant = await this.prisma.plant.create({
      data: {
        userId,
        gardenId: dto.gardenId,
        speciesId: dto.speciesId,
        nickname: dto.nickname,
        location: gardenArea,
        potSize: dto.potSize,
        lifeStage: dto.lifeStage ?? PlantLifeStage.ESTABLISHED,
        approximateAgeMonths: dto.approximateAgeMonths,
        datePlanted: dto.datePlanted ? new Date(dto.datePlanted) : undefined,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
      },
      include: { species: true },
    });

    await this.scheduler.generateTasksForPlant(plant.id, currentPlanTier);
    return this.findOne(userId, plant.id);
  }

  /** A plant may only be added to a garden the user owns or co-cares for. */
  private async assertCanEditGarden(userId: string, gardenId: string): Promise<string | null> {
    const member = await this.prisma.gardenMember.findUnique({
      where: { gardenId_userId: { gardenId, userId } },
    });
    const role = member ? parseGardenRole(member.role) : null;
    if (!role || !canEditGarden(role)) {
      throw new ForbiddenException(
        'You do not have access to add plants to this garden.',
      );
    }
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { location: true },
    });
    return garden?.location ?? null;
  }

  async update(userId: string, id: string, planTier: PlanTier, dto: UpdatePlantDto) {
    const plant = await this.prisma.plant.findFirst({ where: { id, userId } });
    if (!plant) throw new NotFoundException('Plant not found');

    const locationChanged =
      dto.location !== undefined && dto.location.trim() !== (plant.location ?? '').trim();
    const potSizeChanged =
      dto.potSize !== undefined && dto.potSize !== plant.potSize;
    const imageChanged =
      dto.imageUrl !== undefined && dto.imageUrl !== (plant.imageUrl ?? null);

    await this.prisma.plant.update({
      where: { id },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname.trim() || null } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.potSize !== undefined ? { potSize: dto.potSize } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl || null } : {}),
      },
    });
    if (imageChanged && plant.imageUrl && dto.imageUrl !== plant.imageUrl) {
      await this.upload.deleteByUrl(plant.imageUrl).catch(() => {});
    }

    const shouldReschedule = locationChanged || potSizeChanged;
    if (shouldReschedule) {
      await this.scheduler.generateTasksForPlant(id, planTier);
    }

    const updated = await this.findOne(userId, id);
    return { ...updated, tasksRescheduled: shouldReschedule };
  }

  async remove(userId: string, id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id, userId },
      include: {
        journalEntries: { select: { photoUrl: true } },
        progressEntries: { select: { photoUrl: true } },
        diagnoses: { select: { imageUrl: true } },
        diagnosisConversations: {
          select: { messages: { select: { imageUrl: true } } },
        },
      },
    });
    if (!plant) throw new NotFoundException('Plant not found');
    await this.prisma.plant.delete({ where: { id } });
    const mediaUrls = [
      plant.imageUrl,
      ...plant.journalEntries.map((entry) => entry.photoUrl),
      ...plant.progressEntries.map((entry) => entry.photoUrl),
      ...plant.diagnoses.map((diagnosis) => diagnosis.imageUrl),
      ...plant.diagnosisConversations.flatMap((conversation) =>
        conversation.messages.map((message) => message.imageUrl),
      ),
    ].filter((url): url is string => Boolean(url));
    await Promise.all(mediaUrls.map((url) => this.upload.deleteByUrl(url).catch(() => {})));
    return { deleted: true };
  }

  async identify(userId: string, _planTier: PlanTier, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const claimed = await this.claimIdentifySlot(userId, user.planTier, {
      identifyCountThisMonth: user.identifyCountThisMonth,
      identifyCountResetAt: user.identifyCountResetAt,
    });

    let result;
    try {
      await this.imageModeration.assertImageAllowed(file, { feature: 'identify', userId });
      result = await this.plantNet.identify(file);
      if (!result) throw new NotFoundException('Could not identify plant');
    } catch (err) {
      if (claimed) await this.releaseIdentifySlot(userId);
      throw err;
    }

    const species = await this.findCatalogSpeciesMatch(result);

    if (species) {
      return {
        ...result,
        matchType: 'catalog',
        species,
        externalMatch: null,
      };
    }

    const candidate = {
      commonName: result.commonName,
      scientificName: result.scientificName,
      sunlight: 'Bright indirect light',
      wateringFreqDays: 7,
      toxicity: 'Unknown toxicity - verify before placing near pets or children',
      careNotes:
        'External identification pending user confirmation. Dr. Plant will use a safe care archetype until more specific care is verified.',
    };

    return {
      ...result,
      matchType: 'external',
      species: null,
      externalMatch: {
        provider: result.provider,
        providerMatchId: result.providerMatchId,
        commonName: result.commonName,
        scientificName: result.scientificName,
        confidence: result.confidence,
        careArchetype: resolveCareArchetype(candidate),
        integrationStatus: 'requires_confirmation',
      },
    };
  }

  async confirmExternalSpecies(userId: string, dto: ConfirmExternalSpeciesDto) {
    const commonName = dto.commonName.trim();
    const scientificName = dto.scientificName?.trim() || null;
    if (!commonName) {
      throw new HttpException('Species common name is required', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.findCatalogSpeciesMatch({
      commonName,
      scientificName: scientificName ?? commonName,
    });
    if (existing) {
      return {
        species: existing,
        created: false,
        matchType: 'catalog',
      };
    }

    const baseSpecies = {
      commonName,
      scientificName,
      sunlight: 'Bright indirect light',
      wateringFreqDays: 7,
      toxicity: 'Unknown toxicity - verify before placing near pets or children',
      phMin: 6,
      phMax: 7,
      careNotes:
        'User-confirmed external identification. Care starts from a safe archetype until Dr. Plant or a future catalog review adds species-specific notes.',
    };
    const metadata = {
      ...buildMetadataForSpecies(baseSpecies),
      externalSource: {
        provider: dto.provider,
        providerMatchId: dto.providerMatchId?.trim() || scientificName || commonName,
        confidence: dto.confidence,
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'user' as const,
        status: 'user_confirmed' as const,
      },
    };

    const species = await this.prisma.plantSpecies.create({
      data: {
        ...baseSpecies,
        metadataJson: serializeSpeciesMetadata(metadata),
      },
    });

    this.perenual.invalidateCacheForMutation();

    return {
      species,
      created: true,
      matchType: 'external_confirmed',
      careArchetype: resolveCareArchetype(baseSpecies),
    };
  }

  private async findCatalogSpeciesMatch(result: {
    commonName: string;
    scientificName: string;
  }) {
    const scientificName = result.scientificName?.trim();
    const commonName = result.commonName?.trim();
    if (!scientificName && !commonName) return null;
    return this.prisma.plantSpecies.findFirst({
      where: {
        OR: [
          ...(scientificName ? [{ scientificName }] : []),
          ...(commonName ? [{ commonName }] : []),
        ],
      },
    });
  }

  async uploadImage(userId: string, file: Express.Multer.File) {
    await this.imageModeration.assertImageAllowed(file, { feature: 'plant_upload', userId });
    const url = await this.upload.saveFile(file);
    return { url };
  }

  private async assertCanCreatePlant(userId: string, planTier: PlanTier) {
    if (this.isPremium(planTier)) return;
    const current = await this.prisma.plant.count({ where: { userId } });
    const limit = freePlanLimits().plants;
    if (current >= limit) {
      throw new HttpException({
        code: 'PLANT_LIMIT_REACHED',
        message: `Free accounts can track up to ${limit} plants. Upgrade to Premium for unlimited plants.`,
        limit,
        current,
        planTier,
        upgradePath: '/garden/subscription',
      }, HttpStatus.PAYMENT_REQUIRED);
    }
  }

  /**
   * Atomically reserves one identify slot for the current window, returning whether a
   * slot was claimed (false only for premium users, who are unlimited). The limit check
   * and the increment happen as a single conditional UPDATE so two concurrent requests
   * can't both read the same pre-increment count and both slip under the cap.
   */
  private async claimIdentifySlot(
    userId: string,
    planTier: PlanTier,
    usage: { identifyCountThisMonth: number; identifyCountResetAt: Date },
  ): Promise<boolean> {
    if (this.isPremium(planTier)) return false;

    const now = new Date();
    if (usage.identifyCountResetAt <= now) {
      const resetAt = new Date(now.getTime() + IDENTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
      // Guarded by the stale resetAt so a concurrent racer that already reset doesn't
      // stomp the count again.
      await this.prisma.user.updateMany({
        where: { id: userId, identifyCountResetAt: usage.identifyCountResetAt },
        data: { identifyCountThisMonth: 0, identifyCountResetAt: resetAt },
      });
    }

    const limit = freePlanLimits().identificationsPerWindow;
    const claimed = await this.prisma.user.updateMany({
      where: { id: userId, identifyCountThisMonth: { lt: limit } },
      data: { identifyCountThisMonth: { increment: 1 } },
    });

    if (claimed.count === 0) {
      const resetAt =
        usage.identifyCountResetAt <= now
          ? new Date(now.getTime() + IDENTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
          : usage.identifyCountResetAt;
      throw new HttpException({
        code: 'IDENTIFY_LIMIT_REACHED',
        message: `Free accounts include ${limit} plant identifications every ${IDENTIFY_WINDOW_DAYS} days. Upgrade to Premium for more.`,
        limit,
        current: limit,
        planTier,
        resetAt,
        upgradePath: '/garden/subscription',
      }, HttpStatus.PAYMENT_REQUIRED);
    }
    return true;
  }

  /** Releases a claimed identify slot when the identification attempt fails, so failed
   *  attempts don't count against the user's monthly quota. */
  private async releaseIdentifySlot(userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, identifyCountThisMonth: { gt: 0 } },
      data: { identifyCountThisMonth: { decrement: 1 } },
    });
  }

  private isPremium(planTier: PlanTier) {
    return (
      planTier === PlanTier.PREMIUM ||
      this.config.get<string>('ALL_USERS_PREMIUM')?.trim().toLowerCase() === 'true'
    );
  }

  private async planTierForUser(userId: string, fallback: PlanTier) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { planTier: true },
    });
    return user?.planTier ?? fallback;
  }
}
