import { Injectable, NotFoundException } from '@nestjs/common';
import { PlantLifeStage, PlanTier, PotSize, TaskStatus, TaskType } from '@prisma/client';
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
const RAIN_DELAY_THRESHOLD = 0.6;
const HEAT_STRESS_C = 35;
const FROST_RISK_C = 0;

type ForecastDay = {
  date?: string;
  tempMinC?: number;
  tempMaxC?: number;
  rainProbability?: number;
};

type WeatherAdvicePayload = {
  summary?: {
    days?: ForecastDay[];
  };
};

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

  private parseWeatherPayload(payload?: string | null): WeatherAdvicePayload | null {
    if (!payload) return null;
    try {
      return JSON.parse(payload) as WeatherAdvicePayload;
    } catch {
      return null;
    }
  }

  private isOutdoorLike(location: string | null): boolean {
    const env = inferGrowingEnvironment(location);
    return env === 'outdoor' || env === 'semi_outdoor';
  }

  private getForecastDays(weatherPayload: WeatherAdvicePayload | null): ForecastDay[] {
    return Array.isArray(weatherPayload?.summary?.days)
      ? weatherPayload.summary.days.slice(0, 3)
      : [];
  }

  private forecastDate(day: ForecastDay | undefined, fallbackOffsetDays: number): Date {
    if (day?.date) {
      const parsed = new Date(`${day.date}T12:00:00.000Z`);
      if (!Number.isNaN(parsed.getTime())) return startOfDay(parsed);
    }
    return startOfDay(addDays(new Date(), fallbackOffsetDays));
  }

  private formatCelsius(value: number): string {
    return `${Math.round(value)}C`;
  }

  private getMaxRainProbability(weatherPayload: WeatherAdvicePayload | null): number | undefined {
    const days = this.getForecastDays(weatherPayload);
    const rainTomorrow = days[1]?.rainProbability;
    const rainNext = days[2]?.rainProbability;
    if (typeof rainTomorrow === 'number' && typeof rainNext === 'number') {
      return Math.max(rainTomorrow, rainNext);
    }
    return typeof rainTomorrow === 'number' ? rainTomorrow : rainNext;
  }

  private getHeatStressDay(weatherPayload: WeatherAdvicePayload | null) {
    return this.getForecastDays(weatherPayload)
      .map((day, index) => ({ day, index }))
      .find(({ day }) => typeof day.tempMaxC === 'number' && day.tempMaxC >= HEAT_STRESS_C);
  }

  private getFrostRiskDay(weatherPayload: WeatherAdvicePayload | null) {
    return this.getForecastDays(weatherPayload)
      .map((day, index) => ({ day, index }))
      .find(({ day }) => typeof day.tempMinC === 'number' && day.tempMinC <= FROST_RISK_C);
  }

  private isVeryYoungPlant(lifeStage?: PlantLifeStage | null): boolean {
    return (
      lifeStage === PlantLifeStage.SEED ||
      lifeStage === PlantLifeStage.SPROUT ||
      lifeStage === PlantLifeStage.SEEDLING
    );
  }

  private canScheduleFertilizer(plant: { lifeStage?: PlantLifeStage | null }): boolean {
    return !this.isVeryYoungPlant(plant.lifeStage);
  }

  private canScheduleRepot(plant: { datePlanted: Date | null; lifeStage?: PlantLifeStage | null }): boolean {
    if (this.isVeryYoungPlant(plant.lifeStage)) return false;
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

    if (this.isGrowingSeason(now) && this.canScheduleFertilizer(plant)) {
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

    const moistureInterval = this.isVeryYoungPlant(plant.lifeStage)
      ? 3
      : plant.lifeStage === PlantLifeStage.YOUNG_PLANT
        ? 5
        : 7;
    if (this.isVeryYoungPlant(plant.lifeStage) || plant.lifeStage === PlantLifeStage.YOUNG_PLANT || plant.species.wateringFreqDays <= 5) {
      const moistureDates = this.generateDates(now, moistureInterval, Math.floor(DAYS_AHEAD / moistureInterval));
      tasks.push(
        ...moistureDates.map((dueDate) => ({
          plantId,
          taskType: TaskType.CHECK_MOISTURE,
          dueDate,
        })),
      );
    }

    // Denormalize the plant's home garden onto each task for efficient garden-level
    // task views. plant.gardenId is always set (required on Plant).
    await this.prisma.task.createMany({
      data: tasks.map((t) => ({ ...t, gardenId: plant.gardenId })),
    });
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
        lifeStage: task.plant.lifeStage,
        approximateAgeMonths: task.plant.approximateAgeMonths,
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
        intervalDays = 14;
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
        gardenId: task.gardenId,
        taskType: task.taskType,
        dueDate: nextDue,
        status: TaskStatus.PENDING,
      },
    });
  }

  async postponeWateringForRain(plantId: string, days = 2) {
    await this.postponeWateringForRainAcrossPlants([plantId], days);
  }

  /**
   * Shift pending WATER tasks (due tomorrow or the day after) forward by `days`,
   * for any number of plants, in a single query + single batched transaction.
   *
   * Replaces the former per-plant → per-task sequential-await pattern (an N×M N+1).
   * Note: the old per-task floor-clamp to start-of-today is intentionally dropped —
   * the query window is `>= tomorrow` and `days >= 2`, so the shifted date is always
   * well past today; the clamp was dead code for this filter.
   */
  private async postponeWateringForRainAcrossPlants(plantIds: string[], days = 2) {
    if (plantIds.length === 0) return;
    const now = new Date();
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));

    const tasks = await this.prisma.task.findMany({
      where: {
        plantId: { in: plantIds },
        taskType: TaskType.WATER,
        status: TaskStatus.PENDING,
        dueDate: { gte: tomorrow, lte: dayAfter },
      },
      select: { id: true, dueDate: true },
    });
    if (tasks.length === 0) return;

    const updates = tasks.map((t) => {
      const nextDue = new Date(t.dueDate);
      nextDue.setDate(nextDue.getDate() + days);
      return this.prisma.task.update({
        where: { id: t.id },
        data: { dueDate: nextDue },
      });
    });

    // One round-trip, atomic, instead of N sequential awaits.
    await this.prisma.$transaction(updates);
  }

  async autoPostponeOutdoorWateringFromWeather(userId: string, days = 2, rainThreshold = 0.6) {
    const today = startOfDay(new Date()).toISOString();
    if (this.weatherPostponeRunByUser.get(userId) === today) return;
    this.weatherPostponeRunByUser.set(userId, today);
    this.trimWeatherPostponeMapIfStale(today);

    const weatherCache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
    const weatherPayload = this.parseWeatherPayload(weatherCache?.payload);
    const maxRainProbability = this.getMaxRainProbability(weatherPayload);
    if (typeof maxRainProbability !== 'number' || maxRainProbability < rainThreshold) return;

    const plants = await this.prisma.plant.findMany({
      where: { userId },
      select: { id: true, location: true },
    });

    const outdoorPlantIds = plants.filter((p) => this.isOutdoorLike(p.location)).map((p) => p.id);

    await this.postponeWateringForRainAcrossPlants(outdoorPlantIds, days);
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
    const weatherPayload = this.parseWeatherPayload(weatherCache?.payload);
    const maxRainProbability = this.getMaxRainProbability(weatherPayload);
    const shouldRainDelay =
      typeof maxRainProbability === 'number' && maxRainProbability >= RAIN_DELAY_THRESHOLD;
    const heatStress = this.getHeatStressDay(weatherPayload);
    const frostRisk = this.getFrostRiskDay(weatherPayload);

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
        if (!this.isOutdoorLike(p.location)) continue;
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

    if (heatStress || frostRisk) {
      const eligiblePlants = await this.prisma.plant.findMany({
        where: { userId },
        select: {
          id: true,
          nickname: true,
          location: true,
          species: { select: { commonName: true } },
        },
      });

      for (const p of eligiblePlants) {
        if (!this.isOutdoorLike(p.location)) continue;

        if (heatStress) {
          const dueDate = this.forecastDate(heatStress.day, heatStress.index);
          const affectedTaskCount = await this.countPendingTasksOnDate(
            p.id,
            TaskType.CHECK_MOISTURE,
            dueDate,
          );
          const suggestionId = `${p.id}:heat-moisture-check`;
          if (affectedTaskCount === 0 && !suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
              plantId: p.id,
              plantName: p.nickname || p.species.commonName,
              taskType: TaskType.CHECK_MOISTURE,
              title: 'Add heat stress moisture check',
              explanation: `Highs near ${this.formatCelsius(
                heatStress.day.tempMaxC!,
              )} are forecast soon. Add a moisture check before the heat peak so you can water or shade only if needed.`,
              adjustmentDays: 0,
              affectedTaskCount: 1,
              confidence: 'medium',
              reversible: true,
            });
          }
        }

        if (frostRisk) {
          const dueDate = this.forecastDate(frostRisk.day, frostRisk.index);
          const affectedTaskCount = await this.countPendingTasksOnDate(
            p.id,
            TaskType.HEALTH_CHECK,
            dueDate,
          );
          const suggestionId = `${p.id}:frost-protection-check`;
          if (affectedTaskCount === 0 && !suggestionIds.has(suggestionId)) {
            suggestionIds.add(suggestionId);
            suggestions.push({
              id: suggestionId,
              plantId: p.id,
              plantName: p.nickname || p.species.commonName,
              taskType: TaskType.HEALTH_CHECK,
              title: 'Add frost protection check',
              explanation: `Lows near ${this.formatCelsius(
                frostRisk.day.tempMinC!,
              )} are forecast soon. Add a protection check so outdoor pots can be moved, covered, or sheltered before the coldest night.`,
              adjustmentDays: 0,
              affectedTaskCount: 1,
              confidence: 'high',
              reversible: true,
            });
          }
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

    if (kind === 'heat-moisture-check') {
      const weatherCache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
      const heatStress = this.getHeatStressDay(this.parseWeatherPayload(weatherCache?.payload));
      const dueDate = heatStress
        ? this.forecastDate(heatStress.day, heatStress.index)
        : startOfDay(new Date());
      const created = await this.createOneTimeTaskIfMissing(
        plantId,
        plant.gardenId,
        TaskType.CHECK_MOISTURE,
        dueDate,
      );
      return {
        applied: Boolean(created),
        updatedTasks: created ? [created] : [],
        message: created
          ? 'Added a heat stress moisture check.'
          : 'A heat stress moisture check is already pending.',
      };
    }

    if (kind === 'frost-protection-check') {
      const weatherCache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
      const frostRisk = this.getFrostRiskDay(this.parseWeatherPayload(weatherCache?.payload));
      const dueDate = frostRisk
        ? this.forecastDate(frostRisk.day, frostRisk.index)
        : startOfDay(new Date());
      const created = await this.createOneTimeTaskIfMissing(
        plantId,
        plant.gardenId,
        TaskType.HEALTH_CHECK,
        dueDate,
      );
      return {
        applied: Boolean(created),
        updatedTasks: created ? [created] : [],
        message: created
          ? 'Added a frost protection check.'
          : 'A frost protection check is already pending.',
      };
    }

    return { applied: false, updatedTasks: [], message: 'Suggestion is no longer available.' };
  }

  private async countPendingTasksOnDate(plantId: string, taskType: TaskType, date: Date) {
    const start = startOfDay(date);
    const end = addDays(start, 1);
    const tasks = await this.prisma.task.findMany({
      where: {
        plantId,
        taskType,
        status: TaskStatus.PENDING,
        dueDate: { gte: start, lt: end },
      },
      select: { id: true },
      take: 1,
    });
    return tasks.length;
  }

  private async createOneTimeTaskIfMissing(
    plantId: string,
    gardenId: string | null,
    taskType: TaskType,
    dueDate: Date,
  ) {
    const existing = await this.countPendingTasksOnDate(plantId, taskType, dueDate);
    if (existing > 0) return null;
    return this.prisma.task.create({
      data: {
        plantId,
        gardenId,
        taskType,
        dueDate,
        status: TaskStatus.PENDING,
      },
    });
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
