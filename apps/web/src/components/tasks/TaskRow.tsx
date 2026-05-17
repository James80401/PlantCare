import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskInstructionsLink from '../TaskInstructionsLink';
import { taskTypeLabel } from '../../utils/tasks';
import { TASK_TYPE_ICONS, type TaskItem } from '../../utils/taskGroups';

type AnimState = 'completing' | 'skipping' | null;

interface TaskRowProps {
  task: TaskItem;
  animState: AnimState;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  /** When true, type icon/label is omitted (parent section shows category). */
  groupedByType?: boolean;
}

export default function TaskRow({
  task,
  animState,
  onComplete,
  onSkip,
  groupedByType = false,
}: TaskRowProps) {
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
          {!groupedByType && (
            <span className={`text-sm ${isDone || isSkipped ? 'text-gray-400' : 'text-gray-600'}`}>
              {plantLabel}
            </span>
          )}
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
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
          </div>
        )}
      </div>
    </li>
  );
}

