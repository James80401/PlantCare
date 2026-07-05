import {
  compareAsc,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  parseISO,
  startOfDay,
} from 'date-fns';

export interface TaskItem {
  id: string;
  taskType: string;
  dueDate: string;
  status: string;
  completedAt?: string | null;
  plant: {
    id: string;
    nickname?: string | null;
    imageUrl?: string | null;
    garden?: { id: string; name: string } | null;
    species: { commonName: string };
  };
}

export interface PlantCareRoundItem {
  plant: TaskItem['plant'];
  tasks: TaskItem[];
  oldestDueDate: string;
}

export interface CareTypeRound {
  taskType: string;
  plants: PlantCareRoundItem[];
  taskIds: string[];
}

export interface GardenCareRound {
  gardenId: string;
  gardenName: string;
  careTypes: CareTypeRound[];
  taskIds: string[];
}

export function groupDueTasksIntoCareRounds(
  tasks: TaskItem[],
  now = new Date(),
): GardenCareRound[] {
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const pendingDue = tasks.filter(
    (task) => task.status === 'PENDING' && parseISO(task.dueDate) <= endOfToday,
  );
  const gardens = new Map<string, { name: string; tasks: TaskItem[] }>();

  for (const task of pendingDue) {
    const gardenId = task.plant.garden?.id ?? 'ungrouped';
    const gardenName = task.plant.garden?.name ?? 'My garden';
    const garden = gardens.get(gardenId) ?? { name: gardenName, tasks: [] };
    garden.tasks.push(task);
    gardens.set(gardenId, garden);
  }

  return [...gardens.entries()]
    .map(([gardenId, garden]) => {
      const careTypes = groupTasksByType(garden.tasks).map(({ taskType, tasks: typeTasks }) => {
        const plants = new Map<string, TaskItem[]>();
        for (const task of typeTasks) {
          const plantTasks = plants.get(task.plant.id) ?? [];
          plantTasks.push(task);
          plants.set(task.plant.id, plantTasks);
        }
        return {
          taskType,
          plants: [...plants.values()].map((plantTasks) => ({
            plant: plantTasks[0].plant,
            tasks: plantTasks,
            oldestDueDate: [...plantTasks]
              .sort((a, b) => compareAsc(parseISO(a.dueDate), parseISO(b.dueDate)))[0].dueDate,
          })),
          taskIds: typeTasks.map((task) => task.id),
        };
      });
      return {
        gardenId,
        gardenName: garden.name,
        careTypes,
        taskIds: garden.tasks.map((task) => task.id),
      };
    })
    .sort((a, b) => a.gardenName.localeCompare(b.gardenName));
}

export interface DayGroup {
  dateKey: string;
  date: Date;
  label: string;
  pending: TaskItem[];
  done: TaskItem[];
  skipped: TaskItem[];
  total: number;
}

export function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMM d');
}

export function groupTasksByDay(tasks: TaskItem[]): DayGroup[] {
  const map = new Map<string, TaskItem[]>();

  for (const task of tasks) {
    const key = format(startOfDay(parseISO(task.dueDate)), 'yyyy-MM-dd');
    const list = map.get(key) ?? [];
    list.push(task);
    map.set(key, list);
  }

  const today = startOfDay(new Date());

  const groups: DayGroup[] = [...map.entries()].map(([dateKey, dayTasks]) => {
    const date = parseISO(dateKey);
    const pending = dayTasks.filter((t) => t.status === 'PENDING');
    const done = dayTasks.filter((t) => t.status === 'DONE');
    const skipped = dayTasks.filter((t) => t.status === 'SKIPPED');
    return {
      dateKey,
      date,
      label: dayLabel(date),
      pending,
      done,
      skipped,
      total: dayTasks.length,
    };
  });

  groups.sort((a, b) => {
    const aPast = a.date < today;
    const bPast = b.date < today;
    if (aPast && bPast) return compareAsc(b.date, a.date);
    if (aPast) return 1;
    if (bPast) return -1;
    return compareAsc(a.date, b.date);
  });

  return groups;
}

/** Display order for grouping to-dos by care category. */
export const TASK_TYPE_ORDER: string[] = [
  'WATER',
  'CHECK_MOISTURE',
  'MIST',
  'FERTILIZE',
  'PRUNE',
  'ROTATE',
  'CLEAN_LEAVES',
  'INSPECT_PESTS',
  'PEST_CONTROL',
  'PH_TEST',
  'REPOT',
  'HEALTH_CHECK',
];

export interface TaskTypeGroup {
  taskType: string;
  tasks: TaskItem[];
}

export function groupTasksByType(tasks: TaskItem[]): TaskTypeGroup[] {
  const map = new Map<string, TaskItem[]>();

  for (const task of tasks) {
    const list = map.get(task.taskType) ?? [];
    list.push(task);
    map.set(task.taskType, list);
  }

  const sortByDue = (list: TaskItem[]) =>
    [...list].sort((a, b) => compareAsc(parseISO(a.dueDate), parseISO(b.dueDate)));

  const groups: TaskTypeGroup[] = TASK_TYPE_ORDER.filter((type) => map.has(type)).map(
    (taskType) => ({
      taskType,
      tasks: sortByDue(map.get(taskType)!),
    }),
  );

  for (const [taskType, list] of map) {
    if (!TASK_TYPE_ORDER.includes(taskType)) {
      groups.push({ taskType, tasks: sortByDue(list) });
    }
  }

  return groups;
}
