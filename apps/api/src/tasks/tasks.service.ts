import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CareGuidesService } from '../care-guides/care-guides.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { SkipTaskDto } from './dto/skip-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private scheduler: SchedulerService,
    private careGuides: CareGuidesService,
  ) {}

  async findForUser(userId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date();
    const toDate = to
      ? new Date(to)
      : new Date(fromDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.task.findMany({
      where: {
        plant: { userId },
        dueDate: { gte: fromDate, lte: toDate },
      },
      include: {
        plant: { include: { species: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async complete(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, plant: { userId } },
    });
    if (!task) throw new NotFoundException('Task not found');

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.DONE,
        completedAt: new Date(),
      },
      include: { plant: { include: { species: true } } },
    });

    await this.scheduler.onTaskCompleted(taskId);
    return updated;
  }

  async skip(userId: string, taskId: string, feedback?: SkipTaskDto) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, plant: { userId } },
    });
    if (!task) throw new NotFoundException('Task not found');

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

  getInstructions(userId: string, taskId: string) {
    return this.careGuides.getInstructionsForTask(userId, taskId);
  }
}
