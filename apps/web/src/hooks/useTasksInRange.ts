import { useCallback, useEffect, useMemo, useState } from 'react';
import { isToday } from 'date-fns';
import { tasksApi } from '../services/api';
import { trackOnce } from '../utils/analytics';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../utils/taskFeedback';
import { groupTasksByDay, type TaskItem } from '../utils/taskGroups';

const COMPLETE_ANIM_MS = 650;
const SNOOZE_ANIM_MS = 300;

export type TaskAnimMap = Record<string, 'completing' | 'skipping' | 'snoozing'>;

export interface UseTasksInRangeOptions {
  pastDays?: number;
  futureDays?: number;
}

export function useTasksInRange(options: UseTasksInRangeOptions = {}) {
  const pastDays = options.pastDays ?? 14;
  const futureDays = options.futureDays ?? 45;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState<TaskAnimMap>({});
  const [actionError, setActionError] = useState('');

  const load = useCallback(() => {
    const from = new Date();
    from.setDate(from.getDate() - pastDays);
    const to = new Date();
    to.setDate(to.getDate() + futureDays);
    return tasksApi
      .list(from.toISOString().split('T')[0], to.toISOString().split('T')[0])
      .then((r) => setTasks(r.data))
      .finally(() => setLoading(false));
  }, [pastDays, futureDays]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'PENDING').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const todayPending = tasks.filter(
      (t) => t.status === 'PENDING' && isToday(new Date(t.dueDate)),
    ).length;
    return { pending, done, todayPending };
  }, [tasks]);

  const patchTask = (id: string, patch: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const runWithAnimation = async (
    id: string,
    kind: 'completing' | 'skipping',
    apiCall: () => Promise<{ data: TaskItem }>,
  ) => {
    setActionError('');
    setAnimating((a) => ({ ...a, [id]: kind }));
    try {
      const { data } = await apiCall();
      if (kind === 'completing') {
        trackOnce('first_task_completed', 'first_task_completed', { source: 'tasks_in_range' });
      }
      await new Promise((r) => setTimeout(r, COMPLETE_ANIM_MS));
      patchTask(id, { status: data.status, completedAt: data.completedAt });
      return true;
    } catch {
      setActionError(
        kind === 'completing'
          ? 'Could not complete that task. Your task list was restored.'
          : 'Could not skip that task. Your task list was restored.',
      );
      await load();
      return false;
    } finally {
      setAnimating((a) => {
        const next = { ...a };
        delete next[id];
        return next;
      });
    }
  };

  const handleComplete = (id: string, feedback?: TaskCompleteFeedback) => {
    return runWithAnimation(id, 'completing', () => tasksApi.complete(id, feedback));
  };

  const handleBulkComplete = async (ids: string[]) => {
    setActionError('');
    const uniqueIds = [...new Set(ids)];
    setAnimating((current) => ({
      ...current,
      ...Object.fromEntries(uniqueIds.map((id) => [id, 'completing' as const])),
    }));
    try {
      const { data } = await tasksApi.bulkComplete(uniqueIds);
      setTasks((current) =>
        current.map((task) =>
          data.taskIds.includes(task.id)
            ? { ...task, status: 'DONE', completedAt: data.completedAt }
            : task,
        ),
      );
    } catch {
      setActionError('Could not complete that care round. Your task list was restored.');
      await load();
    } finally {
      setAnimating((current) => {
        const next = { ...current };
        uniqueIds.forEach((id) => delete next[id]);
        return next;
      });
    }
  };

  const handleSkip = (id: string, feedback?: TaskSkipFeedback) => {
    return runWithAnimation(id, 'skipping', () => tasksApi.skip(id, feedback));
  };

  const handleSnooze = async (id: string, days: 1 | 3 | 7) => {
    setActionError('');
    setAnimating((a) => ({ ...a, [id]: 'snoozing' }));
    try {
      const { data } = await tasksApi.snooze(id, days);
      await new Promise((r) => setTimeout(r, SNOOZE_ANIM_MS));
      patchTask(id, { dueDate: data.dueDate });
    } catch {
      setActionError('Could not snooze that task. Your task list was restored.');
      await load();
    } finally {
      setAnimating((a) => {
        const next = { ...a };
        delete next[id];
        return next;
      });
    }
  };

  return {
    tasks,
    loading,
    animating,
    actionError,
    summary,
    dayGroups: groupTasksByDay(tasks),
    load,
    handleComplete,
    handleBulkComplete,
    handleSkip,
    handleSnooze,
    COMPLETE_ANIM_MS,
    SNOOZE_ANIM_MS,
  };
}
