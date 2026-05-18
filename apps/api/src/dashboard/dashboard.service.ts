import { Injectable } from '@nestjs/common';
import { addDays, format, startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { WeatherService } from '../weather/weather.service';
import {
  buildAttention,
  buildWeekPreview,
  getCareStreak,
  getGardenScore,
  getOldestPlantAgeDays,
  getOverdueTasks,
  getStatusLine,
  getTasksCompletedToday,
  getTodayTasks,
  pickTodayTasks,
  type TaskLike,
} from './dashboard-helpers';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private scheduler: SchedulerService,
    private weather: WeatherService,
  ) {}

  async getDashboard(userId: string, from?: string, to?: string) {
    const now = new Date();
    const fromDate = from ? new Date(from) : addDays(startOfDay(now), -45);
    const toDate = to ? new Date(to) : addDays(startOfDay(now), 14);

    const [user, plants, tasks] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
      this.prisma.plant.findMany({
        where: { userId },
        include: {
          species: {
            select: {
              commonName: true,
              wateringFreqDays: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.findMany({
        where: {
          plant: { userId },
          dueDate: { gte: fromDate, lte: toDate },
        },
        include: {
          plant: { include: { species: true } },
        },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    const taskRows = tasks as TaskLike[];
    const currentDate = now;
    const overdueTasks = getOverdueTasks(taskRows, currentDate);
    const todayTasks = getTodayTasks(taskRows, currentDate);
    const completedToday = getTasksCompletedToday(taskRows, currentDate);
    const plantCount = plants.length;
    const completedInRange = taskRows.filter((t) => t.status === 'DONE').length;
    const streak = getCareStreak(taskRows, currentDate);
    const score = getGardenScore(
      plantCount,
      overdueTasks.length,
      todayTasks.length,
      Math.min(4, completedInRange),
    );

    const [scheduleSuggestions, weatherStatus] = await Promise.all([
      this.scheduler.getScheduleSuggestionsForUser(userId),
      this.weather.getAdviceStatus(userId),
    ]);

    const firstName = user?.name?.split(' ')[0] || 'there';
    const cachedSummary = weatherStatus.cachedAdvice
      ? this.summarizeWeather(weatherStatus.cachedAdvice, weatherStatus.locationLabel)
      : null;

    const milestones = this.buildMilestones(
      plantCount,
      plants.map((p) => p.createdAt),
      completedInRange,
      streak,
    );

    return {
      greeting: {
        name: firstName,
        dateLabel: format(currentDate, 'EEEE, MMM d'),
        statusLine: getStatusLine(plantCount, todayTasks.length, overdueTasks.length),
      },
      metrics: {
        totalPlants: plantCount,
        dueToday: todayTasks.length,
        overdue: overdueTasks.length,
        completedToday: completedToday.length,
        gardenScore: score,
      },
      todayTasks: pickTodayTasks(taskRows, 5, currentDate),
      attention: buildAttention(plants, taskRows, currentDate),
      weekPreview: buildWeekPreview(taskRows, currentDate),
      scheduleSuggestions,
      weather: weatherStatus.hasLocation
        ? {
            hasLocation: true,
            locationLabel: weatherStatus.locationLabel,
            canFetchToday: weatherStatus.canFetchToday,
            cachedSummary,
          }
        : { hasLocation: false, cachedSummary: null },
      engagement: {
        score,
        streak,
        milestones,
      },
    };
  }

  private summarizeWeather(
    advice: {
      locationLabel: string | null;
      overviewAlerts: Array<{ title: string; severity: string }>;
      plants: Array<{ advice: string }>;
    },
    locationLabel: string | null,
  ): string {
    const alert = advice.overviewAlerts[0]?.title;
    const plantLine = advice.plants[0]?.advice;
    const where = locationLabel || advice.locationLabel || 'your area';
    if (alert && plantLine) return `${where}: ${alert} — ${plantLine}`;
    if (alert) return `${where}: ${alert}`;
    if (plantLine) return plantLine;
    return `Weather loaded for ${where}`;
  }

  private buildMilestones(
    plantCount: number,
    createdAts: Date[],
    completedInRange: number,
    streak: number,
  ) {
    const oldestDays = getOldestPlantAgeDays(createdAts);
    const defs = [
      { id: 'first_plant', title: 'First plant', unlocked: plantCount >= 1 },
      { id: 'growing_garden', title: 'Growing garden', unlocked: plantCount >= 3 },
      { id: 'first_care', title: 'First care win', unlocked: completedInRange >= 1 },
      { id: 'care_rhythm_3', title: '3-day rhythm', unlocked: streak >= 3 },
      { id: 'care_rhythm_7', title: '7-day rhythm', unlocked: streak >= 7 },
      { id: 'thirty_days', title: '30 days together', unlocked: oldestDays >= 30 },
    ];
    return defs;
  }
}
