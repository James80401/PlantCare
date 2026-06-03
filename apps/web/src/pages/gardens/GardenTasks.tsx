import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { parseISO, startOfDay } from 'date-fns';
import TaskRow from '../../components/tasks/TaskRow';
import { PageHeader, Card, SkeletonTaskRows } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { useGardenDetail } from '../../hooks/useGardenDetail';
import { tasksApi } from '../../services/api';
import type { TaskItemSummary } from '../../services/api';

/** Garden-scoped task list: this garden's pending tasks, grouped overdue / today / upcoming. */
export default function GardenTasks() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const { garden, loading, error, reload } = useGardenDetail(gardenId);

  const groups = useMemo(() => bucketTasks(garden?.tasks ?? []), [garden?.tasks]);

  const complete = async (id: string, feedback?: Parameters<typeof tasksApi.complete>[1]) => {
    await tasksApi.complete(id, feedback);
    await reload();
  };
  const skip = async (id: string, feedback?: Parameters<typeof tasksApi.skip>[1]) => {
    await tasksApi.skip(id, feedback);
    await reload();
  };
  const snooze = async (id: string, days: 1 | 3 | 7) => {
    await tasksApi.snooze(id, days);
    await reload();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tasks" />
        <SkeletonTaskRows count={5} />
      </div>
    );
  }
  if (error || !garden) {
    return (
      <div className="space-y-4">
        <BackLink gardenId={gardenId} />
        <FormError>{error || 'Garden not found.'}</FormError>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink gardenId={gardenId} name={garden.name} />
      <PageHeader
        eyebrow={garden.name}
        title="Tasks"
        description={`${groups.overdue.length} overdue · ${groups.today.length} due today · ${groups.upcoming.length} upcoming`}
      />

      {garden.tasks.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-gray-600">No pending tasks in this garden. You're all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <TaskGroup title="Overdue" tasks={groups.overdue} onComplete={complete} onSkip={skip} onSnooze={snooze} />
          <TaskGroup title="Due today" tasks={groups.today} onComplete={complete} onSkip={skip} onSnooze={snooze} />
          <TaskGroup title="Upcoming" tasks={groups.upcoming} onComplete={complete} onSkip={skip} onSnooze={snooze} />
        </div>
      )}
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  onComplete,
  onSkip,
  onSnooze,
}: {
  title: string;
  tasks: TaskItemSummary[];
  onComplete: (id: string, feedback?: Parameters<typeof tasksApi.complete>[1]) => void;
  onSkip: (id: string, feedback?: Parameters<typeof tasksApi.skip>[1]) => void;
  onSnooze: (id: string, days: 1 | 3 | 7) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
        {title} ({tasks.length})
      </h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            animState={null}
            onComplete={onComplete}
            onSkip={onSkip}
            onSnooze={onSnooze}
            linkPlant
          />
        ))}
      </ul>
    </section>
  );
}

function BackLink({ gardenId, name }: { gardenId?: string; name?: string }) {
  return (
    <Link
      to={`/garden/gardens/${gardenId ?? ''}`}
      className="text-sm font-medium text-emerald-700 hover:underline"
    >
      ← {name ?? 'Garden'}
    </Link>
  );
}

function bucketTasks(tasks: TaskItemSummary[]) {
  const todayStart = startOfDay(new Date());
  const tomorrowStart = startOfDay(new Date(todayStart.getTime() + 86_400_000));
  const overdue: TaskItemSummary[] = [];
  const today: TaskItemSummary[] = [];
  const upcoming: TaskItemSummary[] = [];
  for (const t of tasks) {
    const due = parseISO(t.dueDate);
    if (due < todayStart) overdue.push(t);
    else if (due < tomorrowStart) today.push(t);
    else upcoming.push(t);
  }
  return { overdue, today, upcoming };
}
