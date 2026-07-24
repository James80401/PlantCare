import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTaskRows } from '../components/ui/Skeleton';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { CareRoundCard, careRoundKey, countOverdue } from '../components/tasks/CareRoundCard';
import { TaskActionNotice } from '../components/tasks/TaskActionNotice';
import { groupDueTasksIntoCareRounds } from '../utils/taskGroups';
import { snoozeTasksSequentially, type SnoozeDays } from '../utils/taskSnooze';

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const selectedGardenId = searchParams.get('garden');
  const { loading, tasks, animating, actionError, handleBulkComplete, handleSnooze } = useTasksInRange({
    pastDays: 3650,
    futureDays: 45,
  });
  const rounds = useMemo(() => {
    const grouped = groupDueTasksIntoCareRounds(tasks);
    return selectedGardenId
      ? grouped.filter((garden) => garden.gardenId === selectedGardenId)
      : grouped;
  }, [selectedGardenId, tasks]);
  const [busyGroup, setBusyGroup] = useState<string | null>(null);
  const [openRound, setOpenRound] = useState<string | null>(null);
  const autoOpenedRound = useRef(false);
  const duePlantCount = rounds.reduce(
    (total, garden) =>
      total + garden.careTypes.reduce((sum, careType) => sum + careType.plants.length, 0),
    0,
  );
  const dueTaskCount = rounds.reduce((total, garden) => total + garden.taskIds.length, 0);
  const overdueTaskCount = rounds.reduce(
    (total, garden) =>
      total +
      garden.careTypes.reduce(
        (sum, careType) => sum + careType.plants.reduce((plantSum, item) => plantSum + countOverdue(item), 0),
        0,
      ),
    0,
  );

  useEffect(() => {
    if (loading || rounds.length === 0) {
      setOpenRound(null);
      autoOpenedRound.current = false;
      return;
    }

    const roundKeys = rounds.flatMap((garden) =>
      garden.careTypes.map((careType) => careRoundKey(garden.gardenId, careType.taskType)),
    );
    if (!autoOpenedRound.current) {
      setOpenRound(roundKeys[0] ?? null);
      autoOpenedRound.current = true;
      return;
    }

    if (openRound && !roundKeys.includes(openRound)) {
      setOpenRound(roundKeys[0] ?? null);
    }
  }, [loading, openRound, rounds]);

  const completeGroup = async (key: string, ids: string[]) => {
    setBusyGroup(key);
    await handleBulkComplete(ids);
    setBusyGroup(null);
  };

  const snoozeGroup = async (key: string, ids: string[], days: SnoozeDays) => {
    setBusyGroup(key);
    await snoozeTasksSequentially(ids, days, handleSnooze);
    setBusyGroup(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <PageHeader
        title={selectedGardenId && rounds[0] ? `${rounds[0].gardenName} care rounds` : 'Garden care rounds'}
        description="Work by garden and care type. One tap completes a plant; the large check completes the whole round."
        help="tasks"
      />
      <TaskActionNotice message={actionError} />

      {selectedGardenId ? (
        <Link to="/garden/tasks" className="text-sm font-semibold text-emerald-700 hover:underline">
          Back to all gardens
        </Link>
      ) : null}

      {!loading ? (
        <CareLoopSummary
          duePlantCount={duePlantCount}
          dueTaskCount={dueTaskCount}
          overdueTaskCount={overdueTaskCount}
        />
      ) : null}

      {loading ? (
        <SkeletonTaskRows count={5} />
      ) : rounds.length === 0 ? (
        <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-12 text-center">
          <p className="font-semibold text-emerald-950">Nothing needs doing right now.</p>
          <p className="mt-1 text-sm text-gray-500">
            Enjoy the garden. We will surface the next useful round when it is ready.
          </p>
          <Link
            to="/garden/gardens"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            View gardens
          </Link>
        </div>
      ) : (
        rounds.map((garden) => (
          <section key={garden.gardenId} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Garden
                </p>
                <h2 className="font-display text-xl font-bold text-emerald-950">
                  {garden.gardenName}
                </h2>
              </div>
              {garden.gardenId !== 'ungrouped' ? (
                <Link
                  to={`/garden/gardens/${garden.gardenId}`}
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  Open garden
                </Link>
              ) : null}
            </div>

            {garden.careTypes.map((careType) => {
              const key = careRoundKey(garden.gardenId, careType.taskType);
              return (
                <CareRoundCard
                  key={careType.taskType}
                  gardenName={garden.gardenName}
                  careType={careType}
                  open={openRound === key}
                  onToggleOpen={() => setOpenRound((current) => (current === key ? null : key))}
                  busy={busyGroup === key}
                  isPlantBusy={(item) =>
                    item.tasks.some((task) => Boolean(animating[task.id])) ||
                    busyGroup === `${key}:${item.plant.id}` ||
                    busyGroup === `${key}:${item.plant.id}:snooze`
                  }
                  onCompleteRound={() => void completeGroup(key, careType.taskIds)}
                  onCompletePlant={(item) =>
                    void completeGroup(`${key}:${item.plant.id}`, item.tasks.map((task) => task.id))
                  }
                  onSnoozePlant={(item, days) =>
                    void snoozeGroup(
                      `${key}:${item.plant.id}:snooze`,
                      item.tasks.map((task) => task.id),
                      days,
                    )
                  }
                />
              );
            })}
          </section>
        ))
      )}
    </div>
  );
}

function CareLoopSummary({
  duePlantCount,
  dueTaskCount,
  overdueTaskCount,
}: {
  duePlantCount: number;
  dueTaskCount: number;
  overdueTaskCount: number;
}) {
  return (
    <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-emerald-950">
            {duePlantCount === 0
              ? 'Your gardens are settled for today.'
              : `${duePlantCount} plant care stop${duePlantCount === 1 ? '' : 's'} ready`}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Older reminders are folded into each plant's current stop, so the list stays focused.
          </p>
        </div>
        {dueTaskCount > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white px-3 py-1 text-emerald-800 ring-1 ring-emerald-100">
              {dueTaskCount} task{dueTaskCount === 1 ? '' : 's'}
            </span>
            {overdueTaskCount > 0 ? (
              <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-800 ring-1 ring-rose-100">
                {overdueTaskCount} overdue
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

