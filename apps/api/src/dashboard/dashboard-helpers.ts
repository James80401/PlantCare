import {
  addDays,
  compareAsc,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';

export interface TaskLike {
  id: string;
  taskType: string;
  dueDate: Date | string;
  status: string;
  completedAt?: Date | string | null;
  plant: {
    id: string;
    nickname?: string | null;
    imageUrl?: string | null;
    species: { commonName: string };
  };
}

export interface PlantLike {
  id: string;
  nickname?: string | null;
  imageUrl?: string | null;
  createdAt: Date | string;
  location?: string | null;
  species: { commonName: string; wateringFreqDays: number };
}

export interface UnresolvedDiagnosisLike {
  plantId: string;
  resultLabel: string;
  createdAt: Date | string;
}

export function sortTasksByDue(a: TaskLike, b: TaskLike) {
  return compareAsc(
    startOfDay(typeof a.dueDate === 'string' ? parseISO(a.dueDate) : a.dueDate),
    startOfDay(typeof b.dueDate === 'string' ? parseISO(b.dueDate) : b.dueDate),
  );
}

export function getPendingTasks(tasks: TaskLike[]) {
  return tasks.filter((t) => t.status === 'PENDING');
}

export function getOverdueTasks(tasks: TaskLike[], currentDate = new Date()) {
  const today = startOfDay(currentDate);
  return getPendingTasks(tasks)
    .filter((task) => {
      const due = startOfDay(
        typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate,
      );
      return due < today;
    })
    .sort(sortTasksByDue);
}

export function getTodayTasks(tasks: TaskLike[], currentDate = new Date()) {
  const today = startOfDay(currentDate).getTime();
  return getPendingTasks(tasks)
    .filter((task) => {
      const due = startOfDay(
        typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate,
      );
      return due.getTime() === today;
    })
    .sort(sortTasksByDue);
}

export function getTasksCompletedToday(tasks: TaskLike[], currentDate = new Date()) {
  const today = startOfDay(currentDate).getTime();
  return tasks
    .filter((task) => {
      if (task.status !== 'DONE') return false;
      const when = task.completedAt
        ? typeof task.completedAt === 'string'
          ? parseISO(task.completedAt)
          : task.completedAt
        : typeof task.dueDate === 'string'
          ? parseISO(task.dueDate)
          : task.dueDate;
      return startOfDay(when).getTime() === today;
    })
    .sort(sortTasksByDue);
}

export function getGardenScore(
  plantCount: number,
  overdueCount: number,
  todayCount: number,
  recentCompletions = 0,
) {
  if (plantCount === 0) return 0;
  const boost = Math.min(8, Math.min(4, recentCompletions) * 2);
  const raw = 100 - overdueCount * 10 - todayCount * 2 + boost;
  return Math.max(50, Math.min(100, raw));
}

export function getCareStreak(tasks: TaskLike[], currentDate = new Date()) {
  const completionDays = new Set(
    tasks
      .filter((t) => t.status === 'DONE' && t.completedAt)
      .map((t) =>
        format(
          startOfDay(
            typeof t.completedAt === 'string' ? parseISO(t.completedAt!) : t.completedAt!,
          ),
          'yyyy-MM-dd',
        ),
      ),
  );
  if (completionDays.size === 0) return 0;

  let streak = 0;
  let day = startOfDay(currentDate);
  if (!completionDays.has(format(day, 'yyyy-MM-dd'))) {
    day = addDays(day, -1);
  }
  while (completionDays.has(format(day, 'yyyy-MM-dd'))) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function getOldestPlantAgeDays(
  plantCreatedAts: Array<Date | string>,
  currentDate = new Date(),
) {
  if (plantCreatedAts.length === 0) return 0;
  const dates = plantCreatedAts.map((v) =>
    startOfDay(typeof v === 'string' ? parseISO(v) : v),
  );
  const oldest = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
  return Math.max(0, differenceInCalendarDays(startOfDay(currentDate), oldest));
}

export function buildWeekPreview(tasks: TaskLike[], currentDate = new Date()) {
  const pending = getPendingTasks(tasks);
  const today = startOfDay(currentDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const count = pending.filter((task) => {
      const due = startOfDay(
        typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate,
      );
      return due.getTime() === date.getTime();
    }).length;

    return {
      date: format(date, 'yyyy-MM-dd'),
      label: index === 0 ? 'Today' : format(date, 'EEE'),
      dateLabel: format(date, 'MMM d'),
      count,
    };
  });
}

export function buildAttention(
  plants: PlantLike[],
  tasks: TaskLike[],
  currentDate = new Date(),
  unresolvedDiagnoses: UnresolvedDiagnosisLike[] = [],
) {
  const today = startOfDay(currentDate);
  const diagnosisCutoff = addDays(today, -14);

  const diagnosisByPlant = new Map<string, UnresolvedDiagnosisLike>();
  for (const diagnosis of unresolvedDiagnoses) {
    const created = startOfDay(
      typeof diagnosis.createdAt === 'string'
        ? parseISO(diagnosis.createdAt)
        : diagnosis.createdAt,
    );
    if (created < diagnosisCutoff) continue;
    if (!diagnosisByPlant.has(diagnosis.plantId)) {
      diagnosisByPlant.set(diagnosis.plantId, diagnosis);
    }
  }

  return plants
    .map((plant) => {
      const plantTasks = tasks.filter((t) => t.plant.id === plant.id);
      const plantName = plant.nickname || plant.species.commonName;
      const overdueCount = plantTasks.filter((task) => {
        if (task.status !== 'PENDING') return false;
        const due = startOfDay(
          typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate,
        );
        return due < today;
      }).length;
      const dueTodayCount = plantTasks.filter((task) => {
        if (task.status !== 'PENDING') return false;
        const due = startOfDay(
          typeof task.dueDate === 'string' ? parseISO(task.dueDate) : task.dueDate,
        );
        return due.getTime() === today.getTime();
      }).length;

      if (overdueCount > 0) {
        return {
          plantId: plant.id,
          plantName,
          reason: `${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`,
          priority: 'urgent' as const,
        };
      }
      if (dueTodayCount > 0) {
        return {
          plantId: plant.id,
          plantName,
          reason: `${dueTodayCount} task${dueTodayCount === 1 ? '' : 's'} due today`,
          priority: 'warning' as const,
        };
      }
      const openDiagnosis = diagnosisByPlant.get(plant.id);
      if (openDiagnosis) {
        return {
          plantId: plant.id,
          plantName,
          reason: `Unresolved diagnosis: ${openDiagnosis.resultLabel}`,
          priority: 'warning' as const,
        };
      }
      if (!plant.imageUrl) {
        return {
          plantId: plant.id,
          plantName,
          reason: 'Add a photo for better progress tracking',
          priority: 'info' as const,
        };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6);
}

export function getStatusLine(
  plantCount: number,
  dueToday: number,
  overdue: number,
): string {
  if (plantCount === 0) {
    return 'Add a plant and Plant Care will build your daily routine.';
  }
  if (overdue > 0) {
    return `${overdue} overdue · ${dueToday} due today · ${plantCount} plant${plantCount === 1 ? '' : 's'}`;
  }
  if (dueToday > 0) {
    return `${dueToday} task${dueToday === 1 ? '' : 's'} due today · ${plantCount} plant${plantCount === 1 ? '' : 's'}`;
  }
  return `All caught up today · ${plantCount} plant${plantCount === 1 ? '' : 's'}`;
}

export function pickTodayTasks(tasks: TaskLike[], limit = 5, currentDate = new Date()) {
  const overdue = getOverdueTasks(tasks, currentDate);
  const today = getTodayTasks(tasks, currentDate);
  const seen = new Set<string>();
  const merged: TaskLike[] = [];
  for (const task of [...overdue, ...today]) {
    if (seen.has(task.id)) continue;
    seen.add(task.id);
    merged.push(task);
    if (merged.length >= limit) break;
  }
  return merged;
}
