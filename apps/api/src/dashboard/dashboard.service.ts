import { Injectable } from '@nestjs/common';
import { addDays, format, startOfDay, subDays } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
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
    private recommendations: RecommendationsService,
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
      recommendations,
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
      this.recommendations.refreshForUser(userId, now),
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
    const weekPreview = buildWeekPreview(taskRows, currentDate);
    const careSummary = this.buildCareSummary(
      plantCount,
      pendingTaskRows,
      overdueTasks,
      todayTasks,
      completedToday.length,
      openDiagnosisCount,
      unresolvedDiagnoses,
      plants,
    );
    const attention = buildAttention(
      plants,
      taskRows,
      currentDate,
      unresolvedDiagnoses,
    );
    const attentionSummary = this.buildAttentionSummary(attention);
    const weekSummary = this.buildWeekSummary(weekPreview);

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
      careSummary,
      plants: plants.map((p) => mapDashboardPlant(p)),
      sharedPlants: mapSharedPlantsForUser(gardens, userId),
      pendingTasks: pendingTaskRows.map((t) => mapDashboardTask(t)),
      todayTasks: todayTaskRows.map((t) => mapDashboardTask(t)),
      attention,
      attentionSummary,
      weekPreview,
      weekSummary,
      scheduleSuggestions,
      recommendations,
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

  private buildAttentionSummary(
    attention: Array<{ priority: 'urgent' | 'warning' | 'info'; plantName: string } | null>,
  ) {
    const items = attention.filter(
      (item): item is { priority: 'urgent' | 'warning' | 'info'; plantName: string } =>
        Boolean(item),
    );
    const urgent = items.filter((item) => item.priority === 'urgent').length;
    const warning = items.filter((item) => item.priority === 'warning').length;
    const info = items.filter((item) => item.priority === 'info').length;
    const needsAttention = urgent + warning;

    if (urgent > 0) {
      return {
        status: 'urgent',
        headline: 'Needs attention',
        body: `${urgent} plant${urgent === 1 ? '' : 's'} ${
          urgent === 1 ? 'has' : 'have'
        } overdue care.`,
        counts: { urgent, warning, info, needsAttention, total: items.length },
      };
    }

    if (warning > 0) {
      return {
        status: 'warning',
        headline: 'Worth a closer look',
        body: `${warning} plant${warning === 1 ? '' : 's'} may need care or health follow-up today.`,
        counts: { urgent, warning, info, needsAttention, total: items.length },
      };
    }

    if (info > 0) {
      return {
        status: 'info',
        headline: 'A few ways to make this smarter',
        body: 'Add photos, notes, or care feedback over time to improve your dashboard guidance.',
        counts: { urgent, warning, info, needsAttention, total: items.length },
      };
    }

    return {
      status: 'calm',
      headline: 'No major issues detected',
      body: 'No plants need urgent attention from your current schedule.',
      counts: { urgent, warning, info, needsAttention, total: 0 },
    };
  }

  private buildWeekSummary(
    weekPreview: Array<{
      date: string;
      label: string;
      dateLabel: string;
      count: number;
    }>,
  ) {
    const totalTasks = weekPreview.reduce((sum, day) => sum + day.count, 0);
    const activeDays = weekPreview.filter((day) => day.count > 0).length;
    const busiestDay =
      weekPreview
        .filter((day) => day.count > 0)
        .sort((a, b) => b.count - a.count)[0] ?? null;
    const counts = {
      totalTasks,
      activeDays,
      busiestDayCount: busiestDay?.count ?? 0,
    };

    if (totalTasks === 0) {
      return {
        status: 'calm',
        headline: 'Quiet week ahead',
        body: 'No care tasks are scheduled for the next seven days.',
        actionLabel: 'Review calendar',
        actionTo: '/garden/calendar',
        busiestDay,
        counts,
      };
    }

    if (totalTasks >= 5 || (busiestDay?.count ?? 0) >= 3) {
      return {
        status: 'busy',
        headline: 'Plan a care session',
        body: `${totalTasks} task${totalTasks === 1 ? '' : 's'} across ${activeDays} day${
          activeDays === 1 ? '' : 's'
        }; ${busiestDay?.label ?? 'one day'} is the busiest.`,
        actionLabel: 'Open calendar',
        actionTo: '/garden/calendar',
        busiestDay,
        counts,
      };
    }

    return {
      status: 'light',
      headline: 'Light care week',
      body: `${totalTasks} task${totalTasks === 1 ? '' : 's'} scheduled across ${activeDays} day${
        activeDays === 1 ? '' : 's'
      }.`,
      actionLabel: 'Open calendar',
      actionTo: '/garden/calendar',
      busiestDay,
      counts,
    };
  }

  private buildCareSummary(
    plantCount: number,
    pendingTasks: TaskLike[],
    overdueTasks: TaskLike[],
    todayTasks: TaskLike[],
    completedToday: number,
    openDiagnosisCount: number,
    unresolvedDiagnoses: Array<{ plantId: string; resultLabel: string }>,
    plants: Array<{
      id: string;
      nickname: string | null;
      species: { commonName: string };
    }>,
  ) {
    const plantNameById = new Map(
      plants.map((plant) => [plant.id, plant.nickname || plant.species.commonName]),
    );
    const taskPlantName = (task: TaskLike | undefined) =>
      task ? task.plant.nickname || task.plant.species.commonName : null;
    const baseCounts = {
      overdue: overdueTasks.length,
      dueToday: todayTasks.length,
      completedToday,
      pending: pendingTasks.length,
      openDiagnoses: openDiagnosisCount,
    };

    if (plantCount === 0) {
      return {
        status: 'empty',
        headline: 'Add your first plant',
        body: 'Dr. Plant will build a personalized care plan once your garden has a plant.',
        actionLabel: 'Add plant',
        actionTo: '/garden/plants/new',
        focusPlantId: null,
        focusPlantName: null,
        counts: baseCounts,
      };
    }

    const overdueTask = overdueTasks[0];
    if (overdueTask) {
      const plantName = taskPlantName(overdueTask);
      return {
        status: 'overdue',
        headline: 'Catch up gently',
        body:
          overdueTasks.length === 1
            ? `${plantName} has one overdue care task.`
            : `${plantName} and ${overdueTasks.length - 1} other task${
                overdueTasks.length === 2 ? '' : 's'
              } need attention.`,
        actionLabel: 'Review overdue care',
        actionTo: '/garden/tasks/overdue',
        focusPlantId: overdueTask.plant.id,
        focusPlantName: plantName,
        counts: baseCounts,
      };
    }

    const todayTask = todayTasks[0];
    if (todayTask) {
      const plantName = taskPlantName(todayTask);
      return {
        status: 'due_today',
        headline: 'Finish today strong',
        body:
          todayTasks.length === 1
            ? `${plantName} has one task due today.`
            : `${plantName} and ${todayTasks.length - 1} other task${
                todayTasks.length === 2 ? '' : 's'
              } are due today.`,
        actionLabel: 'Open today\'s tasks',
        actionTo: '/garden/tasks/today',
        focusPlantId: todayTask.plant.id,
        focusPlantName: plantName,
        counts: baseCounts,
      };
    }

    const diagnosis = unresolvedDiagnoses[0];
    if (diagnosis) {
      const plantName = plantNameById.get(diagnosis.plantId) ?? 'A plant';
      return {
        status: 'health_attention',
        headline: 'Check plant health',
        body: `${plantName} has an unresolved diagnosis: ${diagnosis.resultLabel}.`,
        actionLabel: 'Open Dr. Plant',
        actionTo: `/garden/plants/${diagnosis.plantId}/health#dr-plant`,
        focusPlantId: diagnosis.plantId,
        focusPlantName: plantName,
        counts: baseCounts,
      };
    }

    if (completedToday > 0) {
      return {
        status: 'progress',
        headline: 'Nice progress today',
        body: `You completed ${completedToday} care task${
          completedToday === 1 ? '' : 's'
        } today. Add an observation if you notice new growth.`,
        actionLabel: 'Open journal',
        actionTo: '/garden#plants',
        focusPlantId: null,
        focusPlantName: null,
        counts: baseCounts,
      };
    }

    return {
      status: 'calm',
      headline: 'You\'re all caught up',
      body: 'No care tasks are due right now. This is a good moment to add a photo or journal note.',
      actionLabel: 'Review plants',
      actionTo: '/garden#plants',
      focusPlantId: null,
      focusPlantName: null,
      counts: baseCounts,
    };
  }

}
