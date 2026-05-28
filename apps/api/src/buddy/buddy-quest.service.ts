import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Quest, QuestType } from '@prisma/client';
import { createHash } from 'crypto';
import { startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { TaskCompletedEvent } from '../tasks/events/task-completed.event';
import {
  ACHIEVEMENT_QUESTS,
  DAILY_QUEST_POOL,
  MONTHLY_CHALLENGE_SEED,
} from './constants/quest-seed-data';
import { ActivityCompletedEvent } from './events/activity-completed.event';
import { JourneyCompletedEvent } from './events/journey-completed.event';
import { SunshineSentEvent } from './events/sunshine-sent.event';
import { SUNLIGHT_CAP } from './constants/sunlight-awards';

interface QuestRequirement {
  kind: string;
  count?: number;
  taskType?: string;
  activityType?: string;
}

@Injectable()
export class BuddyQuestService {
  constructor(private prisma: PrismaService) {}

  async getQuests(userId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    await this.syncDailyProgress(buddy.id);
    const dayKey = new Date().toISOString().slice(0, 10);
    const dailyIds = this.pickDailyQuestIds(dayKey, 3);

    const dailyQuests = await this.prisma.quest.findMany({
      where: { id: { in: dailyIds } },
      include: { progress: { where: { buddyId: buddy.id }, take: 1 } },
    });

    const achievements = await this.prisma.quest.findMany({
      where: { type: 'ACHIEVEMENT', isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { progress: { where: { buddyId: buddy.id }, take: 1 } },
    });

    const monthly = await this.getMonthlyProgress(buddy.id);

    return {
      daily: dailyQuests.map((q) => this.formatQuest(q)),
      achievements: achievements.map((q) => this.formatQuest(q)),
      monthly,
      dewdrops: buddy.dewdrops,
    };
  }

  async claim(userId: string, questId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    const progress = await this.prisma.buddyQuestProgress.findUnique({
      where: { buddyId_questId: { buddyId: buddy.id, questId } },
      include: { quest: true },
    });
    if (!progress || !progress.completed) {
      throw new BadRequestException('Quest not completed yet');
    }
    if (progress.rewardClaimed) {
      throw new BadRequestException('Reward already claimed');
    }

    await this.prisma.$transaction([
      this.prisma.buddyQuestProgress.update({
        where: { id: progress.id },
        data: { rewardClaimed: true },
      }),
      this.prisma.buddy.update({
        where: { id: buddy.id },
        data: { dewdrops: { increment: progress.quest.rewardDewdrops } },
      }),
    ]);

    const fresh = await this.prisma.buddy.findUnique({ where: { id: buddy.id } });
    return {
      questId,
      dewdropsAwarded: progress.quest.rewardDewdrops,
      dewdrops: fresh?.dewdrops ?? buddy.dewdrops,
    };
  }

  @OnEvent('task.completed')
  async onTaskCompleted(event: TaskCompletedEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;

    await this.incrementForBuddy(buddy.id, (req) => {
      if (req.kind === 'TASK_TYPE' && req.taskType === event.taskType) return 1;
      if (req.kind === 'ANY_TASK') return 1;
      return 0;
    });

    const fresh = await this.prisma.buddy.findUnique({ where: { id: buddy.id } });
    if (fresh) {
      await this.setProgressForKind(buddy.id, 'TASKS_TODAY', fresh.tasksToday);
      if (fresh.sunlightToday >= SUNLIGHT_CAP) {
        await this.setProgressForKind(buddy.id, 'SUNLIGHT_FULL', 1);
      }
    }

    await this.bumpMonthly(buddy.id);
    await this.syncAchievementStreak(buddy.id, buddy.streakDays);
  }

  @OnEvent('activity.completed')
  async onActivityCompleted(event: ActivityCompletedEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;

    await this.incrementForBuddy(buddy.id, (req) => {
      if (req.kind === 'ACTIVITY_TYPE' && req.activityType === event.activityType) return 1;
      if (req.kind === 'ANY_ACTIVITY') return 1;
      return 0;
    });

    const fresh = await this.prisma.buddy.findUnique({ where: { id: buddy.id } });
    if (fresh && fresh.sunlightToday >= SUNLIGHT_CAP) {
      await this.incrementForBuddy(buddy.id, (req) =>
        req.kind === 'SUNLIGHT_FULL' ? 1 : 0,
      );
    }

    await this.syncUniqueActivities(buddy.id);
    await this.bumpMonthly(buddy.id);
  }

  @OnEvent('journey.completed')
  async onJourneyCompleted(event: JourneyCompletedEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;

    await this.incrementForBuddy(buddy.id, (req) =>
      req.kind === 'JOURNEY_COMPLETE' ? 1 : 0,
    );

    const fresh = await this.prisma.buddy.findUnique({ where: { id: buddy.id } });
    if (fresh) await this.syncJourneyAchievements(buddy.id, fresh.journeyCount);
    await this.bumpMonthly(buddy.id);
  }

  @OnEvent('sunshine.sent')
  async onSunshineSent(event: SunshineSentEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;
    await this.setProgressForKind(buddy.id, 'SUNSHINE_SENT', 1);
  }

  @OnEvent('journey.started')
  async onJourneyStarted(event: JourneyCompletedEvent) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId: event.userId } });
    if (!buddy) return;
    await this.setProgressForKind(buddy.id, 'JOURNEY_START', 1);
    await this.bumpMonthly(buddy.id);
  }

  private async incrementForBuddy(
    buddyId: string,
    deltaFor: (req: QuestRequirement) => number,
  ) {
    const quests = await this.prisma.quest.findMany({ where: { isActive: true } });
    for (const quest of quests) {
      const req = this.parseRequirement(quest);
      const delta = deltaFor(req);
      if (delta <= 0) continue;
      await this.addProgress(buddyId, quest, delta);
    }
  }

  private async addProgress(buddyId: string, quest: Quest, delta: number) {
    const req = this.parseRequirement(quest);
    const required = req.count ?? 1;

    const existing = await this.prisma.buddyQuestProgress.findUnique({
      where: { buddyId_questId: { buddyId, questId: quest.id } },
    });

    const nextProgress = Math.min((existing?.progress ?? 0) + delta, required);
    const completed = nextProgress >= required;

    await this.prisma.buddyQuestProgress.upsert({
      where: { buddyId_questId: { buddyId, questId: quest.id } },
      update: {
        progress: nextProgress,
        completed,
        ...(completed && !existing?.completed ? { completedAt: new Date() } : {}),
      },
      create: {
        buddyId,
        questId: quest.id,
        progress: nextProgress,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  private async syncDailyProgress(buddyId: string) {
    const today = startOfDay(new Date());
    const dailyQuests = await this.prisma.quest.findMany({ where: { type: 'DAILY' } });
    for (const quest of dailyQuests) {
      const prog = await this.prisma.buddyQuestProgress.findUnique({
        where: { buddyId_questId: { buddyId, questId: quest.id } },
      });
      if (prog && prog.updatedAt < today) {
        await this.prisma.buddyQuestProgress.update({
          where: { id: prog.id },
          data: {
            progress: 0,
            completed: false,
            completedAt: null,
            rewardClaimed: false,
          },
        });
      }
    }
  }

  private async syncAchievementStreak(buddyId: string, streakDays: number) {
    const quest = await this.prisma.quest.findUnique({ where: { id: 'ach_streak_7' } });
    if (!quest) return;
    const required = 7;
    const completed = streakDays >= required;
    await this.prisma.buddyQuestProgress.upsert({
      where: { buddyId_questId: { buddyId, questId: quest.id } },
      update: {
        progress: Math.min(streakDays, required),
        completed,
        ...(completed ? { completedAt: new Date() } : {}),
      },
      create: {
        buddyId,
        questId: quest.id,
        progress: Math.min(streakDays, required),
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  private async syncUniqueActivities(buddyId: string) {
    const quest = await this.prisma.quest.findUnique({ where: { id: 'ach_activities_all' } });
    if (!quest) return;
    const types = await this.prisma.buddyActivity.findMany({
      where: { buddyId },
      distinct: ['activityType'],
      select: { activityType: true },
    });
    const count = types.length;
    const required = 10;
    const completed = count >= required;
    await this.prisma.buddyQuestProgress.upsert({
      where: { buddyId_questId: { buddyId, questId: quest.id } },
      update: { progress: count, completed, ...(completed ? { completedAt: new Date() } : {}) },
      create: {
        buddyId,
        questId: quest.id,
        progress: count,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });
  }

  private async bumpMonthly(buddyId: string) {
    const now = new Date();
    const challenge = await this.prisma.monthlyChallenge.findFirst({
      where: { month: now.getMonth() + 1, year: now.getFullYear(), isActive: true },
    });
    if (!challenge) return;

    const steps = this.parseSteps(challenge.steps);
    const prog = await this.prisma.buddyChallengeProgress.upsert({
      where: { buddyId_challengeId: { buddyId, challengeId: challenge.id } },
      update: {},
      create: { buddyId, challengeId: challenge.id },
    });

    if (prog.stepsCompleted >= steps.length) return;

    await this.prisma.buddyChallengeProgress.update({
      where: { id: prog.id },
      data: {
        stepsCompleted: { increment: 1 },
        ...(prog.stepsCompleted + 1 >= steps.length
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  private async getMonthlyProgress(buddyId: string) {
    const now = new Date();
    const challenge = await this.prisma.monthlyChallenge.findFirst({
      where: { month: now.getMonth() + 1, year: now.getFullYear(), isActive: true },
    });
    if (!challenge) return null;

    const steps = this.parseSteps(challenge.steps);
    const prog = await this.prisma.buddyChallengeProgress.upsert({
      where: { buddyId_challengeId: { buddyId, challengeId: challenge.id } },
      update: {},
      create: { buddyId, challengeId: challenge.id },
    });

    const nextStep = steps[prog.stepsCompleted] ?? null;
    return {
      challengeId: challenge.id,
      title: challenge.title,
      description: challenge.description,
      stepsCompleted: prog.stepsCompleted,
      totalSteps: steps.length,
      rewardDewdrops: challenge.rewardDewdrops,
      completed: Boolean(prog.completedAt),
      nextStep: nextStep ? { label: nextStep.label, index: prog.stepsCompleted } : null,
    };
  }

  private async setProgressForKind(buddyId: string, kind: string, value: number) {
    const quests = await this.prisma.quest.findMany({ where: { isActive: true } });
    for (const quest of quests) {
      const req = this.parseRequirement(quest);
      if (req.kind !== kind) continue;
      const required = req.count ?? 1;
      const progress = Math.min(value, required);
      const completed = progress >= required;
      await this.prisma.buddyQuestProgress.upsert({
        where: { buddyId_questId: { buddyId, questId: quest.id } },
        update: { progress, completed, ...(completed ? { completedAt: new Date() } : {}) },
        create: {
          buddyId,
          questId: quest.id,
          progress,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
    }
  }

  private async syncJourneyAchievements(buddyId: string, journeyCount: number) {
    const defs: [string, number][] = [
      ['ach_first_journey', 1],
      ['ach_journeys_10', 10],
    ];
    for (const [questId, required] of defs) {
      const quest = await this.prisma.quest.findUnique({ where: { id: questId } });
      if (!quest) continue;
      const progress = Math.min(journeyCount, required);
      const completed = journeyCount >= required;
      await this.prisma.buddyQuestProgress.upsert({
        where: { buddyId_questId: { buddyId, questId } },
        update: { progress, completed, ...(completed ? { completedAt: new Date() } : {}) },
        create: {
          buddyId,
          questId,
          progress,
          completed,
          completedAt: completed ? new Date() : null,
        },
      });
    }
  }

  private formatQuest(quest: Quest & { progress: { progress: number; completed: boolean; rewardClaimed: boolean }[] }) {
    const req = this.parseRequirement(quest);
    const row = quest.progress[0];
    const required = req.count ?? 1;
    return {
      questId: quest.id,
      type: quest.type,
      title: quest.title,
      description: quest.description,
      progress: row?.progress ?? 0,
      required,
      completed: row?.completed ?? false,
      rewardClaimed: row?.rewardClaimed ?? false,
      rewardDewdrops: quest.rewardDewdrops,
    };
  }

  private parseRequirement(quest: Quest): QuestRequirement {
    const raw: unknown =
      typeof quest.requirement === 'string'
        ? JSON.parse(quest.requirement)
        : quest.requirement;
    return raw as QuestRequirement;
  }

  private parseSteps(value: unknown): { id: string; label: string }[] {
    if (typeof value === 'string') {
      return JSON.parse(value) as { id: string; label: string }[];
    }
    return value as { id: string; label: string }[];
  }

  private pickDailyQuestIds(dayKey: string, count: number): string[] {
    const ids = DAILY_QUEST_POOL.map((q) => q.id);
    const sorted = [...ids].sort((a, b) => {
      const ha = createHash('sha256').update(`${dayKey}:${a}`).digest('hex');
      const hb = createHash('sha256').update(`${dayKey}:${b}`).digest('hex');
      return ha.localeCompare(hb);
    });
    return sorted.slice(0, count);
  }
}
