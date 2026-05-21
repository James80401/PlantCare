import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { BuddyMood, GrowthStage } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { TaskCompletedEvent } from '../tasks/events/task-completed.event';
import {
  DEWDROPS_PER_TASK,
  SUNLIGHT_CAP,
  sunlightForTask,
} from './constants/sunlight-awards';
import {
  growthStageFromJourneyCount,
  unlockedBiomesForStage,
} from './constants/stage-thresholds';
import { CreateBuddyDto } from './dto/create-buddy.dto';
import { UpdateBuddyDto } from './dto/update-buddy.dto';
import {
  formatBuddy,
  generateGardenCode,
  parseStringArray,
} from './buddy.utils';

@Injectable()
export class BuddyService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateBuddyDto) {
    const existing = await this.prisma.buddy.findUnique({ where: { userId } });
    if (existing) throw new ConflictException('You already have a plant buddy');

    const unlockedSpecies = [dto.speciesId];
    if (!unlockedSpecies.includes('monstera')) unlockedSpecies.push('monstera');

    let gardenCode = generateGardenCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await this.prisma.buddy.findUnique({ where: { gardenCode } });
      if (!clash) break;
      gardenCode = generateGardenCode();
    }

    const buddy = await this.prisma.buddy.create({
      data: {
        userId,
        name: dto.name.trim(),
        speciesId: dto.speciesId,
        trait: dto.trait,
        unlockedSpecies: JSON.stringify(unlockedSpecies),
        unlockedBiomes: JSON.stringify(['seed_garden']),
        gardenCode,
      },
    });

    return formatBuddy(buddy);
  }

  async findByUserId(userId: string) {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId },
      include: {
        journeys: {
          where: { completed: false },
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!buddy) throw new NotFoundException('Plant buddy not found');
    return formatBuddy(buddy);
  }

  async update(userId: string, dto: UpdateBuddyDto) {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    const updated = await this.prisma.buddy.update({
      where: { id: buddy.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.trait !== undefined ? { trait: dto.trait } : {}),
      },
      include: {
        journeys: {
          where: { completed: false },
          take: 1,
        },
      },
    });

    return formatBuddy(updated);
  }

  async getDailyGreeting(userId: string): Promise<{ message: string }> {
    const buddy = await this.prisma.buddy.findUnique({ where: { userId } });
    if (!buddy) throw new NotFoundException('Plant buddy not found');
    return {
      message: `${buddy.name} is having a great day in the garden 🌿`,
    };
  }

  @OnEvent('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId: event.userId },
      include: {
        journeys: { where: { completed: false }, take: 1 },
      },
    });
    if (!buddy) return;

    const activeJourney = buddy.journeys[0];
    if (activeJourney) {
      await this.prisma.buddyJourney.update({
        where: { id: activeJourney.id },
        data: {
          tasksCompletedDuring: { increment: 1 },
          minutesSaved: { increment: 10 },
          endsAt: new Date(activeJourney.endsAt.getTime() - 10 * 60 * 1000),
        },
      });
      await this.prisma.buddy.update({
        where: { id: buddy.id },
        data: {
          dewdrops: { increment: DEWDROPS_PER_TASK },
          tasksToday: { increment: 1 },
          lastTaskDate: new Date(),
          mood: BuddyMood.HAPPY,
        },
      });
      return;
    }

    const sunlight = sunlightForTask(event.taskType, buddy.speciesId);
    const newSunlight = Math.min(buddy.sunlightToday + sunlight, SUNLIGHT_CAP);

    await this.prisma.buddy.update({
      where: { id: buddy.id },
      data: {
        sunlightToday: newSunlight,
        dewdrops: { increment: DEWDROPS_PER_TASK },
        tasksToday: { increment: 1 },
        lastTaskDate: new Date(),
        lastActiveDate: new Date(),
        mood: BuddyMood.HAPPY,
      },
    });

    await this.updateStreak(buddy.id, buddy.lastActiveDate);
  }

  async resetDailyIfNeeded(buddyId: string) {
    const buddy = await this.prisma.buddy.findUnique({ where: { id: buddyId } });
    if (!buddy) return;

    const today = startOfDay(new Date());
    const last = buddy.lastResetDate ? startOfDay(buddy.lastResetDate) : null;
    if (last && last.getTime() === today.getTime()) return;

    let mood = buddy.mood;
    const daysSinceTask = buddy.lastTaskDate
      ? Math.floor((today.getTime() - startOfDay(buddy.lastTaskDate).getTime()) / 86400000)
      : 99;

    if (daysSinceTask >= 3) mood = BuddyMood.DORMANT;
    else if (daysSinceTask >= 2) mood = BuddyMood.WILTING;
    else if (daysSinceTask >= 1) mood = BuddyMood.CONTENT;

    await this.prisma.buddy.update({
      where: { id: buddyId },
      data: {
        sunlightToday: 0,
        tasksToday: 0,
        lastResetDate: today,
        mood,
      },
    });
  }

  async applyJourneyCompletion(
    buddyId: string,
    dewdropsEarned: number,
  ): Promise<{ stageAdvanced: boolean; previousStage: GrowthStage; newStage: GrowthStage }> {
    const buddy = await this.prisma.buddy.findUnique({ where: { id: buddyId } });
    if (!buddy) throw new NotFoundException('Buddy not found');

    const previousStage = buddy.growthStage;
    const journeyCount = buddy.journeyCount + 1;
    const newStage = growthStageFromJourneyCount(journeyCount);
    const biomes = unlockedBiomesForStage(newStage);
    const species = parseStringArray(buddy.unlockedSpecies);
    if (!species.includes(buddy.speciesId)) species.push(buddy.speciesId);

    await this.prisma.buddy.update({
      where: { id: buddyId },
      data: {
        journeyCount,
        growthStage: newStage,
        dewdrops: { increment: dewdropsEarned },
        sunlightToday: 0,
        unlockedBiomes: JSON.stringify(biomes),
        currentBiome: biomes[biomes.length - 1] ?? 'seed_garden',
        mood: BuddyMood.THRIVING,
      },
    });

    return {
      stageAdvanced: newStage !== previousStage,
      previousStage,
      newStage,
    };
  }

  private async updateStreak(buddyId: string, lastActiveDate: Date | null) {
    const today = startOfDay(new Date());
    const last = lastActiveDate ? startOfDay(lastActiveDate) : null;

    const buddy = await this.prisma.buddy.findUnique({ where: { id: buddyId } });
    if (!buddy) return;

    if (last && last.getTime() === today.getTime()) return;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let streak = 1;
    if (last && startOfDay(last).getTime() === yesterday.getTime()) {
      streak = buddy.streakDays + 1;
    }

    const longest = Math.max(buddy.longestStreak, streak);
    let bonusDewdrops = 0;
    if (streak === 7) bonusDewdrops = 50;
    if (streak === 30) bonusDewdrops = 200;

    await this.prisma.buddy.update({
      where: { id: buddyId },
      data: {
        streakDays: streak,
        longestStreak: longest,
        lastActiveDate: today,
        ...(bonusDewdrops > 0 ? { dewdrops: { increment: bonusDewdrops } } : {}),
      },
    });
  }
}
