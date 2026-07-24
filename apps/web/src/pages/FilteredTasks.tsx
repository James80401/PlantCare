import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import TaskRow from '../components/tasks/TaskRow';
import { TaskActionNotice } from '../components/tasks/TaskActionNotice';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { trackEvent } from '../utils/analytics';
import type { TaskCompleteFeedback } from '../utils/taskFeedback';
import {
  getOverdueTasks,
  getTasksCompletedToday,
  getTodayTasks,
} from '../utils/dashboard';

const FILTER_META: Record<
  string,
  { title: string; description: string; empty: string }
> = {
  today: {
    title: 'Due today',
    description: 'Pending care tasks scheduled for today.',
    empty: 'Nothing due today — enjoy the calm.',
  },
  overdue: {
    title: 'Overdue',
    description: 'Pending tasks that were due before today.',
    empty: 'No overdue tasks. You are caught up.',
  },
  'completed-today': {
    title: 'Completed today',
    description: 'Tasks you finished today.',
    empty: 'No tasks completed yet today.',
  },
};

export default function FilteredTasks() {
  const { filter } = useParams<{ filter: string }>();
  const meta = filter ? FILTER_META[filter] : undefined;
  const { loading, tasks, animating, actionError, handleComplete, handleSkip, handleSnooze } = useTasksInRange({
    pastDays: 45,
    futureDays: 14,
  });

  const filtered = useMemo(() => {
    const now = new Date();
    switch (filter) {
      case 'today':
        return getTodayTasks(tasks, now);
      case 'overdue':
        return getOverdueTasks(tasks, now);
      case 'completed-today':
        return getTasksCompletedToday(tasks, now);
      default:
        return [];
    }
  }, [filter, tasks]);

  const onComplete = (id: string, _feedback?: TaskCompleteFeedback) => {
    trackEvent('task_completed');
    handleComplete(id, _feedback);
  };

  if (!meta) {
    return (
      <div className="mx-auto max-w-2xl pb-24">
        <p className="text-gray-600">Unknown task view.</p>
        <Link to="/garden/tasks" className="mt-2 text-sm text-emerald-700 hover:underline">
          All tasks
        </Link>
      </div>
    );
  }

  const showActions = filter === 'today' || filter === 'overdue';

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <header>
        <Link to="/garden" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-emerald-900">{meta.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{meta.description}</p>
        <Link
          to="/garden/tasks"
          className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          View all tasks by day
        </Link>
      </header>
      <TaskActionNotice message={actionError} />

      {loading ? (
        <p className="py-12 text-center text-gray-500">Loading tasks…</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-emerald-100 bg-white py-12 text-center text-gray-500">
          {meta.empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              animState={animating[task.id] ?? null}
              onComplete={showActions ? onComplete : () => {}}
              onSkip={showActions ? handleSkip : () => {}}
              onSnooze={showActions ? handleSnooze : undefined}
              linkPlant
            />
          ))}
        </ul>
      )}
    </div>
  );
}
