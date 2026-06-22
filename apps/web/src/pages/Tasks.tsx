import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { SkeletonTaskRows } from '../components/ui/Skeleton';
import { useTasksInRange } from '../hooks/useTasksInRange';
import {
  groupDueTasksIntoCareRounds,
  TASK_TYPE_ICONS,
  type PlantCareRoundItem,
} from '../utils/taskGroups';
import { taskTypeLabel } from '../utils/tasks';
import { resolveApiThumbnailUrl } from '../utils/apiAssets';

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const selectedGardenId = searchParams.get('garden');
  const { loading, tasks, animating, handleBulkComplete } = useTasksInRange({
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
  const duePlantCount = rounds.reduce(
    (total, garden) =>
      total + garden.careTypes.reduce((sum, careType) => sum + careType.plants.length, 0),
    0,
  );

  const completeGroup = async (key: string, ids: string[]) => {
    setBusyGroup(key);
    await handleBulkComplete(ids);
    setBusyGroup(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <PageHeader
        title={selectedGardenId && rounds[0] ? `${rounds[0].gardenName} care rounds` : 'Garden care rounds'}
        description="Work by garden and care type. One tap completes a plant; the large check completes the whole round."
      />

      {selectedGardenId ? (
        <Link to="/garden/tasks" className="text-sm font-semibold text-emerald-700 hover:underline">
          ← View all gardens
        </Link>
      ) : null}

      {!loading ? (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="font-semibold text-emerald-950">
            {duePlantCount === 0
              ? 'Your gardens are settled for today.'
              : `${duePlantCount} plant care stop${duePlantCount === 1 ? '' : 's'} today`}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            Older reminders are folded into each plant’s current care stop—no guilt pile.
          </p>
        </div>
      ) : null}

      {loading ? (
        <SkeletonTaskRows count={5} />
      ) : rounds.length === 0 ? (
        <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-12 text-center">
          <p className="font-semibold text-emerald-950">Nothing needs doing right now.</p>
          <p className="mt-1 text-sm text-gray-500">Enjoy the garden. We’ll surface the next useful round.</p>
        </div>
      ) : (
        rounds.map((garden) => (
          <section key={garden.gardenId} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Garden</p>
                <h2 className="font-display text-xl font-bold text-emerald-950">{garden.gardenName}</h2>
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
              const key = `${garden.gardenId}:${careType.taskType}`;
              const busy = busyGroup === key;
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
                      aria-expanded={openRound === key}
                    >
                      <h3 className="flex items-center gap-2 font-semibold text-emerald-950">
                        <span aria-hidden>{TASK_TYPE_ICONS[careType.taskType] ?? '🌿'}</span>
                        {taskTypeLabel(careType.taskType)}
                      </h3>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {careType.plants.length} plant{careType.plants.length === 1 ? '' : 's'} · tap to view
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenRound((current) => (current === key ? null : key))}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-lg font-bold text-emerald-800"
                        aria-label={`${openRound === key ? 'Hide' : 'Show'} plants for ${taskTypeLabel(careType.taskType)}`}
                        aria-expanded={openRound === key}
                      >
                        {openRound === key ? '−' : '+'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void completeGroup(key, careType.taskIds)}
                        disabled={busy}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-2xl font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
                        aria-label={`Mark all ${taskTypeLabel(careType.taskType)} tasks in ${garden.gardenName} done`}
                        title="Complete this whole care round"
                      >
                        ✓
                      </button>
                    </div>
                  </header>
                  {openRound === key ? (
                    <ul className="divide-y divide-emerald-50">
                      {careType.plants.map((item) => (
                        <CarePlantRow
                          key={item.plant.id}
                          item={item}
                          busy={item.tasks.some((task) => Boolean(animating[task.id]))}
                          onComplete={() =>
                            void completeGroup(`${key}:${item.plant.id}`, item.tasks.map((task) => task.id))
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

function CarePlantRow({
  item,
  busy,
  onComplete,
}: {
  item: PlantCareRoundItem;
  busy: boolean;
  onComplete: () => void;
}) {
  const label = item.plant.nickname || item.plant.species.commonName;
  const imageUrl = resolveApiThumbnailUrl(item.plant.imageUrl, 96);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-11 w-11 rounded-xl bg-emerald-50 object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl" aria-hidden>
          🌿
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link to={`/garden/plants/${item.plant.id}`} className="font-medium text-emerald-950 hover:underline">
          {label}
        </Link>
        <p className="text-xs text-gray-500">Ready when you are</p>
      </div>
      <button
        type="button"
        onClick={onComplete}
        disabled={busy}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-white text-lg font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
        aria-label={`Mark care for ${label} done`}
      >
        ✓
      </button>
    </li>
  );
}
