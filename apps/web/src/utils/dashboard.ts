import { addDays, compareAsc, format, parseISO, startOfDay } from 'date-fns';
import type { DayGroup, TaskItem } from './taskGroups';

export interface DashboardTaskPreview {
  dueDate: string;
  taskType: string;
  status: string;
}

export interface DashboardPlant {
  id: string;
  nickname?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  species: {
    commonName: string;
    scientificName?: string | null;
    sunlight?: string | null;
    wateringFreqDays: number;
  };
  tasks: DashboardTaskPreview[];
}

export interface AttentionPlant {
  plant: DashboardPlant;
  reason: string;
  tone: 'urgent' | 'warning' | 'info';
  nextTask?: DashboardTaskPreview;
}

export interface WeekPreviewDay {
  key: string;
  label: string;
  dateLabel: string;
  count: number;
}

export interface SuggestedAction {
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}

export function getPendingTasks(tasks: TaskItem[]) {
  return tasks.filter((task) => task.status === 'PENDING');
}

export function getOverdueTasks(tasks: TaskItem[], currentDate = new Date()) {
  const today = startOfDay(currentDate);
  return tasks
    .filter((task) => task.status === 'PENDING' && startOfDay(parseISO(task.dueDate)) < today)
    .sort(sortTasksByDue);
}

export function getTodayTasks(tasks: TaskItem[], currentDate = new Date()) {
  const today = startOfDay(currentDate).getTime();
  return tasks
    .filter(
      (task) =>
        task.status === 'PENDING' && startOfDay(parseISO(task.dueDate)).getTime() === today,
    )
    .sort(sortTasksByDue);
}

export function getCompletedTaskCount(tasks: TaskItem[]) {
  return tasks.filter((task) => task.status === 'DONE').length;
}

export function getGardenScore(plantCount: number, overdueCount: number, todayCount: number) {
  if (plantCount === 0) return 0;
  return Math.max(45, Math.min(100, 100 - overdueCount * 12 - todayCount * 2));
}

export function getFocusDayGroups(dayGroups: DayGroup[], currentDate = new Date()) {
  const today = startOfDay(currentDate);
  const end = addDays(today, 3);
  const overdue = dayGroups.filter((group) => group.pending.length > 0 && group.date < today);
  const nearTerm = dayGroups.filter(
    (group) => group.pending.length > 0 && group.date >= today && group.date <= end,
  );
  return [...overdue.slice(0, 1), ...nearTerm].slice(0, 4);
}

export function buildWeekPreview(
  tasks: TaskItem[],
  currentDate = new Date(),
): WeekPreviewDay[] {
  const pendingTasks = getPendingTasks(tasks);
  const today = startOfDay(currentDate);

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const count = pendingTasks.filter(
      (task) => startOfDay(parseISO(task.dueDate)).getTime() === date.getTime(),
    ).length;

    return {
      key: format(date, 'yyyy-MM-dd'),
      label: index === 0 ? 'Today' : format(date, 'EEE'),
      dateLabel: format(date, 'MMM d'),
      count,
    };
  });
}

export function buildAttentionPlants(
  plants: DashboardPlant[],
  tasks: TaskItem[],
  currentDate = new Date(),
): AttentionPlant[] {
  const today = startOfDay(currentDate);

  return plants
    .map((plant): AttentionPlant | null => {
      const plantTasks = tasks.filter((task) => task.plant.id === plant.id);
      const nextTask = findNextTaskForPlant(plant, tasks);
      const overdueCount = plantTasks.filter(
        (task) => task.status === 'PENDING' && startOfDay(parseISO(task.dueDate)) < today,
      ).length;
      const dueTodayCount = plantTasks.filter(
        (task) =>
          task.status === 'PENDING' &&
          startOfDay(parseISO(task.dueDate)).getTime() === today.getTime(),
      ).length;

      if (overdueCount > 0) {
        return {
          plant,
          reason: `${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`,
          tone: 'urgent',
          nextTask,
        };
      }

      if (dueTodayCount > 0) {
        return {
          plant,
          reason: `${dueTodayCount} task${dueTodayCount === 1 ? '' : 's'} due today`,
          tone: 'warning',
          nextTask,
        };
      }

      if (!plant.imageUrl) {
        return {
          plant,
          reason: 'Add a photo to make progress tracking more useful',
          tone: 'info',
          nextTask,
        };
      }

      if (!nextTask) {
        return {
          plant,
          reason: 'No upcoming task found in the current window',
          tone: 'info',
        };
      }

      return null;
    })
    .filter((item): item is AttentionPlant => Boolean(item));
}

export function findNextTaskForPlant(plant: DashboardPlant, tasks: TaskItem[]) {
  const fromTaskList = tasks
    .filter((task) => task.plant.id === plant.id && task.status === 'PENDING')
    .sort(sortTasksByDue)[0];
  const fromPlantPreview = plant.tasks.find((task) => task.status === 'PENDING') ?? plant.tasks[0];
  return fromTaskList ?? fromPlantPreview;
}

export function getSuggestedAction(
  plants: DashboardPlant[],
  overdueTasks: TaskItem[],
  todayTasks: TaskItem[],
): SuggestedAction {
  if (plants.length === 0) {
    return {
      title: 'Add your first plant',
      body: 'Start with a plant you already own. The app will generate a schedule and care profile.',
      actionLabel: 'Add plant',
      actionTo: '/garden/plants/new',
    };
  }

  if (overdueTasks.length > 0) {
    return {
      title: 'Catch up gently',
      body: 'Start with the oldest overdue task, then open the care instructions if the plant looks stressed.',
      actionLabel: 'Review overdue',
      actionTo: '/garden/tasks',
    };
  }

  if (todayTasks.length > 0) {
    return {
      title: 'Finish today strong',
      body: 'Complete the tasks due today and use skip only when the plant does not need the care yet.',
      actionLabel: "Do today's care",
      actionTo: '/garden/tasks',
    };
  }

  return {
    title: 'Log a quick observation',
    body: 'Add a note or photo to a plant profile so future diagnoses and care advice have better context.',
    actionLabel: 'Open garden',
    actionTo: '#plants',
  };
}

export function getSeasonalTip(plantCount: number, currentDate = new Date()) {
  if (plantCount === 0) {
    return 'Once you add plants, this space can surface seasonal tips based on your garden and location.';
  }

  const month = currentDate.getMonth();
  if (month <= 1 || month === 11) {
    return 'Winter care usually means slower growth: check soil before watering and reduce fertilizer unless a plant is actively growing.';
  }
  if (month >= 2 && month <= 4) {
    return 'Spring is a good time to inspect roots, refresh soil, prune leggy growth, and restart fertilizer for active growers.';
  }
  if (month >= 5 && month <= 7) {
    return 'Warm weather can dry pots faster. Watch outdoor plants, sun-facing windows, and small containers closely.';
  }
  return 'Fall is a transition period: slow fertilizer, inspect for pests before moving plants indoors, and adjust watering as light drops.';
}

export function scoreLabel(score: number) {
  if (score >= 90) return 'Thriving';
  if (score >= 75) return 'Steady';
  if (score >= 60) return 'Needs a check';
  return 'Needs attention';
}

export function sortTasksByDue(a: TaskItem, b: TaskItem) {
  return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
}
