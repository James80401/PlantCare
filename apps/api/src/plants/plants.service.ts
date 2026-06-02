import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanTier } from '@prisma/client';
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
import { CreatePlantDto } from './dto/create-plant.dto';
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
            feedback: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
        journalEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
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

    const [journalEntries, tasks, diagnoses] = await Promise.all([
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
          feedback: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.diagnosis.findMany({
        where: { plantId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return buildPlantTimeline(journalEntries, tasks, diagnoses);
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

    if (imageChanged && plant.imageUrl && dto.imageUrl !== plant.imageUrl) {
      await this.upload.deleteByUrl(plant.imageUrl).catch(() => {});
    }

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

    const shouldReschedule = locationChanged || potSizeChanged;
    if (shouldReschedule) {
      await this.scheduler.generateTasksForPlant(id, planTier);
    }

    const updated = await this.findOne(userId, id);
    return { ...updated, tasksRescheduled: shouldReschedule };
  }

  async remove(userId: string, id: string) {
    const plant = await this.prisma.plant.findFirst({ where: { id, userId } });
    if (!plant) throw new NotFoundException('Plant not found');
    if (plant.imageUrl) await this.upload.deleteByUrl(plant.imageUrl).catch(() => {});
    await this.prisma.plant.delete({ where: { id } });
    return { deleted: true };
  }

  async identify(userId: string, _planTier: PlanTier, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException();
    const identifyCount = await this.assertCanIdentify(userId, user.planTier, {
      identifyCountThisMonth: user.identifyCountThisMonth,
      identifyCountResetAt: user.identifyCountResetAt,
    });

    await this.imageModeration.assertImageAllowed(file, { feature: 'identify', userId });

    const result = await this.plantNet.identify(file);
    if (!result) throw new NotFoundException('Could not identify plant');

    await this.prisma.user.update({
      where: { id: userId },
      data: { identifyCountThisMonth: identifyCount + 1 },
    });

    let species = await this.prisma.plantSpecies.findFirst({
      where: {
        OR: [
          { scientificName: result.scientificName },
          { commonName: result.commonName },
        ],
      },
    });

    if (!species) {
      species = await this.prisma.plantSpecies.create({
        data: {
          commonName: result.commonName,
          scientificName: result.scientificName,
          wateringFreqDays: 7,
        },
      });
    }

    return { ...result, species };
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

  private async assertCanIdentify(
    userId: string,
    planTier: PlanTier,
    usage: { identifyCountThisMonth: number; identifyCountResetAt: Date },
  ) {
    if (this.isPremium(planTier)) return usage.identifyCountThisMonth;
    const now = new Date();
    const resetAt =
      usage.identifyCountResetAt <= now
        ? new Date(now.getTime() + IDENTIFY_WINDOW_DAYS * 24 * 60 * 60 * 1000)
        : usage.identifyCountResetAt;
    const current = usage.identifyCountResetAt <= now ? 0 : usage.identifyCountThisMonth;
    if (usage.identifyCountResetAt <= now) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { identifyCountThisMonth: 0, identifyCountResetAt: resetAt },
      });
    }
    const limit = freePlanLimits().identificationsPerWindow;
    if (current >= limit) {
      throw new HttpException({
        code: 'IDENTIFY_LIMIT_REACHED',
        message: `Free accounts include ${limit} plant identifications every ${IDENTIFY_WINDOW_DAYS} days. Upgrade to Premium for more.`,
        limit,
        current,
        planTier,
        resetAt,
        upgradePath: '/garden/subscription',
      }, HttpStatus.PAYMENT_REQUIRED);
    }
    return current;
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
