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
    species: { commonName: string };
  };
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

export const TASK_TYPE_ICONS: Record<string, string> = {
  WATER: '💧',
  FERTILIZE: '🌱',
  PRUNE: '✂️',
  MIST: '🌫️',
  PH_TEST: '🧪',
  PEST_CONTROL: '🐛',
  REPOT: '🪴',
  ROTATE: '🔄',
  CLEAN_LEAVES: '🧽',
  INSPECT_PESTS: '🔍',
  CHECK_MOISTURE: '👆',
  HEALTH_CHECK: '❤️',
};

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
