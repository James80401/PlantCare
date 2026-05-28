import { useCallback, useState } from 'react';
import { tasksApi } from '../services/api';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../utils/taskFeedback';
import type { TaskItem } from '../utils/taskGroups';

const COMPLETE_ANIM_MS = 650;

export type TaskAnimMap = Record<string, 'completing' | 'skipping'>;

/** Local task mutations for dashboard preview rows (complete / skip / snooze). */
export function useDashboardTaskActions(
  initialTasks: TaskItem[],
  onRefresh: () => Promise<void>,
) {
  const [tasks, setTasks] = useState(initialTasks);
  const [animating, setAnimating] = useState<TaskAnimMap>({});

  const syncTasks = useCallback((next: TaskItem[]) => {
    setTasks(next);
  }, []);

  const patchTask = (id: string, patch: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const runWithAnimation = async (
    id: string,
    kind: 'completing' | 'skipping',
    apiCall: () => Promise<{ data: TaskItem }>,
  ) => {
    setAnimating((a) => ({ ...a, [id]: kind }));
    try {
      const { data } = await apiCall();
      await new Promise((r) => setTimeout(r, COMPLETE_ANIM_MS));
      patchTask(id, { status: data.status, completedAt: data.completedAt });
    } catch {
      await onRefresh();
    } finally {
      setAnimating((a) => {
        const next = { ...a };
        delete next[id];
        return next;
      });
    }
  };

  const handleComplete = (id: string, feedback?: TaskCompleteFeedback) => {
    void runWithAnimation(id, 'completing', () => tasksApi.complete(id, feedback));
  };

  const handleSkip = (id: string, feedback?: TaskSkipFeedback) => {
    void runWithAnimation(id, 'skipping', () => tasksApi.skip(id, feedback));
  };

  const handleSnooze = async (id: string, days: 1 | 3 | 7) => {
    try {
      const { data } = await tasksApi.snooze(id, days);
      patchTask(id, { dueDate: data.dueDate });
    } catch {
      await onRefresh();
    }
  };

  return {
    tasks,
    animating,
    syncTasks,
    handleComplete,
    handleSkip,
    handleSnooze,
    COMPLETE_ANIM_MS,
  };
}
