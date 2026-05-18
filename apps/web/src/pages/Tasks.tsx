import { useMemo, useState } from 'react';
import { startOfDay } from 'date-fns';
import TaskDayGroup from '../components/tasks/TaskDayGroup';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { trackEvent } from '../utils/analytics';

export default function Tasks() {
  const [filter, setFilter] = useState<'all' | 'upcoming'>('all');
  const {
    loading,
    animating,
    summary,
    dayGroups,
    handleComplete,
    handleSkip,
    handleSnooze,
  } = useTasksInRange({ pastDays: 14, futureDays: 45 });

  const filteredGroups = useMemo(() => {
    if (filter === 'upcoming') {
      const today = startOfDay(new Date());
      return dayGroups.filter((g) => g.date >= today);
    }
    return dayGroups;
  }, [dayGroups, filter]);

  const onComplete = (id: string) => {
    trackEvent('TaskCompleted');
    handleComplete(id);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-emerald-900 font-display">Care tasks</h1>
        <p className="text-sm text-gray-600 mt-1">
          Grouped by day; to-dos are sorted by care type (water, fertilize, …).
        </p>
        {!loading && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 font-medium">
              {summary.todayPending} due today
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 font-medium">
              {summary.done} completed
            </span>
            <span className="rounded-full bg-gray-100 text-gray-700 px-3 py-1 font-medium">
              {summary.pending} remaining
            </span>
          </div>
        )}
      </header>

      <div className="flex gap-2 p-1 bg-white/80 rounded-xl border border-emerald-100 w-fit">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-gray-600 hover:text-emerald-800'
          }`}
        >
          All days
        </button>
        <button
          type="button"
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'upcoming'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'text-gray-600 hover:text-emerald-800'
          }`}
        >
          Upcoming
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-12">Loading tasks…</p>
      ) : filteredGroups.length === 0 ? (
        <p className="text-gray-500 text-center py-12 rounded-2xl bg-white border border-emerald-100">
          No tasks in this range. Add a plant to generate your care schedule.
        </p>
      ) : (
        <div className="space-y-5">
          {filteredGroups.map((group) => (
            <TaskDayGroup
              key={group.dateKey}
              group={group}
              animating={animating}
              onComplete={onComplete}
              onSkip={handleSkip}
              onSnooze={handleSnooze}
            />
          ))}
        </div>
      )}
    </div>
  );
}
