import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanTier, PotSize, TaskStatus, TaskType } from '@prisma/client';
import { addDays, startOfDay, subDays } from 'date-fns';
import {
  buildScheduleExplanation,
  type ScheduleExplanation,
} from './schedule-explanation';
import {
  classifySpeciesForCare,
  inferGrowingEnvironment,
  shouldScheduleMist,
} from '../care-guides/growing-environment';
import { PrismaService } from '../prisma/prisma.service';
import { TASK_COMPLETE_REASONS } from '../tasks/dto/complete-task-feedback.dto';

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
  private weatherPostponeRunByUser = new Map<string, string>();
  private weatherPostponeMapLastTrimKey: string | null = null;

  constructor(private prisma: PrismaService) {}

  /**
   * Drop entries from previous days so the dedup map can't grow unbounded.
   * Cheap O(N) sweep, gated to run at most once per calendar day per process.
   */
  private trimWeatherPostponeMapIfStale(todayKey: string): void {
    if (this.weatherPostponeMapLastTrimKey === todayKey) return;
    this.weatherPostponeMapLastTrimKey = todayKey;
    for (const [userId, dayKey] of this.weatherPostponeRunByUser) {
      if (dayKey !== todayKey) this.weatherPostponeRunByUser.delete(userId);
    }
  }

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

  async getScheduleExplanationForTask(
    userId: string,
    taskId: string,
  ): Promise<ScheduleExplanation> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, plant: { userId } },
      include: { plant: { include: { species: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const recentWetSoilSkips =
      task.taskType === TaskType.WATER
        ? await this.prisma.taskFeedback.count({
            where: {
              userId,
              action: 'SKIP',
              reason: 'SOIL_STILL_WET',
              createdAt: { gte: subDays(new Date(), 60) },
              task: { plantId: task.plantId, taskType: TaskType.WATER },
            },
          })
        : 0;

    return buildScheduleExplanation({
      taskType: task.taskType,
      dueDate: task.dueDate,
      plant: {
        location: task.plant.location ?? 'Living Room',
        potSize: task.plant.potSize,
        datePlanted: task.plant.datePlanted,
      },
      species: task.plant.species,
      waterIntervalDays: this.getWaterIntervalDays(
        task.plant.species.wateringFreqDays,
        task.plant.potSize,
      ),
      isGrowingSeason: this.isGrowingSeason(task.dueDate),
      recentWetSoilSkips,
    });
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
    const now = new Date();
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));

    const tasks = await this.prisma.task.findMany({
      where: {
        plantId,
        taskType: TaskType.WATER,
        status: TaskStatus.PENDING,
        dueDate: { gte: tomorrow, lte: dayAfter },
      },
      select: { id: true, dueDate: true },
    });

    const minDue = startOfDay(now);
    for (const t of tasks) {
      const nextDue = new Date(t.dueDate);
      nextDue.setDate(nextDue.getDate() + days);
      if (nextDue.getTime() < minDue.getTime()) nextDue.setTime(minDue.getTime());
      await this.prisma.task.update({
        where: { id: t.id },
        data: { dueDate: nextDue },
      });
    }
  }

  async autoPostponeOutdoorWateringFromWeather(userId: string, days = 2, rainThreshold = 0.6) {
    const today = startOfDay(new Date()).toISOString();
    if (this.weatherPostponeRunByUser.get(userId) === today) return;
    this.weatherPostponeRunByUser.set(userId, today);
    this.trimWeatherPostponeMapIfStale(today);

    const weatherCache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
    const weatherPayload = weatherCache?.payload ? (JSON.parse(weatherCache.payload) as any) : null;
    const rainTomorrow = weatherPayload?.summary?.days?.[1]?.rainProbability as number | undefined;
    const rainNext = weatherPayload?.summary?.days?.[2]?.rainProbability as number | undefined;
    const maxRainProbability =
      rainTomorrow != null && rainNext != null ? Math.max(rainTomorrow, rainNext) : rainTomorrow ?? rainNext;
    if (typeof maxRainProbability !== 'number' || maxRainProbability < rainThreshold) return;

    const plants = await this.prisma.plant.findMany({
      where: { userId },
      select: { id: true, location: true },
    });

    for (const p of plants) {
      const env = inferGrowingEnvironment(p.location);
      if (env !== 'outdoor' && env !== 'semi_outdoor') continue;
      await this.postponeWateringForRain(p.id, days);
    }
  }

  async getScheduleSuggestionsForUser(userId: string): Promise<ScheduleSuggestion[]> {
    const since = new Date(Date.now() - 60 * MS_PER_DAY);
    const now = new Date();
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));
    const feedback = await this.prisma.taskFeedback.findMany({
      where: {
        userId,
        createdAt: { gte: since },
        OR: [
          {
            action: 'SKIP',
            reason: { in: ['SOIL_STILL_WET', 'RAIN_HANDLED_WATERING'] },
          },
          {
            action: 'COMPLETE',
            reason: { in: [...TASK_COMPLETE_REASONS] },
          },
        ],
      },
      include: {
        task: { include: { plant: { include: { species: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const suggestions: ScheduleSuggestion[] = [];
    const plantIds = new Set(feedback.map((item) => item.task.plantId));
    const suggestionIds = new Set<string>();

    const weatherCache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
    const weatherPayload = weatherCache?.payload ? (JSON.parse(weatherCache.payload) as any) : null;
    const rainTomorrow = weatherPayload?.summary?.days?.[1]?.rainProbability as number | undefined;
    const rainNext = weatherPayload?.summary?.days?.[2]?.rainProbability as number | undefined;
    const maxRainProbability =
      rainTomorrow != null && rainNext != null ? Math.max(rainTomorrow, rainNext) : rainTomorrow ?? rainNext;
    const shouldRainDelay = typeof maxRainProbability === 'number' && maxRainProbability >= 0.6;

    for (const plantId of plantIds) {
      const plantFeedback = feedback.filter((item) => item.task.plantId === plantId);
      const plant = plantFeedback[0]?.task.plant;
      if (!plant) continue;

      const wetWaterSkips = plantFeedback.filter(
        (item) => item.action === 'SKIP' && item.reason === 'SOIL_STILL_WET' && item.task.taskType === TaskType.WATER,
      ).length;
      if (wetWaterSkips >= 2) {
        const affectedTaskCount = await this.countUpcomingTasks(plantId, TaskType.WATER);
        if (affectedTaskCount > 0) {
          const suggestionId = `${plantId}:water-extend`;
          if (!suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
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
      }

      const rainWaterSkips = plantFeedback.filter(
        (item) =>
          item.action === 'SKIP' &&
          item.reason === 'RAIN_HANDLED_WATERING' &&
          item.task.taskType === TaskType.WATER,
      ).length;
      const env = inferGrowingEnvironment(plant.location);
      if (rainWaterSkips > 0 && env === 'outdoor') {
        const affectedTasks = await this.prisma.task.findMany({
          where: {
            plantId,
            taskType: TaskType.WATER,
            status: TaskStatus.PENDING,
            dueDate: { gte: tomorrow, lte: dayAfter },
          },
          select: { id: true },
        });
        const affectedTaskCount = affectedTasks.length;
        if (affectedTaskCount > 0) {
          const suggestionId = `${plantId}:water-rain-delay`;
          if (!suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
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

      const drySoilCompletions = plantFeedback.filter(
        (item) =>
          item.action === 'COMPLETE' &&
          item.reason === 'SOIL_VERY_DRY' &&
          item.task.taskType === TaskType.WATER,
      ).length;
      const stressedCompletions = plantFeedback.filter(
        (item) =>
          item.action === 'COMPLETE' &&
          item.reason === 'PLANT_LOOKS_STRESSED' &&
          item.task.taskType === TaskType.WATER,
      ).length;

      if (drySoilCompletions >= 2) {
        const affectedTaskCount = await this.countUpcomingTasks(plantId, TaskType.WATER);
        if (affectedTaskCount > 0) {
          const suggestionId = `${plantId}:water-accelerate`;
          if (!suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
              plantId,
              plantName: plant.nickname || plant.species.commonName,
              taskType: TaskType.WATER,
              title: 'Water more often',
              explanation:
                'You completed watering because the soil was very dry multiple times recently. Shift the next few watering tasks 2 days earlier.',
              adjustmentDays: -2,
              affectedTaskCount,
              confidence: drySoilCompletions >= 3 ? 'high' : 'medium',
              reversible: true,
            });
          }
        }
      } else if (stressedCompletions >= 2) {
        const affectedTaskCount = await this.countUpcomingTasks(plantId, TaskType.WATER);
        if (affectedTaskCount > 0) {
          const suggestionId = `${plantId}:water-accelerate`;
          if (!suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
              plantId,
              plantName: plant.nickname || plant.species.commonName,
              taskType: TaskType.WATER,
              title: 'Check watering cadence',
              explanation:
                'You completed watering because your plant looked stressed multiple times recently. Shift the next few watering tasks 1 day earlier.',
              adjustmentDays: -1,
              affectedTaskCount,
              confidence: stressedCompletions >= 3 ? 'high' : 'medium',
              reversible: true,
            });
          }
        }
      }
    }

    if (shouldRainDelay) {
      const eligiblePlants = await this.prisma.plant.findMany({
        where: { userId },
        select: {
          id: true,
          nickname: true,
          location: true,
          species: { select: { commonName: true } },
        },
      });
      const rainPct = Math.round(maxRainProbability * 100);
      for (const p of eligiblePlants) {
        const env = inferGrowingEnvironment(p.location);
        if (env !== 'outdoor') continue;
        const affectedTasks = await this.prisma.task.findMany({
          where: {
            plantId: p.id,
            taskType: TaskType.WATER,
            status: TaskStatus.PENDING,
            dueDate: { gte: tomorrow, lte: dayAfter },
          },
          select: { id: true },
        });
        const affectedTaskCount = affectedTasks.length;
        if (affectedTaskCount <= 0) continue;

        const suggestionId = `${p.id}:water-rain-delay`;
        if (suggestionIds.has(suggestionId)) continue;
        suggestionIds.add(suggestionId);
        suggestions.push({
          id: suggestionId,
          plantId: p.id,
          plantName: p.nickname || p.species.commonName,
          taskType: TaskType.WATER,
          title: 'Delay outdoor watering (forecast)',
          explanation: `Forecast suggests rain (~${rainPct}% chance over the next couple days). Delay the next outdoor watering by 2 days.`,
          adjustmentDays: 2,
          affectedTaskCount,
          confidence: 'medium',
          reversible: true,
        });
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
      const now = new Date();
      const tomorrow = startOfDay(addDays(now, 1));
      const dayAfter = startOfDay(addDays(now, 2));
      const pending = await this.prisma.task.findMany({
        where: {
          plantId,
          taskType: TaskType.WATER,
          status: TaskStatus.PENDING,
          dueDate: { gte: tomorrow, lte: dayAfter },
        },
        select: { id: true },
      });
      if (pending.length <= 0) {
        return {
          applied: false,
          updatedTasks: [],
          message: 'Outdoor watering was already delayed for the forecast.',
        };
      }
      const updatedTasks = await this.shiftNextTasks(plantId, TaskType.WATER, 2, 1);
      return {
        applied: updatedTasks.length > 0,
        updatedTasks,
        message: `Delayed the next watering task by 2 days.`,
      };
    }

    if (kind === 'water-accelerate') {
      const updatedTasks = await this.shiftNextTasks(plantId, TaskType.WATER, -2, 3);
      return {
        applied: updatedTasks.length > 0,
        updatedTasks,
        message: `Shifted the next watering tasks earlier to match your feedback.`,
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
    const clampToToday = days < 0;
    const minDue = clampToToday ? startOfDay(new Date()) : null;
    for (const task of tasks) {
      const nextDue = new Date(task.dueDate);
      nextDue.setDate(nextDue.getDate() + days);
      if (minDue && nextDue.getTime() < minDue.getTime()) {
        nextDue.setTime(minDue.getTime());
      }
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
