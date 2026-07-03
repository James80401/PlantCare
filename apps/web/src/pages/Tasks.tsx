import { useEffect, useMemo, useRef, useState } from 'react';
import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTaskRows } from '../components/ui/Skeleton';
import { useTasksInRange } from '../hooks/useTasksInRange';
import {
  groupDueTasksIntoCareRounds,
  TASK_TYPE_ICONS,
  type CareTypeRound,
  type PlantCareRoundItem,
} from '../utils/taskGroups';
import { taskTypeLabel } from '../utils/tasks';
import { resolveApiThumbnailUrl } from '../utils/apiAssets';
import { SNOOZE_OPTIONS, type SnoozeDays } from '../utils/taskSnooze';

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const selectedGardenId = searchParams.get('garden');
  const { loading, tasks, animating, handleBulkComplete, handleSnooze } = useTasksInRange({
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
    await Promise.all(ids.map((id) => handleSnooze(id, days)));
    setBusyGroup(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <PageHeader
        title={selectedGardenId && rounds[0] ? `${rounds[0].gardenName} care rounds` : 'Garden care rounds'}
        description="Work by garden and care type. One tap completes a plant; the large check completes the whole round."
        help="tasks"
      />

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
              const busy = busyGroup === key;
              const open = openRound === key;
              const summary = summarizeCareType(careType);
              return (
                <article
                  key={careType.taskType}
                  className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5"
                >
                  <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenRound((current) => (current === key ? null : key))}
                      className="min-w-0 flex-1 text-left"
                      aria-expanded={open}
                    >
                      <h3 className="flex items-center gap-2 font-semibold text-emerald-950">
                        <span aria-hidden>{TASK_TYPE_ICONS[careType.taskType] ?? 'Care'}</span>
                        {taskTypeLabel(careType.taskType)}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-600">{summary}</p>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenRound((current) => (current === key ? null : key))}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-lg font-bold text-emerald-800"
                        aria-label={`${open ? 'Hide' : 'Show'} plants for ${taskTypeLabel(careType.taskType)}`}
                        aria-expanded={open}
                      >
                        {open ? '-' : '+'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void completeGroup(key, careType.taskIds)}
                        disabled={busy}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                        aria-label={`Mark all ${taskTypeLabel(careType.taskType)} tasks in ${garden.gardenName} done`}
                        title="Complete this whole care round"
                      >
                        Done
                      </button>
                    </div>
                  </header>
                  {open ? (
                    <ul className="divide-y divide-emerald-50">
                      {careType.plants.map((item) => (
                        <CarePlantRow
                          key={item.plant.id}
                          item={item}
                          busy={
                            item.tasks.some((task) => Boolean(animating[task.id])) ||
                            busyGroup === `${key}:${item.plant.id}` ||
                            busyGroup === `${key}:${item.plant.id}:snooze`
                          }
                          onComplete={() =>
                            void completeGroup(
                              `${key}:${item.plant.id}`,
                              item.tasks.map((task) => task.id),
                            )
                          }
                          onSnooze={(days) =>
                            void snoozeGroup(
                              `${key}:${item.plant.id}:snooze`,
                              item.tasks.map((task) => task.id),
                              days,
                            )
                          }
                        />
                      ))}
                    </ul>
                  ) : null}
                </article>
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

function CarePlantRow({
  item,
  busy,
  onComplete,
  onSnooze,
}: {
  item: PlantCareRoundItem;
  busy: boolean;
  onComplete: () => void;
  onSnooze: (days: SnoozeDays) => void;
}) {
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const label = item.plant.nickname || item.plant.species.commonName;
  const imageUrl = resolveApiThumbnailUrl(item.plant.imageUrl, 96);
  const overdueCount = countOverdue(item);
  const taskSummary = describePlantStop(item);

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-11 w-11 rounded-xl bg-emerald-50 object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xs font-semibold text-emerald-800"
          aria-hidden
        >
          Plant
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link to={`/garden/plants/${item.plant.id}`} className="font-medium text-emerald-950 hover:underline">
          {label}
        </Link>
        <p className="text-xs text-gray-500">{taskSummary}</p>
        {overdueCount > 0 ? (
          <p className="mt-0.5 text-xs font-semibold text-rose-700">
            {overdueCount} overdue reminder{overdueCount === 1 ? '' : 's'} included
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setSnoozeOpen((open) => !open)}
          disabled={busy}
          className="flex min-h-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-3 text-sm font-bold text-sky-800 transition hover:bg-sky-100 disabled:opacity-50"
          aria-label={`Snooze care for ${label}`}
          aria-expanded={snoozeOpen}
        >
          Snooze
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={busy}
          className="flex min-h-11 items-center justify-center rounded-full border-2 border-emerald-400 bg-white px-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
          aria-label={`Mark care for ${label} done`}
        >
          Done
        </button>
      </div>
      {snoozeOpen ? (
        <div className="basis-full pl-14 sm:pl-14">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-sky-100 bg-sky-50/70 p-2">
            {SNOOZE_OPTIONS.map((option) => (
              <button
                key={option.days}
                type="button"
                onClick={() => {
                  onSnooze(option.days);
                  setSnoozeOpen(false);
                }}
                className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-sky-900 ring-1 ring-sky-100 hover:bg-sky-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function careRoundKey(gardenId: string, taskType: string) {
  return `${gardenId}:${taskType}`;
}

function summarizeCareType(careType: CareTypeRound) {
  const overdueCount = careType.plants.reduce((sum, item) => sum + countOverdue(item), 0);
  const taskCount = careType.taskIds.length;
  const plantLabel = `${careType.plants.length} plant${careType.plants.length === 1 ? '' : 's'}`;
  const taskLabel = `${taskCount} reminder${taskCount === 1 ? '' : 's'}`;
  const overdueLabel = overdueCount > 0 ? `, ${overdueCount} overdue` : '';
  return `${plantLabel} - ${taskLabel}${overdueLabel}`;
}

function describePlantStop(item: PlantCareRoundItem) {
  const oldest = parseISO(item.oldestDueDate);
  const dateLabel = isToday(oldest) ? 'today' : format(oldest, 'MMM d');
  if (item.tasks.length === 1) return `Due ${dateLabel}`;
  return `${item.tasks.length} reminders folded together, oldest due ${dateLabel}`;
}

function countOverdue(item: PlantCareRoundItem) {
  const today = startOfToday();
  return item.tasks.filter((task) => isBefore(parseISO(task.dueDate), today)).length;
}
