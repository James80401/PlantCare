import { Injectable } from '@nestjs/common';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { WeatherService } from '../weather/weather.service';
import { PlantMilestonesService } from '../milestones/plant-milestones.service';
import {
  buildAttention,
  buildWeekPreview,
  getCareStreak,
  getGardenScore,
  getOverdueTasks,
  getPendingTasks,
  getStatusLine,
  getTasksCompletedToday,
  getTodayTasks,
  pickTodayTasks,
  type TaskLike,
} from './dashboard-helpers';
import {
  mapDashboardDiagnosisSummary,
  mapDashboardJournalEntry,
  mapDashboardPlant,
  mapDashboardRecoveryPlant,
  mapDashboardTask,
  mapSharedPlantsForUser,
} from './dashboard.mapper';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private scheduler: SchedulerService,
    private weather: WeatherService,
    private plantMilestones: PlantMilestonesService,
  ) {}

  async getDashboard(userId: string, from?: string, to?: string) {
    await this.scheduler.autoPostponeOutdoorWateringFromWeather(userId);

    const now = new Date();
    const fromDate = from ? new Date(from) : addDays(startOfDay(now), -45);
    const toDate = to ? new Date(to) : addDays(startOfDay(now), 14);

    const [
      user,
      plants,
      gardens,
      tasks,
      unresolvedDiagnoses,
      recentJournalEntries,
      recentDiagnoses,
      openDiagnosisCount,
    ] = await Promise.all([
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
              scientificName: true,
              sunlight: true,
              wateringFreqDays: true,
            },
          },
          tasks: {
            where: { status: 'PENDING' },
            orderBy: { dueDate: 'asc' },
            take: 1,
            select: { dueDate: true, taskType: true, status: true },
          },
          diagnoses: {
            where: { resolved: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { resultLabel: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.garden.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          members: { select: { userId: true, role: true } },
          plants: {
            include: {
              plant: {
                include: {
                  species: {
                    select: {
                      commonName: true,
                      scientificName: true,
                      sunlight: true,
                      wateringFreqDays: true,
                      defaultImageUrl: true,
                    },
                  },
                },
              },
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
      this.prisma.diagnosis.findMany({
        where: {
          plant: { userId },
          resolved: false,
          createdAt: { gte: subDays(startOfDay(now), 14) },
        },
        select: {
          plantId: true,
          resultLabel: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.journalEntry.findMany({
        where: { plant: { userId } },
        select: {
          id: true,
          plantId: true,
          photoUrl: true,
          notes: true,
          heightCm: true,
          widthCm: true,
          leafCount: true,
          createdAt: true,
          plant: {
            select: {
              nickname: true,
              species: { select: { commonName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.diagnosis.findMany({
        where: { plant: { userId } },
        select: {
          id: true,
          plantId: true,
          resultLabel: true,
          confidence: true,
          resolved: true,
          createdAt: true,
          plant: {
            select: {
              nickname: true,
              species: { select: { commonName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.diagnosis.count({
        where: { plant: { userId }, resolved: false },
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

    const milestones = await this.plantMilestones.syncAndListForUser(userId, {
      plantCount,
      plantCreatedAts: plants.map((p) => p.createdAt),
      completedInRange,
      streak,
    });

    const todayTaskRows = pickTodayTasks(taskRows, 5, currentDate);
    const pendingTaskRows = getPendingTasks(taskRows);

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
      plants: plants.map((p) => mapDashboardPlant(p)),
      sharedPlants: mapSharedPlantsForUser(gardens, userId),
      pendingTasks: pendingTaskRows.map((t) => mapDashboardTask(t)),
      todayTasks: todayTaskRows.map((t) => mapDashboardTask(t)),
      attention: buildAttention(
        plants,
        taskRows,
        currentDate,
        unresolvedDiagnoses,
      ),
      weekPreview: buildWeekPreview(taskRows, currentDate),
      scheduleSuggestions,
      healthStory: {
        openDiagnosisCount,
        recentJournal: recentJournalEntries.map((entry) =>
          mapDashboardJournalEntry(entry),
        ),
        recentDiagnoses: recentDiagnoses.map((diagnosis) =>
          mapDashboardDiagnosisSummary(diagnosis),
        ),
        recoveryPlants: recentDiagnoses
          .filter((diagnosis) => !diagnosis.resolved)
          .slice(0, 3)
          .map((diagnosis) => mapDashboardRecoveryPlant(diagnosis)),
      },
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
        completedInRange,
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

}
