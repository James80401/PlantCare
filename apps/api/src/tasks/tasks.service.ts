import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CareGuidesService } from '../care-guides/care-guides.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { sharedPlantInclude, userCanCompletePlantTask, userCanViewPlantTasks } from '../gardens/task-access';
import { getLocalDayStart } from '../weather/weather-cache.util';
import { SkipTaskDto } from './dto/skip-task.dto';
import { SnoozeTaskDto } from './dto/snooze-task.dto';
import { type CompleteTaskFeedbackDto } from './dto/complete-task-feedback.dto';
import { TaskCompletedEvent } from './events/task-completed.event';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private scheduler: SchedulerService,
    private careGuides: CareGuidesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findForUser(userId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.task.findMany({
      where: {
        dueDate: { gte: fromDate, lte: toDate },
        plant: {
          OR: [
            { userId },
            { shares: { some: { garden: { members: { some: { userId } } } } } },
          ],
        },
      },
      include: {
        plant: { include: { species: true, ...sharedPlantInclude } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async complete(userId: string, taskId: string, feedback?: CompleteTaskFeedbackDto) {
    const task = await this.loadTaskForUser(userId, taskId, 'complete');

    const updated = await this.prisma.$transaction(async (tx) => {
      const done = await tx.task.update({
        where: { id: taskId },
        data: {
          status: TaskStatus.DONE,
          completedAt: new Date(),
        },
        include: { plant: { include: { species: true } } },
      });

      const note = feedback?.note?.trim();
      if (feedback && (feedback.reason || note)) {
        await tx.taskFeedback.create({
          data: {
            taskId,
            userId,
            action: 'COMPLETE',
            reason: feedback.reason ?? 'OTHER',
            note: note || undefined,
          },
        });
      }

      return done;
    });

    await this.scheduler.onTaskCompleted(taskId);
    this.eventEmitter.emit(
      'task.completed',
      new TaskCompletedEvent(userId, taskId, updated.taskType, updated.plantId),
    );
    return updated;
  }

  async bulkComplete(userId: string, taskIds: string[]) {
    const uniqueIds = [...new Set(taskIds)];
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: uniqueIds }, status: TaskStatus.PENDING },
      include: { plant: { include: sharedPlantInclude } },
    });
    if (tasks.length !== uniqueIds.length) {
      throw new NotFoundException('One or more tasks could not be completed');
    }
    if (tasks.some((task) => !userCanCompletePlantTask(userId, task.plant))) {
      throw new NotFoundException('One or more tasks could not be completed');
    }

    const completedAt = new Date();
    await this.prisma.task.updateMany({
      where: { id: { in: uniqueIds }, status: TaskStatus.PENDING },
      data: { status: TaskStatus.DONE, completedAt },
    });

    const careStops = new Map<string, (typeof tasks)[number]>();
    for (const task of tasks) {
      const key = `${task.plantId}:${task.taskType}`;
      const current = careStops.get(key);
      if (!current || task.dueDate > current.dueDate) careStops.set(key, task);
    }

    await Promise.all([...careStops.values()].map((task) => this.scheduler.onTaskCompleted(task.id)));
    for (const task of careStops.values()) {
      this.eventEmitter.emit(
        'task.completed',
        new TaskCompletedEvent(userId, task.id, task.taskType, task.plantId),
      );
    }
    return { completed: tasks.length, taskIds: uniqueIds, completedAt };
  }

  async skip(userId: string, taskId: string, feedback?: SkipTaskDto) {
    const task = await this.loadTaskForUser(userId, taskId, 'complete');

    const updated = await this.prisma.$transaction(async (tx) => {
      const skipped = await tx.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.SKIPPED, completedAt: new Date() },
        include: { plant: { include: { species: true } } },
      });

      if (feedback?.reason) {
        await tx.taskFeedback.create({
          data: {
            taskId,
            userId,
            action: 'SKIP',
            reason: feedback.reason,
            note: feedback.note?.trim() || undefined,
          },
        });
      }

      return skipped;
    });

    await this.scheduler.onTaskCompleted(taskId);
    return updated;
  }

  async snooze(userId: string, taskId: string, dto: SnoozeTaskDto) {
    const task = await this.loadTaskForUser(userId, taskId, 'complete');
    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('Only pending tasks can be snoozed');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const newDueDate = getLocalDayStart(user?.timezone || 'UTC', dto.days);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { dueDate: newDueDate },
        include: { plant: { include: { species: true } } },
      });

      await tx.taskFeedback.create({
        data: {
          taskId,
          userId,
          action: 'SNOOZE',
          reason: `SNOOZE_${dto.days}D`,
          note: `Snoozed until ${newDueDate.toISOString().slice(0, 10)}`,
        },
      });

      return updated;
    });
  }

  getInstructions(userId: string, taskId: string) {
    return this.careGuides.getInstructionsForTask(userId, taskId);
  }

  getExplanation(userId: string, taskId: string) {
    return this.scheduler.getScheduleExplanationForTask(userId, taskId);
  }

  getScheduleSuggestions(userId: string) {
    return this.scheduler.getScheduleSuggestionsForUser(userId);
  }

  applyScheduleSuggestion(userId: string, suggestionId: string) {
    return this.scheduler.applyScheduleSuggestion(userId, suggestionId);
  }

  private async loadTaskForUser(
    userId: string,
    taskId: string,
    action: 'view' | 'complete',
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId },
      include: { plant: { include: sharedPlantInclude } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const allowed =
      action === 'view'
        ? userCanViewPlantTasks(userId, task.plant)
        : userCanCompletePlantTask(userId, task.plant);
    if (!allowed) throw new NotFoundException('Task not found');
    return task;
  }
}
