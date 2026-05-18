import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskInstructionsLink from '../TaskInstructionsLink';
import {
  TASK_SKIP_REASONS,
  type TaskSkipFeedback,
  type TaskSkipReason,
} from '../../utils/taskFeedback';
import { taskTypeLabel } from '../../utils/tasks';
import { TASK_TYPE_ICONS, type TaskItem } from '../../utils/taskGroups';

type AnimState = 'completing' | 'skipping' | null;

interface TaskRowProps {
  task: TaskItem;
  animState: AnimState;
  onComplete: (id: string) => void;
  onSkip: (id: string, feedback?: TaskSkipFeedback) => void;
  /** When true, type icon/label is omitted (parent section shows category). */
  groupedByType?: boolean;
  /** When true, plant name links to the plant profile. */
  linkPlant?: boolean;
}

export default function TaskRow({
  task,
  animState,
  onComplete,
  onSkip,
  groupedByType = false,
  linkPlant = true,
}: TaskRowProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<TaskSkipReason>('SOIL_STILL_WET');
  const [note, setNote] = useState('');
  const due = parseISO(task.dueDate);
  const isDone = task.status === 'DONE';
  const isSkipped = task.status === 'SKIPPED';
  const isPending = task.status === 'PENDING';
  const overdue = isPending && isPast(due) && !isToday(due);
  const plantLabel = task.plant.nickname || task.plant.species.commonName;
  const icon = TASK_TYPE_ICONS[task.taskType] ?? '🌿';
  const dueLabel = isToday(due) ? 'Due today' : `Due ${format(due, 'MMM d')}`;

  const rowClass = [
    'task-row group relative flex gap-3 rounded-2xl border px-3 py-3.5 transition-all duration-300 sm:px-4',
    animState === 'completing' && 'task-row--completing',
    animState === 'skipping' && 'task-row--skipping',
    isDone && 'task-row--done border-emerald-200/80 bg-emerald-50/50',
    isSkipped && 'task-row--skipped border-gray-200 bg-gray-50/80',
    isPending && !overdue && 'border-emerald-100/80 bg-white hover:border-emerald-200 hover:shadow-sm',
    overdue && 'border-red-200/90 bg-red-50/40',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={rowClass}>
      {animState === 'completing' && (
        <span className="task-row__burst pointer-events-none absolute inset-0 rounded-xl" aria-hidden />
      )}

      <div className="flex shrink-0 items-start pt-0.5">
        {isPending ? (
          <button
            type="button"
            onClick={() => onComplete(task.id)}
            disabled={!!animState}
            className="task-check flex h-8 w-8 items-center justify-center rounded-full border-2 border-emerald-400 bg-white text-transparent transition hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50"
            aria-label={`Mark ${taskTypeLabel(task.taskType)} for ${plantLabel} as done`}
          />
        ) : (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              isDone
                ? 'bg-emerald-600 text-white task-check--filled'
                : 'bg-gray-300 text-gray-600'
            }`}
            aria-hidden
          >
            {isDone ? '✓' : '–'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {groupedByType && linkPlant ? (
            <Link
              to={`/garden/plants/${task.plant.id}`}
              className={`text-base leading-snug hover:underline ${
                isDone || isSkipped
                  ? 'text-gray-500 line-through decoration-gray-400/80'
                  : 'font-medium text-emerald-950'
              } ${animState === 'completing' ? 'task-row__title--strike' : ''}`}
            >
              {plantLabel}
            </Link>
          ) : (
            <span
              className={`text-base leading-snug ${
                isDone || isSkipped
                  ? 'text-gray-500 line-through decoration-gray-400/80'
                  : 'font-medium text-emerald-950'
              } ${animState === 'completing' ? 'task-row__title--strike' : ''}`}
            >
              {!groupedByType && (
                <span className="mr-1.5" aria-hidden>
                  {icon}
                </span>
              )}
              {groupedByType ? plantLabel : taskTypeLabel(task.taskType)}
            </span>
          )}
          {!groupedByType &&
            (linkPlant ? (
              <Link
                to={`/garden/plants/${task.plant.id}`}
                className={`text-sm font-medium hover:underline ${
                  isDone || isSkipped ? 'text-gray-400' : 'text-emerald-700'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {plantLabel}
              </Link>
            ) : (
              <span className={`text-sm ${isDone || isSkipped ? 'text-gray-400' : 'text-gray-600'}`}>
                {plantLabel}
              </span>
            ))}
        </div>

        {isDone && task.completedAt && (
          <p className="mt-0.5 text-xs text-emerald-700/80">
            Completed {format(parseISO(task.completedAt), 'h:mm a')}
          </p>
        )}

        {isSkipped && <p className="mt-0.5 text-xs text-gray-500">Skipped</p>}

        {overdue && isPending && (
          <p className="mt-0.5 text-xs font-medium text-red-600">Overdue</p>
        )}

        {isPending && !overdue && (
          <p className="mt-0.5 text-xs font-medium text-emerald-700/80">{dueLabel}</p>
        )}

        {isPending && !animState && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TaskInstructionsLink
                taskId={task.id}
                taskType={task.taskType}
                plantLabel={plantLabel}
              />
              <button
                type="button"
                onClick={() => onSkip(task.id)}
                className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200 hover:text-gray-800"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => setFeedbackOpen((open) => !open)}
                className="inline-flex items-center justify-center rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                aria-expanded={feedbackOpen}
              >
                Skip reason
              </button>
            </div>

            {feedbackOpen && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  Why skip this task?
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {TASK_SKIP_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition ${
                        selectedReason === reason.value
                          ? 'border-amber-300 bg-white text-amber-950 shadow-sm'
                          : 'border-amber-100 bg-white/60 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`skip-reason-${task.id}`}
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={() => setSelectedReason(reason.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{reason.label}</span>
                      <span className="mt-0.5 block leading-5 text-gray-500">{reason.helper}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-gray-600">Optional note</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={240}
                    placeholder="Example: soil was damp two inches down"
                    className="mt-1 w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onSkip(task.id, {
                        reason: selectedReason,
                        note: note.trim() || undefined,
                      })
                    }
                    className="rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    Save reason & skip
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

