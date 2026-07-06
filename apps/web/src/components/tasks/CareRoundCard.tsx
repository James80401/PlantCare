import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isBefore, isToday, parseISO, startOfToday } from 'date-fns';
import { TaskTypeIcon } from './TaskTypeIcon';
import { taskTypeLabel } from '../../utils/tasks';
import { resolveApiThumbnailUrl } from '../../utils/apiAssets';
import { SNOOZE_OPTIONS, type SnoozeDays } from '../../utils/taskSnooze';
import type { CareTypeRound, PlantCareRoundItem } from '../../utils/taskGroups';

export function careRoundKey(gardenId: string, taskType: string) {
  return `${gardenId}:${taskType}`;
}

export function summarizeCareType(careType: CareTypeRound) {
  const overdueCount = careType.plants.reduce((sum, item) => sum + countOverdue(item), 0);
  const taskCount = careType.taskIds.length;
  const plantLabel = `${careType.plants.length} plant${careType.plants.length === 1 ? '' : 's'}`;
  const taskLabel = `${taskCount} reminder${taskCount === 1 ? '' : 's'}`;
  const overdueLabel = overdueCount > 0 ? `, ${overdueCount} overdue` : '';
  return `${plantLabel} - ${taskLabel}${overdueLabel}`;
}

export function describePlantStop(item: PlantCareRoundItem) {
  const oldest = parseISO(item.oldestDueDate);
  const dateLabel = isToday(oldest) ? 'today' : format(oldest, 'MMM d');
  if (item.tasks.length === 1) return `Due ${dateLabel}`;
  return `${item.tasks.length} reminders folded together, oldest due ${dateLabel}`;
}

export function countOverdue(item: PlantCareRoundItem) {
  const today = startOfToday();
  return item.tasks.filter((task) => isBefore(parseISO(task.dueDate), today)).length;
}

/**
 * One care-type round for one garden: a header with a bulk "Done" action and an
 * optional, collapsed-by-default list of the individual plants in that round.
 * Shared between the full Garden care rounds page and the Dashboard's condensed
 * preview so both surfaces cost the same number of taps for the same data.
 */
export function CareRoundCard({
  gardenName,
  careType,
  open,
  onToggleOpen,
  busy,
  isPlantBusy,
  onCompleteRound,
  onCompletePlant,
  onSnoozePlant,
}: {
  gardenName: string;
  careType: CareTypeRound;
  open: boolean;
  onToggleOpen: () => void;
  busy: boolean;
  isPlantBusy: (item: PlantCareRoundItem) => boolean;
  onCompleteRound: () => void;
  onCompletePlant: (item: PlantCareRoundItem) => void;
  onSnoozePlant: (item: PlantCareRoundItem, days: SnoozeDays) => void;
}) {
  const summary = summarizeCareType(careType);

  return (
    <article className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
      <header className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <button
          type="button"
          onClick={onToggleOpen}
          className="min-w-0 flex-1 text-left"
          aria-expanded={open}
        >
          <h3 className="flex items-center gap-2 font-semibold text-emerald-950">
            <TaskTypeIcon taskType={careType.taskType} className="h-5 w-5 text-emerald-700" />
            {taskTypeLabel(careType.taskType)}
          </h3>
          <p className="mt-0.5 text-xs text-gray-600">{summary}</p>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-lg font-bold text-emerald-800"
            aria-label={`${open ? 'Hide' : 'Show'} plants for ${taskTypeLabel(careType.taskType)}`}
            aria-expanded={open}
          >
            {open ? '-' : '+'}
          </button>
          <button
            type="button"
            onClick={onCompleteRound}
            disabled={busy}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            aria-label={`Mark all ${taskTypeLabel(careType.taskType)} tasks in ${gardenName} done`}
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
              busy={isPlantBusy(item)}
              onComplete={() => onCompletePlant(item)}
              onSnooze={(days) => onSnoozePlant(item, days)}
            />
          ))}
        </ul>
      ) : null}
    </article>
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
