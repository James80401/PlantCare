import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanTier } from '@prisma/client';
import { CareGuidesService } from '../care-guides/care-guides.service';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { UploadService } from '../upload/upload.service';
import { sharedPlantInclude, userCanViewPlantTasks } from '../gardens/task-access';
import { PlantNetService } from './plantnet.service';
import { PerenualService } from '../species/perenual.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantsService {
  constructor(
    private prisma: PrismaService,
    private careGuides: CareGuidesService,
    private scheduler: SchedulerService,
    private upload: UploadService,
    private plantNet: PlantNetService,
    private perenual: PerenualService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.plant.findMany({
      where: { userId },
      include: {
        species: true,
        tasks: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const plant = await this.prisma.plant.findFirst({
      where: { id },
      include: {
        species: true,
        tasks: { orderBy: { dueDate: 'asc' }, take: 20 },
        journalEntries: { orderBy: { createdAt: 'desc' }, take: 10 },
        diagnoses: { orderBy: { createdAt: 'desc' }, take: 5 },
        ...sharedPlantInclude,
      },
    });
    if (!plant || !userCanViewPlantTasks(userId, plant)) {
      throw new NotFoundException('Plant not found');
    }
    const careOverview = this.careGuides.buildPlantCareOverview(plant);
    return { ...plant, careOverview };
  }

  async create(userId: string, planTier: PlanTier, dto: CreatePlantDto) {
    await this.perenual.getOrFetchById(dto.speciesId);

    const plant = await this.prisma.plant.create({
      data: {
        userId,
        speciesId: dto.speciesId,
        nickname: dto.nickname,
        location: dto.location,
        potSize: dto.potSize,
        datePlanted: dto.datePlanted ? new Date(dto.datePlanted) : undefined,
        imageUrl: dto.imageUrl,
        notes: dto.notes,
      },
      include: { species: true },
    });

    await this.scheduler.generateTasksForPlant(plant.id, planTier);
    return this.findOne(userId, plant.id);
  }

  async update(userId: string, id: string, planTier: PlanTier, dto: UpdatePlantDto) {
    const plant = await this.prisma.plant.findFirst({ where: { id, userId } });
    if (!plant) throw new NotFoundException('Plant not found');

    const locationChanged =
      dto.location !== undefined && dto.location.trim() !== (plant.location ?? '').trim();

    await this.prisma.plant.update({
      where: { id },
      data: {
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    if (locationChanged) {
      await this.scheduler.generateTasksForPlant(id, planTier);
    }

    const updated = await this.findOne(userId, id);
    return { ...updated, tasksRescheduled: locationChanged };
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

    const result = await this.plantNet.identify(file);
    if (!result) throw new NotFoundException('Could not identify plant');

    await this.prisma.user.update({
      where: { id: userId },
      data: { identifyCountThisMonth: { increment: 1 } },
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

  async uploadImage(file: Express.Multer.File) {
    const url = await this.upload.saveFile(file);
    return { url };
  }
}
