import { format } from 'date-fns';

export type TaskReminderRow = {
  taskType: string;
  plantId: string;
  dueDate: Date;
  plant: {
    nickname: string | null;
    species: { commonName: string };
  };
};

export function taskTypeLabel(taskType: string): string {
  return taskType
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function plantName(row: TaskReminderRow): string {
  return row.plant.nickname || row.plant.species.commonName;
}

export function buildCareReminderPush(
  tasks: TaskReminderRow[],
  options?: { overdue?: boolean },
): { title: string; body: string; route: string } {
  const overdue = options?.overdue ?? false;
  const prefix = overdue ? 'Overdue: ' : '';

  if (tasks.length === 1) {
    const t = tasks[0];
    const name = plantName(t);
    const label = taskTypeLabel(t.taskType);
    return {
      title: `${prefix}${label} for ${name}`,
      body: overdue
        ? `Was due ${format(t.dueDate, 'MMM d')} — open your plant to catch up`
        : `Due ${format(t.dueDate, 'MMM d')}`,
      route: `/garden/plants/${t.plantId}`,
    };
  }

  const lines = tasks.slice(0, 3).map((t) => `${taskTypeLabel(t.taskType)} · ${plantName(t)}`);
  const extra = tasks.length > 3 ? ` +${tasks.length - 3} more` : '';
  return {
    title: `${prefix}${tasks.length} care tasks need attention`,
    body: `${lines.join(', ')}${extra}`,
    route: '/garden/tasks',
  };
}
