# Plant Buddy — Tasks Integration

## Philosophy

Plant Buddy does **not** create a separate task system. The existing `Task` model, `TaskType` enum, `TaskStatus` enum, and scheduler module in PlantCare are reused entirely. Buddy simply listens for task completion events and awards Sunlight and Dewdrops in response.

This keeps data consistent, avoids duplication, and means any improvements to the core task system automatically benefit Buddy.

---

## How It Works

```
User marks a task complete in the existing task UI
        ↓
TasksService emits a TaskCompletedEvent (NestJS EventEmitter)
        ↓
BuddyService listens for TaskCompletedEvent
        ↓
BuddyService calculates Sunlight award based on task type
        ↓
BuddyService updates Buddy.sunlightToday and Buddy.dewdrops
        ↓
BuddyService checks if sunlight bar is full (>= 100)
        ↓
If full: BuddyService flags buddy as journey-ready
        ↓
Frontend polls /buddy or receives WebSocket push
        ↓
Journey button becomes active on Buddy home screen
```

---

## Event Implementation

### In TasksService (existing file — add event emit)

```typescript
// apps/api/src/tasks/tasks.service.ts
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskCompletedEvent } from './events/task-completed.event';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async completeTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: TaskStatus.COMPLETED, completedAt: new Date() },
    });

    // Emit event for buddy system to consume
    this.eventEmitter.emit(
      'task.completed',
      new TaskCompletedEvent(userId, taskId, task.taskType, task.plantId),
    );

    return task;
  }
}
```

### TaskCompletedEvent DTO

```typescript
// apps/api/src/tasks/events/task-completed.event.ts
export class TaskCompletedEvent {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly taskType: string,
    public readonly plantId: string | null,
  ) {}
}
```

### In BuddyService (new file — listen and react)

```typescript
// apps/api/src/buddy/buddy.service.ts
import { OnEvent } from '@nestjs/event-emitter';
import { TaskCompletedEvent } from '../tasks/events/task-completed.event';

@Injectable()
export class BuddyService {
  @OnEvent('task.completed')
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    const buddy = await this.prisma.buddy.findUnique({
      where: { userId: event.userId },
    });

    if (!buddy) return; // user hasn't set up a buddy yet

    const sunlight = this.calculateSunlight(event.taskType, buddy.speciesId);

    await this.prisma.buddy.update({
      where: { id: buddy.id },
      data: {
        sunlightToday: Math.min(buddy.sunlightToday + sunlight, 100),
        dewdrops: buddy.dewdrops + 3,
        tasksToday: buddy.tasksToday + 1,
        lastTaskDate: new Date(),
        mood: 'HAPPY',
      },
    });
  }

  private calculateSunlight(taskType: string, speciesId: string): number {
    const base = SUNLIGHT_BY_TASK_TYPE[taskType] ?? 8;
    const multiplier = SPECIES_MULTIPLIERS[speciesId]?.[taskType] ?? 1.0;
    return Math.round(base * multiplier);
  }
}
```

---

## Sunlight Award Table

```typescript
// apps/api/src/buddy/constants/sunlight-awards.ts
export const SUNLIGHT_BY_TASK_TYPE: Record<string, number> = {
  WATERING:       10,
  FERTILIZING:    10,
  REPOTTING:      15,
  PRUNING:        10,
  PEST_CHECK:     8,
  MISTING:        7,
  ROTATING:       6,
  SOIL_CHECK:     5,
  JOURNAL:        12,
  PHOTO:          8,
  PROPAGATION:    15,
  HUMIDITY_CHECK: 5,
  SEASONAL_CHECK: 10,
  CUSTOM:         8,  // default for user-created tasks
};

export const SPECIES_MULTIPLIERS: Record<string, Record<string, number>> = {
  sunflower: {
    // Sunny earns 20% more on everything
    _default: 1.2,
  },
  succulent: {
    // Rosie earns 25% more on light tasks
    ROTATING: 1.25,
    SEASONAL_CHECK: 1.25,
  },
  bamboo: {
    // Bam gets streak bonus applied separately
    _default: 1.0,
  },
};
```

---

## Preset Task Templates

