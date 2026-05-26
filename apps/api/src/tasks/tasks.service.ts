import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskStatus } from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { CareGuidesService } from '../care-guides/care-guides.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { sharedPlantInclude, userCanCompletePlantTask, userCanViewPlantTasks } from '../gardens/task-access';
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

    await this.scheduler.autoPostponeOutdoorWateringFromWeather(userId);

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

      if (feedback?.reason) {
        await tx.taskFeedback.create({
          data: {
            taskId,
            userId,
            action: 'COMPLETE',
            reason: feedback.reason,
            note: feedback.note?.trim() || undefined,
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
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, plant: { userId } },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('Only pending tasks can be snoozed');
    }

    const newDueDate = addDays(startOfDay(new Date()), dto.days);

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
