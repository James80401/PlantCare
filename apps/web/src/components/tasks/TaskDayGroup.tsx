import { format, isToday } from 'date-fns';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../../utils/taskFeedback';
import { groupTasksByType, TASK_TYPE_ICONS, type DayGroup } from '../../utils/taskGroups';
import { taskTypeLabel } from '../../utils/tasks';
import TaskRow from './TaskRow';

type AnimMap = Record<string, 'completing' | 'skipping'>;

interface TaskDayGroupProps {
  group: DayGroup;
  animating: AnimMap;
  onComplete: (id: string, feedback?: TaskCompleteFeedback) => void;
  onSkip: (id: string, feedback?: TaskSkipFeedback) => void;
  onSnooze?: (id: string, days: 1 | 3 | 7) => void;
}

export default function TaskDayGroup({
  group,
  animating,
  onComplete,
  onSkip,
  onSnooze,
}: TaskDayGroupProps) {
  const { pending, done, skipped, total } = group;
  const allDone = pending.length === 0 && total > 0;
  const today = isToday(group.date);

  if (total === 0) return null;

  return (
    <section
      className={`rounded-2xl border overflow-hidden ${
        today ? 'border-emerald-300/60 shadow-sm shadow-emerald-900/5' : 'border-emerald-100/90'
      } ${allDone ? 'bg-emerald-50/30' : 'bg-white/80'}`}
    >
      <header
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${
          today ? 'bg-emerald-800 text-white' : 'bg-emerald-50/90 border-b border-emerald-100'
        }`}
      >
        <div>
          <h2 className={`font-semibold ${today ? 'text-white' : 'text-emerald-900'}`}>
            {group.label}
          </h2>
          <p className={`text-xs mt-0.5 ${today ? 'text-emerald-100' : 'text-gray-500'}`}>
            {format(group.date, 'MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          {done.length > 0 && (
            <span
              className={`rounded-full px-2.5 py-1 ${
                today ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {done.length} done
            </span>
          )}
          {pending.length > 0 && (
            <span
              className={`rounded-full px-2.5 py-1 ${
                today ? 'bg-amber-300 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {pending.length} left
            </span>
          )}
          {skipped.length > 0 && (
            <span
              className={`rounded-full px-2.5 py-1 ${
                today ? 'bg-white/15 text-emerald-50' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {skipped.length} skipped
            </span>
          )}
        </div>
      </header>

      <div className="p-3 space-y-4">
        {pending.length > 0 && (
          <div>
            <h3 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              To do
            </h3>
            <div className="space-y-4">
              {groupTasksByType(pending).map(({ taskType, tasks }) => (
                <div key={taskType}>
                  <h4 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-medium text-emerald-900">
                    <span aria-hidden>{TASK_TYPE_ICONS[taskType] ?? '🌿'}</span>
                    {taskTypeLabel(taskType)}
                    <span className="text-xs font-normal text-gray-500">({tasks.length})</span>
                  </h4>
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        groupedByType
                        animState={animating[task.id] ?? null}
                        onComplete={onComplete}
                        onSkip={onSkip}
                        onSnooze={onSnooze}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {(done.length > 0 || skipped.length > 0) && (
          <div>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
              Completed
            </h3>
            <ul className="space-y-2">
              {done.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  animState={animating[task.id] ?? null}
                  onComplete={onComplete}
                  onSkip={onSkip}
                />
              ))}
              {skipped.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  animState={animating[task.id] ?? null}
                  onComplete={onComplete}
                  onSkip={onSkip}
                />
              ))}
            </ul>
          </div>
        )}

        {allDone && (
          <p className="text-center text-sm text-emerald-700/90 py-1">
            All tasks finished for this day
          </p>
        )}
      </div>
    </section>
  );
}