These are the built-in task suggestions shown to users when creating tasks. They map to Buddy's Sunlight categories:

```typescript
// apps/api/src/tasks/constants/task-templates.ts
export const BUDDY_TASK_TEMPLATES = [
  {
    label: 'Water my plants',
    taskType: 'WATERING',
    icon: '💧',
    sunlight: 10,
    recurrence: 'EVERY_N_DAYS',
    recurrenceDays: 7,
    difficulty: 'MEDIUM',
  },
  {
    label: 'Check for pests',
    taskType: 'PEST_CHECK',
    icon: '🔍',
    sunlight: 8,
    recurrence: 'WEEKLY',
    difficulty: 'MEDIUM',
  },
  {
    label: 'Rotate for sunlight',
    taskType: 'ROTATING',
    icon: '🔄',
    sunlight: 6,
    recurrence: 'WEEKLY',
    difficulty: 'QUICK',
  },
  {
    label: 'Fertilize',
    taskType: 'FERTILIZING',
    icon: '🌿',
    sunlight: 10,
    recurrence: 'MONTHLY',
    difficulty: 'MEDIUM',
  },
  {
    label: 'Mist the leaves',
    taskType: 'MISTING',
    icon: '🌬️',
    sunlight: 7,
    recurrence: 'EVERY_N_DAYS',
    recurrenceDays: 3,
    difficulty: 'QUICK',
  },
  {
    label: 'Check soil moisture',
    taskType: 'SOIL_CHECK',
    icon: '🪴',
    sunlight: 5,
    recurrence: 'EVERY_N_DAYS',
    recurrenceDays: 2,
    difficulty: 'QUICK',
  },
  {
    label: 'Write a journal entry',
    taskType: 'JOURNAL',
    icon: '📓',
    sunlight: 12,
    recurrence: 'WEEKLY',
    difficulty: 'LONG',
  },
  {
    label: 'Take a progress photo',
    taskType: 'PHOTO',
    icon: '📸',
    sunlight: 8,
    recurrence: 'MONTHLY',
    difficulty: 'QUICK',
  },
  {
    label: 'Repot a plant',
    taskType: 'REPOTTING',
    icon: '🪣',
    sunlight: 15,
    recurrence: 'YEARLY',
    difficulty: 'BIG',
  },
  {
    label: 'Propagate a cutting',
    taskType: 'PROPAGATION',
    icon: '✂️',
    sunlight: 15,
    recurrence: 'AS_NEEDED',
    difficulty: 'BIG',
  },
];
```

---

## Daily Reset

The scheduler module (already exists in the app) handles the midnight reset:

```typescript
// Add to existing scheduler module
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async resetDailySunlight(): Promise<void> {
  await this.prisma.buddy.updateMany({
    data: {
      sunlightToday: 0,
      tasksToday: 0,
      lastResetDate: new Date(),
    },
  });
}
```

---

## Streak Tracking

Also handled by the scheduler:

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async updateStreaks(): Promise<void> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Break streaks for users who did nothing yesterday
  await this.prisma.buddy.updateMany({
    where: {
      lastTaskDate: { lt: startOfDay(yesterday) },
      streakDays: { gt: 0 },
    },
    data: { streakDays: 0 },
  });

  // Increment streaks for users who completed tasks yesterday
  const activeUsers = await this.prisma.buddy.findMany({
    where: {
      lastTaskDate: {
        gte: startOfDay(yesterday),
        lt: endOfDay(yesterday),
      },
    },
  });

  for (const buddy of activeUsers) {
    const newStreak = buddy.streakDays + 1;
    await this.prisma.buddy.update({
      where: { id: buddy.id },
      data: {
        streakDays: newStreak,
        longestStreak: Math.max(newStreak, buddy.longestStreak),
        dewdrops: buddy.dewdrops + this.getStreakBonus(newStreak),
      },
    });
  }
}

private getStreakBonus(streak: number): number {
  const bonuses: Record<number, number> = {
    3: 10, 7: 50, 14: 75, 30: 200, 60: 300, 100: 500, 365: 1000,
  };
  return bonuses[streak] ?? 0;
}
```
