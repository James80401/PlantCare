import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfDay } from 'date-fns';
import TaskDayGroup from '../components/tasks/TaskDayGroup';
import { useAuth } from '../context/AuthContext';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { plantsApi, usersApi } from '../services/api';
import { useEffect, useState } from 'react';

interface Plant {
  id: string;
  nickname?: string;
  imageUrl?: string;
  species: { commonName: string; wateringFreqDays: number };
  tasks: { dueDate: string; taskType: string; status: string }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [weather, setWeather] = useState<{ rainSkipApplied?: boolean; message?: string } | null>(
    null,
  );

  const {
    loading: tasksLoading,
    animating,
    summary,
    dayGroups,
    handleComplete,
    handleSkip,
  } = useTasksInRange({ pastDays: 0, futureDays: 7 });

  const homeDayGroups = useMemo(() => {
    const today = startOfDay(new Date());
    const end = new Date(today);
    end.setDate(end.getDate() + 3);
    return dayGroups.filter((g) => g.date >= today && g.date <= end).slice(0, 4);
  }, [dayGroups]);

  useEffect(() => {
    plantsApi.list().then((r) => setPlants(r.data));
    usersApi.weather().then((r) => setWeather(r.data)).catch(() => {});
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto">
      <header className="rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-6 shadow-lg shadow-emerald-900/15">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-emerald-100 text-sm">Welcome back</p>
            <h1 className="text-2xl sm:text-3xl font-bold font-display mt-0.5">
              Hi, {firstName}
            </h1>
            <p className="text-emerald-100/90 text-sm mt-2">
              {plants.length} plant{plants.length === 1 ? '' : 's'} in your garden
            </p>
          </div>
          <Link
            to="/garden/plants/new"
            className="bg-white text-emerald-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-50 shadow-sm"
          >
            + Add plant
          </Link>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-300/90 text-emerald-950 text-xs font-semibold px-3 py-1">
            {summary.todayPending} due today
          </span>
          <span className="rounded-full bg-white/20 text-white text-xs font-medium px-3 py-1">
            {summary.pending} upcoming
          </span>
          <span className="rounded-full bg-white/20 text-white text-xs font-medium px-3 py-1">
            {summary.done} done this week
          </span>
        </div>
      </header>

      {weather?.rainSkipApplied && (
        <p className="bg-blue-50 text-blue-800 text-sm p-3 rounded-xl border border-blue-100">
          Rain expected — watering tasks adjusted.
        </p>
      )}
      {weather?.message && !weather.rainSkipApplied && (
        <p className="text-gray-600 text-sm">{weather.message}</p>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-emerald-900 font-display">Your schedule</h2>
          <Link to="/garden/tasks" className="text-emerald-700 text-sm font-medium hover:underline">
            All tasks →
          </Link>
        </div>

        {tasksLoading ? (
          <p className="text-gray-500 text-sm text-center py-8">Loading tasks…</p>
        ) : homeDayGroups.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8 rounded-2xl bg-white border border-emerald-100">
            Nothing due in the next few days. Enjoy your garden!
          </p>
        ) : (
          <div className="space-y-4">
            {homeDayGroups.map((group) => (
              <TaskDayGroup
                key={group.dateKey}
                group={group}
                animating={animating}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-emerald-900 font-display mb-4">Your plants</h2>
        {plants.length === 0 ? (
          <p className="text-gray-500 text-sm rounded-2xl bg-white border border-emerald-100 p-6 text-center">
            No plants yet.{' '}
            <Link to="/garden/plants/new" className="text-emerald-700 font-medium">
              Add your first plant
            </Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plants.map((plant) => {
              const next = plant.tasks.find((t) => t.status === 'PENDING') ?? plant.tasks[0];
              return (
                <Link
                  key={plant.id}
                  to={`/garden/plants/${plant.id}`}
                  className="bg-white rounded-2xl border border-emerald-100/90 p-4 hover:shadow-md hover:border-emerald-200 transition-all flex gap-3"
                >
                  <div className="w-16 h-16 rounded-xl bg-emerald-100 flex-shrink-0 overflow-hidden">
                    {plant.imageUrl ? (
                      <img src={plant.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-2xl">🌿</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-emerald-900 truncate">
                      {plant.nickname || plant.species.commonName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{plant.species.commonName}</p>
                    {next && (
                      <p className="text-xs text-emerald-700 mt-1 font-medium">
                        Next: {next.taskType} · {format(new Date(next.dueDate), 'MMM d')}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
