import { Injectable } from '@nestjs/common';
import { PlanTier, PotSize, TaskStatus, TaskType } from '@prisma/client';
import {
  classifySpeciesForCare,
  inferGrowingEnvironment,
  shouldScheduleMist,
} from '../care-guides/growing-environment';
import { PrismaService } from '../prisma/prisma.service';

const DAYS_AHEAD = 90;

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

  async generateTasksForPlant(plantId: string, planTier: PlanTier) {
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
      include: { species: true, user: true },
    });
    if (!plant) return;

    await this.prisma.task.deleteMany({
      where: { plantId, status: TaskStatus.PENDING },
    });

    const now = new Date();
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

    if (planTier === PlanTier.PREMIUM) {
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
      const env = inferGrowingEnvironment(plant.location);
      const category = classifySpeciesForCare(plant.species);
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
}
