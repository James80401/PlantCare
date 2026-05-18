import { Injectable } from '@nestjs/common';
import { PlanTier, PotSize, TaskStatus, TaskType } from '@prisma/client';
import {
  classifySpeciesForCare,
  inferGrowingEnvironment,
  shouldScheduleMist,
} from '../care-guides/growing-environment';
import { PrismaService } from '../prisma/prisma.service';

const DAYS_AHEAD = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ScheduleSuggestion {
  id: string;
  plantId: string;
  plantName: string;
  taskType: TaskType;
  title: string;
  explanation: string;
  adjustmentDays: number;
  affectedTaskCount: number;
  confidence: 'low' | 'medium' | 'high';
  reversible: boolean;
}

@Injectable()
export class SchedulerService {
  constructor(private prisma: PrismaService) {}

  potMultiplier(potSize: PotSize): number {
    switch (potSize) {
      case PotSize.SMALL:
        return 0.8;
      case PotSize.LARGE:
        return 1.2;
      default:
        return 1.0;
    }
  }

  isGrowingSeason(date: Date): boolean {
    const month = date.getMonth() + 1;
    return month >= 4 && month <= 9;
  }

  getWaterIntervalDays(wateringFreqDays: number, potSize: PotSize): number {
    return Math.max(2, Math.round(wateringFreqDays * this.potMultiplier(potSize)));
  }

  generateDates(start: Date, intervalDays: number, count: number): Date[] {
    const dates: Date[] = [];
    let current = new Date(start);
    for (let i = 0; i < count; i++) {
      dates.push(new Date(current));
      current = new Date(current);
      current.setDate(current.getDate() + intervalDays);
    }
    return dates;
  }

  private isEdibleOrHerb(category: ReturnType<typeof classifySpeciesForCare>): boolean {
    return category === 'herb' || category === 'vegetable' || category === 'fruit' || category === 'citrus';
  }

  private isPestProneSpecies(category: ReturnType<typeof classifySpeciesForCare>): boolean {
    return category !== 'cactus' && category !== 'succulent';
  }

  private canScheduleRepot(plant: { datePlanted: Date | null }): boolean {
    if (!plant.datePlanted) return true;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return plant.datePlanted <= sixMonthsAgo;
  }

