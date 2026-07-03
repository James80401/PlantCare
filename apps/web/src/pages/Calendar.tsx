import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import TaskRow from '../components/tasks/TaskRow';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { getPendingTasks } from '../utils/dashboard';
import { taskTypeLabel } from '../utils/tasks';

type CalendarView = 'week' | 'month';

export default function Calendar() {
  const [view, setView] = useState<CalendarView>('week');
  const [monthAnchor, setMonthAnchor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));

  const pastDays = view === 'week' ? 0 : 35;
  const futureDays = view === 'week' ? 13 : 65;

  const {
    loading,
    tasks,
    animating,
    handleComplete,
    handleSkip,
    handleSnooze,
  } = useTasksInRange({ pastDays, futureDays });

  const pending = useMemo(() => getPendingTasks(tasks), [tasks]);

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of pending) {
      const key = format(startOfDay(parseISO(task.dueDate)), 'yyyy-MM-dd');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [pending]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDay, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDay]);

  const monthGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthAnchor), { weekStartsOn: 0 });
    const end = endOfMonth(monthAnchor);
    const days: Date[] = [];
    let cursor = start;
    while (cursor <= addDays(end, 6) && days.length < 42) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [monthAnchor]);

  const selectedKey = format(selectedDay, 'yyyy-MM-dd');
  const selectedTasks = useMemo(
    () =>
      pending
        .filter((t) => format(startOfDay(parseISO(t.dueDate)), 'yyyy-MM-dd') === selectedKey)
        .sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()),
    [pending, selectedKey],
  );

  const heatClass = (count: number) => {
    if (count === 0) return 'bg-emerald-50 text-emerald-800';
    if (count <= 2) return 'bg-emerald-200 text-emerald-950';
    if (count <= 4) return 'bg-emerald-500 text-white';
    return 'bg-emerald-800 text-white';
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <PageHeader
        eyebrow="Plan ahead"
        title="Care calendar"
        description="See what's due each day and tap a day for the full list."
        help="calendar"
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={view === 'week' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setView('week')}
        >
          Week
        </Button>
        <Button
          variant={view === 'month' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setView('month')}
        >
          Month
        </Button>
        {view === 'month' && (
          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
            >
              ←
            </Button>
            <span className="self-center text-sm font-semibold text-emerald-950">
              {format(monthAnchor, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
            >
              →
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-3xl" />
      ) : view === 'week' ? (
        <Card className="grid grid-cols-7 gap-1.5 p-3 sm:gap-2 sm:p-4">
          {weekDays.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const count = countsByDay.get(key) ?? 0;
            const selected = isSameDay(day, selectedDay);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(startOfDay(day))}
                className={`rounded-2xl px-1 py-2 text-center transition sm:py-3 ${heatClass(count)} ${
                  selected ? 'ring-2 ring-emerald-950 ring-offset-2' : ''
                }`}
              >
                <p className="text-[0.65rem] font-semibold uppercase sm:text-xs">
                  {isSameDay(day, new Date()) ? 'Today' : format(day, 'EEE')}
                </p>
                <p className="mt-0.5 text-[0.65rem] opacity-80 sm:text-xs">{format(day, 'd')}</p>
                <p className="mt-1 text-base font-bold sm:text-lg">{count}</p>
              </button>
            );
          })}
        </Card>
      ) : (
        <Card className="p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase text-gray-500 sm:text-xs">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const count = countsByDay.get(key) ?? 0;
              const inMonth = isSameMonth(day, monthAnchor);
              const selected = isSameDay(day, selectedDay);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(startOfDay(day))}
                  className={`aspect-square rounded-xl text-xs font-semibold transition ${
                    inMonth ? heatClass(count) : 'bg-gray-50 text-gray-400'
                  } ${selected ? 'ring-2 ring-emerald-950 ring-offset-1' : ''}`}
                >
                  <span className="block">{format(day, 'd')}</span>
                  {count > 0 && inMonth ? (
                    <span className="mt-0.5 block text-[0.6rem] font-bold opacity-90">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              {format(selectedDay, 'EEEE')}
            </p>
            <h2 className="font-display text-xl font-bold text-emerald-950">
              {format(selectedDay, 'MMMM d, yyyy')}
            </h2>
          </div>
          <Link
            to="/garden/tasks"
            className="text-sm font-semibold text-emerald-800 hover:underline"
          >
            All tasks
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : selectedTasks.length === 0 ? (
          <Card className="text-center text-sm text-gray-600">
            Nothing due on this day.{' '}
            <button
              type="button"
              className="font-semibold text-emerald-800 underline"
              onClick={() => setSelectedDay(startOfDay(new Date()))}
            >
              Jump to today
            </button>
          </Card>
        ) : (
          <ul className="space-y-2">
            {selectedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                animState={animating[task.id] ?? null}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onSnooze={handleSnooze}
              />
            ))}
          </ul>
        )}

        {selectedTasks.length > 0 && (
          <p className="text-xs text-gray-500">
            {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} ·{' '}
            {selectedTasks.map((t) => taskTypeLabel(t.taskType)).join(', ')}
          </p>
        )}
      </section>
    </div>
  );
}
