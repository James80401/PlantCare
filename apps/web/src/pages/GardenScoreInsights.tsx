import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { plantsApi } from '../services/api';
import { buildEngagementContext, getGardenWellness } from '../utils/engagement';
import { getGardenScoreBreakdown, getOverdueTasks, getTodayTasks } from '../utils/dashboard';

function ScoreRow({
  label,
  signed,
  barWidth,
  barClass,
}: {
  label: string;
  signed: number;
  barWidth?: number;
  barClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-40 shrink-0 text-sm text-gray-700">{label}</div>
      {barWidth !== undefined && barClass ? (
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-emerald-100">
          <div
            className={`h-full rounded-full transition-all ${barClass}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-emerald-950">
        {signed > 0 ? `+${signed}` : signed}
      </span>
    </div>
  );
}

export default function GardenScoreInsights() {
  const [plantCount, setPlantCount] = useState(0);
  const { loading, tasks } = useTasksInRange({ pastDays: 45, futureDays: 14 });
  const currentDate = useMemo(() => new Date(), []);

  useEffect(() => {
    plantsApi.list().then((r) => setPlantCount(r.data.length));
  }, []);

  const overdueCount = useMemo(
    () => getOverdueTasks(tasks, currentDate).length,
    [currentDate, tasks],
  );
  const todayCount = useMemo(
    () => getTodayTasks(tasks, currentDate).length,
    [currentDate, tasks],
  );
  const engagement = useMemo(
    () => buildEngagementContext(plantCount, [], tasks, currentDate),
    [currentDate, plantCount, tasks],
  );
  const breakdown = useMemo(
    () =>
      getGardenScoreBreakdown(
        plantCount,
        overdueCount,
        todayCount,
        engagement.completedInRange,
      ),
    [engagement.completedInRange, overdueCount, plantCount, todayCount],
  );
  const wellness = useMemo(
    () =>
      getGardenWellness(
        plantCount,
        overdueCount,
        todayCount,
        engagement.completedInRange,
        engagement.streak,
      ),
    [engagement, overdueCount, plantCount, todayCount],
  );

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-24">
      <header>
        <Link to="/garden" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold text-emerald-900">Garden score</h1>
        <p className="mt-1 text-sm text-gray-600">
          How your score is calculated from overdue work, today&apos;s tasks, and recent wins.
        </p>
      </header>

      {loading ? (
        <p className="py-12 text-center text-gray-500">Loading…</p>
      ) : plantCount === 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center">
          <p className="text-gray-600">Add a plant to start earning a garden score.</p>
          <Link
            to="/garden/plants/new"
            className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Add plant
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-800 to-lime-700 p-6 text-white shadow-lg">
            <p className="text-sm font-medium text-emerald-100">Your score</p>
            <p className="mt-1 text-5xl font-bold tabular-nums">{breakdown.finalScore}</p>
            <p className="mt-1 text-lg font-medium">{wellness.label}</p>
            <p className="mt-2 text-sm text-emerald-50/90">{wellness.detail}</p>
          </div>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Score breakdown
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Starts at 100, then adjustments. Final score is clamped between 50 and 100.
            </p>
            <div className="mt-4 space-y-3">
              <ScoreRow label="Starting point" signed={100} barWidth={100} barClass="bg-emerald-600" />
              <ScoreRow
                label="Overdue tasks"
                signed={-breakdown.overduePenalty}
                barWidth={breakdown.overduePenalty}
                barClass="bg-rose-400"
              />
              <ScoreRow
                label="Due today"
                signed={-breakdown.todayPenalty}
                barWidth={breakdown.todayPenalty}
                barClass="bg-rose-300"
              />
              <ScoreRow
                label="Recent completions"
                signed={breakdown.completionBoost}
                barWidth={breakdown.completionBoost}
                barClass="bg-lime-500"
              />
              <ScoreRow label="Raw total" signed={breakdown.rawScore} />
              <ScoreRow
                label="Final (50–100)"
                signed={breakdown.finalScore}
                barWidth={breakdown.finalScore}
                barClass="bg-lime-600"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 text-sm text-gray-700">
            <h2 className="font-semibold text-emerald-950">Inputs right now</h2>
            <ul className="mt-3 space-y-2">
              <li>
                <span className="font-medium text-emerald-900">{breakdown.overdueCount}</span>{' '}
                overdue × 10 = −{breakdown.overduePenalty}
              </li>
              <li>
                <span className="font-medium text-emerald-900">{breakdown.todayCount}</span> due today
                × 2 = −{breakdown.todayPenalty}
              </li>
              <li>
                <span className="font-medium text-emerald-900">{breakdown.recentCompletions}</span>{' '}
                recent completion
                {breakdown.recentCompletions === 1 ? '' : 's'} (max 4 counted) × 2 = +
                {breakdown.completionBoost}
              </li>
            </ul>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/garden/tasks/overdue"
              className="rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-100"
            >
              Overdue list
            </Link>
            <Link
              to="/garden/tasks/today"
              className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Due today
            </Link>
            <Link
              to="/garden/tasks/completed-today"
              className="rounded-full bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 hover:bg-sky-100"
            >
              Completed today
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