  async generateTasksForPlant(plantId: string, _planTier?: PlanTier) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      include: { species: true, user: true },
    });
    if (!plant) return;

    await this.prisma.task.deleteMany({
      where: { plantId, status: TaskStatus.PENDING },
    });

    const now = new Date();
    const env = inferGrowingEnvironment(plant.location);
    const category = classifySpeciesForCare(plant.species);
    const isIndoor = env === 'indoor';

    const waterInterval = this.getWaterIntervalDays(
      plant.species.wateringFreqDays,
      plant.potSize,
    );
    const waterDates = this.generateDates(
      now,
      waterInterval,
      Math.ceil(DAYS_AHEAD / waterInterval),
    );

    const tasks: { plantId: string; taskType: TaskType; dueDate: Date }[] = waterDates.map(
      (dueDate) => ({ plantId, taskType: TaskType.WATER, dueDate }),
    );

    const pruneDates = this.generateDates(now, 30, Math.floor(DAYS_AHEAD / 30));
    tasks.push(
      ...pruneDates.map((dueDate) => ({ plantId, taskType: TaskType.PRUNE, dueDate })),
    );

    if (this.isGrowingSeason(now)) {
      const fertDates = this.generateDates(now, 30, Math.floor(DAYS_AHEAD / 30));
      tasks.push(
        ...fertDates.map((dueDate) => ({
          plantId,
          taskType: TaskType.FERTILIZE,
          dueDate,
        })),
      );
    }

    if (shouldScheduleMist(env, category)) {
      const mistDates = this.generateDates(now, 3, Math.floor(DAYS_AHEAD / 3));
      tasks.push(
        ...mistDates.slice(0, 10).map((dueDate) => ({
          plantId,
          taskType: TaskType.MIST,
          dueDate,
        })),
      );
    }

    const phInterval = this.isEdibleOrHerb(category) ? 90 : 180;
    if (phInterval <= DAYS_AHEAD) {
      const phDates = this.generateDates(now, phInterval, Math.floor(DAYS_AHEAD / phInterval));
      tasks.push(
        ...phDates.map((dueDate) => ({ plantId, taskType: TaskType.PH_TEST, dueDate })),
      );
    }

    const pestInterval = this.isGrowingSeason(now) ? 14 : 30;
    const pestDates = this.generateDates(now, pestInterval, Math.floor(DAYS_AHEAD / pestInterval));
    tasks.push(
      ...pestDates.map((dueDate) => ({ plantId, taskType: TaskType.PEST_CONTROL, dueDate })),
    );

    if (this.canScheduleRepot(plant)) {
      const repotDue = new Date(now);
      repotDue.setDate(repotDue.getDate() + 60);
      tasks.push({ plantId, taskType: TaskType.REPOT, dueDate: repotDue });
    }

    if (isIndoor) {
      const rotateDates = this.generateDates(now, 14, Math.floor(DAYS_AHEAD / 14));
      tasks.push(
        ...rotateDates.map((dueDate) => ({ plantId, taskType: TaskType.ROTATE, dueDate })),
      );

      const cleanDates = this.generateDates(now, 21, Math.floor(DAYS_AHEAD / 21));
      tasks.push(
        ...cleanDates.map((dueDate) => ({ plantId, taskType: TaskType.CLEAN_LEAVES, dueDate })),
      );
    }

    if (this.isPestProneSpecies(category)) {
      const inspectDates = this.generateDates(now, 7, Math.floor(DAYS_AHEAD / 7));
      tasks.push(
        ...inspectDates.map((dueDate) => ({
          plantId,
          taskType: TaskType.INSPECT_PESTS,
          dueDate,
        })),
      );
    }

    if (plant.species.wateringFreqDays <= 5) {
      const moistureDates = this.generateDates(now, 7, Math.floor(DAYS_AHEAD / 7));
      tasks.push(
        ...moistureDates.map((dueDate) => ({
          plantId,
          taskType: TaskType.CHECK_MOISTURE,
          dueDate,
        })),
      );
    }

    await this.prisma.task.createMany({ data: tasks });
  }

  async onTaskCompleted(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { plant: { include: { species: true, user: true } } },
    });
    if (!task) return;
    const completedAt = task.completedAt ?? new Date();

    let intervalDays = 7;
    switch (task.taskType) {
      case TaskType.WATER:
        intervalDays = this.getWaterIntervalDays(
          task.plant.species.wateringFreqDays,
          task.plant.potSize,
        );
        break;
      case TaskType.FERTILIZE:
        intervalDays = 30;
        break;
      case TaskType.MIST:
        intervalDays = 3;
        break;
      case TaskType.PRUNE:
        intervalDays = 30;
        break;
      case TaskType.PH_TEST:
        intervalDays = this.isEdibleOrHerb(classifySpeciesForCare(task.plant.species))
          ? 90
          : 180;
        break;
      case TaskType.PEST_CONTROL:
        intervalDays = this.isGrowingSeason(completedAt) ? 14 : 30;
        break;
      case TaskType.REPOT:
        intervalDays = 540;
        break;
      case TaskType.ROTATE:
        intervalDays = 14;
        break;
      case TaskType.CLEAN_LEAVES:
        intervalDays = 21;
        break;
      case TaskType.INSPECT_PESTS:
        intervalDays = 7;
        break;
      case TaskType.CHECK_MOISTURE:
        intervalDays = 7;
        break;
      case TaskType.HEALTH_CHECK:
        intervalDays = 7;
        break;
      default:
        intervalDays = 14;
    }

    const nextDue = new Date(completedAt);
    nextDue.setDate(nextDue.getDate() + intervalDays);

    if (task.taskType === TaskType.MIST) {
      const env = inferGrowingEnvironment(task.plant.location);
      const category = classifySpeciesForCare(task.plant.species);
      if (!shouldScheduleMist(env, category)) {
        return;
      }
    }

    await this.prisma.task.create({
      data: {
        plantId: task.plantId,
        taskType: task.taskType,
        dueDate: nextDue,
        status: TaskStatus.PENDING,
      },
    });
  }

  async postponeWateringForRain(plantId: string, days = 2) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    await this.prisma.task.updateMany({
      where: {
        plantId,
        taskType: TaskType.WATER,
        status: TaskStatus.PENDING,
        dueDate: { gte: tomorrow, lte: dayAfter },
      },
      data: {
        dueDate: new Date(dayAfter.getTime() + days * 24 * 60 * 60 * 1000),
      },
    });
  }

  async getScheduleSuggestionsForUser(userId: string): Promise<ScheduleSuggestion[]> {
    const since = new Date(Date.now() - 60 * MS_PER_DAY);
    const feedback = await this.prisma.taskFeedback.findMany({
      where: {
        userId,
        action: 'SKIP',
        createdAt: { gte: since },
        reason: { in: ['SOIL_STILL_WET', 'RAIN_HANDLED_WATERING'] },
      },
      include: {
        task: { include: { plant: { include: { species: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const suggestions: ScheduleSuggestion[] = [];
    const plantIds = new Set(feedback.map((item) => item.task.plantId));

    for (const plantId of plantIds) {
      const plantFeedback = feedback.filter((item) => item.task.plantId === plantId);
      const plant = plantFeedback[0]?.task.plant;
      if (!plant) continue;

      const wetWaterSkips = plantFeedback.filter(
        (item) => item.reason === 'SOIL_STILL_WET' && item.task.taskType === TaskType.WATER,
      ).length;
      if (wetWaterSkips >= 2) {
        const affectedTaskCount = await this.countUpcomingTasks(plantId, TaskType.WATER);
        if (affectedTaskCount > 0) {
          suggestions.push({
            id: `${plantId}:water-extend`,
            plantId,
            plantName: plant.nickname || plant.species.commonName,
            taskType: TaskType.WATER,
            title: 'Water less often',
            explanation:
              'You skipped watering because the soil was still wet multiple times. Shift the next few watering tasks 2 days later.',
            adjustmentDays: 2,
            affectedTaskCount,
            confidence: wetWaterSkips >= 3 ? 'high' : 'medium',
            reversible: true,
          });
        }
      }

      const rainWaterSkips = plantFeedback.filter(
        (item) => item.reason === 'RAIN_HANDLED_WATERING' && item.task.taskType === TaskType.WATER,
      ).length;
      const env = inferGrowingEnvironment(plant.location);
      if (rainWaterSkips > 0 && env === 'outdoor') {
        const affectedTaskCount = await this.countUpcomingTasks(plantId, TaskType.WATER, 1);
        if (affectedTaskCount > 0) {
          suggestions.push({
            id: `${plantId}:water-rain-delay`,
            plantId,
            plantName: plant.nickname || plant.species.commonName,
            taskType: TaskType.WATER,
            title: 'Delay the next outdoor watering',
            explanation:
              'Rain recently covered watering for this outdoor plant. Delay the next water task by 2 days.',
            adjustmentDays: 2,
            affectedTaskCount,
            confidence: 'medium',
            reversible: true,
          });
        }
      }
    }

    if (!this.isGrowingSeason(new Date())) {
      const dormantFertilizerTasks = await this.prisma.task.findMany({
        where: {
          status: TaskStatus.PENDING,
          taskType: TaskType.FERTILIZE,
          plant: { userId },
        },
        include: { plant: { include: { species: true } } },
        orderBy: { dueDate: 'asc' },
        take: 10,
      });

      for (const task of dormantFertilizerTasks) {
        suggestions.push({
          id: `${task.plantId}:fertilize-dormant-delay`,
          plantId: task.plantId,
          plantName: task.plant.nickname || task.plant.species.commonName,
          taskType: TaskType.FERTILIZE,
          title: 'Pause fertilizer during dormancy',
          explanation:
            'This fertilizer task falls outside the main growing season. Delay the next fertilizer reminder by 30 days.',
          adjustmentDays: 30,
          affectedTaskCount: 1,
          confidence: 'medium',
          reversible: true,
        });
      }
    }

    return suggestions.slice(0, 6);
  }

  async applyScheduleSuggestion(userId: string, suggestionId: string) {
    const [plantId, kind] = suggestionId.split(':');
    const plant = await this.prisma.plant.findFirst({ where: { id: plantId, userId } });
    if (!plant) return { applied: false, updatedTasks: [], message: 'Plant not found.' };

    if (kind === 'water-extend') {
      const updatedTasks = await this.shiftNextTasks(plantId, TaskType.WATER, 2, 3);
      return {
        applied: updatedTasks.length > 0,
        updatedTasks,
        message: `Shifted ${updatedTasks.length} watering task${updatedTasks.length === 1 ? '' : 's'} 2 days later.`,
      };
    }

    if (kind === 'water-rain-delay') {
      const updatedTasks = await this.shiftNextTasks(plantId, TaskType.WATER, 2, 1);
      return {
        applied: updatedTasks.length > 0,
        updatedTasks,
        message: `Delayed the next watering task by 2 days.`,
      };
    }

    if (kind === 'fertilize-dormant-delay') {
      const updatedTasks = await this.shiftNextTasks(plantId, TaskType.FERTILIZE, 30, 1);
      return {
        applied: updatedTasks.length > 0,
        updatedTasks,
        message: `Delayed the next fertilizer task by 30 days.`,
      };
    }

    return { applied: false, updatedTasks: [], message: 'Suggestion is no longer available.' };
  }

  private async countUpcomingTasks(plantId: string, taskType: TaskType, take = 3) {
    const tasks = await this.prisma.task.findMany({
      where: {
        plantId,
        taskType,
        status: TaskStatus.PENDING,
        dueDate: { gte: new Date() },
      },
      select: { id: true },
      orderBy: { dueDate: 'asc' },
      take,
    });
    return tasks.length;
  }

  private async shiftNextTasks(
    plantId: string,
    taskType: TaskType,
    days: number,
    take: number,
  ) {
    const tasks = await this.prisma.task.findMany({
      where: {
        plantId,
        taskType,
        status: TaskStatus.PENDING,
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take,
    });

    const updated = [];
    for (const task of tasks) {
      const nextDue = new Date(task.dueDate);
      nextDue.setDate(nextDue.getDate() + days);
      updated.push(
        await this.prisma.task.update({
          where: { id: task.id },
          data: { dueDate: nextDue },
        }),
      );
    }
    return updated;
  }
}
