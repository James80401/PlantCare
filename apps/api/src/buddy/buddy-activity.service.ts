import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityType } from '@prisma/client';
import { TaskStatus, TaskType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from '../tasks/tasks.service';
import { formatBuddy } from './buddy.utils';
import {
  ACTIVITY_REWARDS,
  ACTIVITY_TYPES,
} from './constants/activity-rewards';
import { SUNLIGHT_CAP } from './constants/sunlight-awards';
import { CompleteActivityDto } from './dto/complete-activity.dto';
import { ActivityCompletedEvent } from './events/activity-completed.event';

const PLANT_REQUIRED: ActivityType[] = [
  'PLANT_JOURNAL',
  'PROGRESS_PHOTO',
  'PEST_INSPECTION',
  'REPOTTING_GUIDE',
  'PRUNING_GUIDE',
  'PROPAGATION_LOG',
];

@Injectable()
export class BuddyActivityService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
    private tasksService: TasksService,
  ) {}

  getLibrary() {
    return ACTIVITY_TYPES.map((type) => {
      const meta = ACTIVITY_REWARDS[type];
      return {
        activityType: type,
        label: meta.label,
        emoji: meta.emoji,
        estimatedMinutes: meta.minutes,
        sunlightReward: meta.sunlight,
        dewdropReward: meta.dewdrops,
      };
    });
  }

  async complete(userId: string, dto: CompleteActivityDto) {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId },
      include: { journeys: { where: { completed: false }, take: 1 } },
    });
    if (!buddy) throw new NotFoundException('Plant buddy not found');

    if (PLANT_REQUIRED.includes(dto.activityType) && !dto.plantId) {
      throw new BadRequestException('plantId is required for this activity');
    }

    if (dto.plantId) {
      const plant = await this.prisma.plant.findFirst({
        where: { id: dto.plantId, userId },
      });
      if (!plant) throw new NotFoundException('Plant not found');
    }

    const plantIds =
      dto.plantIds?.length ? dto.plantIds : dto.plantId ? [dto.plantId] : [];

    if (plantIds.length > 0) {
      const owned = await this.prisma.plant.count({
        where: { id: { in: plantIds }, userId },
      });
      if (owned !== plantIds.length) {
        throw new NotFoundException('One or more plants not found');
      }
    }

    let tasksCompleted = 0;
    if (dto.activityType === 'WATERING_CHECK' && plantIds.length > 0) {
      tasksCompleted = await this.completePendingTasks(userId, plantIds, TaskType.WATER);
    } else if (dto.activityType === 'REPOTTING_GUIDE' && dto.plantId) {
      tasksCompleted = await this.completePendingTasks(userId, [dto.plantId], TaskType.REPOT);
    } else if (dto.activityType === 'PRUNING_GUIDE' && dto.plantId) {
      tasksCompleted = await this.completePendingTasks(userId, [dto.plantId], TaskType.PRUNE);
    } else if (dto.activityType === 'PEST_INSPECTION' && dto.plantId) {
      tasksCompleted = await this.completePendingTasks(userId, [dto.plantId], TaskType.INSPECT_PESTS);
    } else if (dto.activityType === 'HUMIDITY_CHECK' && dto.plantId) {
      tasksCompleted = await this.completePendingTasks(userId, [dto.plantId], TaskType.MIST);
    }

    const rewards = ACTIVITY_REWARDS[dto.activityType];
    const onJourney = Boolean(buddy.journeys[0]);
    const sunlightEarned = onJourney
      ? 0
      : Math.min(rewards.sunlight, SUNLIGHT_CAP - buddy.sunlightToday);

    let journalEntryId: string | undefined;
    if (dto.activityType === 'PROGRESS_PHOTO' && dto.plantId) {
      const entry = await this.prisma.journalEntry.create({
        data: {
          plantId: dto.plantId,
          notes: dto.notes?.trim() || 'Progress photo (buddy activity)',
        },
      });
      journalEntryId = entry.id;
    }

    const activity = await this.prisma.buddyActivity.create({
      data: {
        buddyId: buddy.id,
        userId,
        activityType: dto.activityType,
        durationSeconds: dto.durationSeconds,
        sunlightEarned,
        dewdropsEarned: rewards.dewdrops,
        plantId: dto.plantId,
        notes: dto.notes,
        journalEntryId,
      },
    });

    await this.prisma.buddy.update({
      where: { id: buddy.id },
      data: {
        ...(sunlightEarned > 0 ? { sunlightToday: { increment: sunlightEarned } } : {}),
        dewdrops: { increment: rewards.dewdrops },
        lastActiveDate: new Date(),
        lastTaskDate: new Date(),
      },
    });

    this.events.emit(
      'activity.completed',
      new ActivityCompletedEvent(userId, dto.activityType, dto.plantId ?? null),
    );

    const fresh = await this.prisma.buddy.findUnique({
      where: { userId },
      include: { journeys: { where: { completed: false }, take: 1 } },
    });

    return {
      activity: {
        id: activity.id,
        activityType: activity.activityType,
        sunlightEarned,
        dewdropsEarned: rewards.dewdrops,
        journalEntryId,
        completedAt: activity.completedAt,
        tasksCompleted,
      },
      buddy: fresh ? formatBuddy(fresh) : null,
    };
  }

  private async completePendingTasks(
    userId: string,
    plantIds: string[],
    taskType: TaskType,
  ): Promise<number> {
    const tasks = await this.prisma.task.findMany({
      where: {
        plantId: { in: plantIds },
        taskType,
        status: TaskStatus.PENDING,
        plant: { userId },
      },
      select: { id: true },
    });

    let count = 0;
    for (const task of tasks) {
      try {
        await this.tasksService.complete(userId, task.id);
        count++;
      } catch {
        // User may not have permission on shared plants — skip
      }
    }
    return count;
  }
}
