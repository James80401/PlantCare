import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, compareAsc, format, isToday, parseISO, startOfDay } from 'date-fns';
import TaskDayGroup from '../components/tasks/TaskDayGroup';
import { useAuth } from '../context/AuthContext';
import { useTasksInRange } from '../hooks/useTasksInRange';
import { plantsApi, usersApi } from '../services/api';
import { TASK_TYPE_ICONS, type TaskItem } from '../utils/taskGroups';
import { taskTypeLabel } from '../utils/tasks';

interface Plant {
  id: string;
  nickname?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  species: {
    commonName: string;
    scientificName?: string | null;
    sunlight?: string | null;
    wateringFreqDays: number;
  };
  tasks: { dueDate: string; taskType: string; status: string }[];
}

interface WeatherMessage {
  rainSkipApplied?: boolean;
  message?: string;
}

interface AttentionPlant {
  plant: Plant;
  reason: string;
  tone: 'urgent' | 'warning' | 'info';
  nextTask?: { dueDate: string; taskType: string; status: string };
}

export default function Dashboard() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [plantsError, setPlantsError] = useState('');
  const [weather, setWeather] = useState<WeatherMessage | null>(null);

  const {
    loading: tasksLoading,
    tasks,
    animating,
    summary,
    dayGroups,
    handleComplete,
    handleSkip,
  } = useTasksInRange({ pastDays: 7, futureDays: 14 });

  useEffect(() => {
    let cancelled = false;

    setPlantsLoading(true);
    setPlantsError('');
    plantsApi
      .list()
      .then((r) => {
        if (!cancelled) setPlants(r.data);
      })
      .catch(() => {
        if (!cancelled) setPlantsError('Could not load your garden right now.');
      })
      .finally(() => {
        if (!cancelled) setPlantsLoading(false);
      });

    usersApi
      .weather()
      .then((r) => {
        if (!cancelled) setWeather(r.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status === 'PENDING'),
    [tasks],
  );

  const overdueTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return pendingTasks
      .filter((task) => startOfDay(parseISO(task.dueDate)) < today)
      .sort(sortTasksByDue);
  }, [pendingTasks]);

  const todayTasks = useMemo(
    () => pendingTasks.filter((task) => isToday(parseISO(task.dueDate))).sort(sortTasksByDue),
    [pendingTasks],
  );

  const focusDayGroups = useMemo(() => {
    const today = startOfDay(new Date());
    const end = addDays(today, 3);
    const overdue = dayGroups.filter((group) => group.pending.length > 0 && group.date < today);
    const nearTerm = dayGroups.filter(
      (group) => group.pending.length > 0 && group.date >= today && group.date <= end,
    );
    return [...overdue.slice(0, 1), ...nearTerm].slice(0, 4);
  }, [dayGroups]);

  const weekPreview = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index);
      const count = pendingTasks.filter(
        (task) => startOfDay(parseISO(task.dueDate)).getTime() === date.getTime(),
      ).length;
      return {
        key: format(date, 'yyyy-MM-dd'),
        label: index === 0 ? 'Today' : format(date, 'EEE'),
        dateLabel: format(date, 'MMM d'),
        count,
      };
    });
  }, [pendingTasks]);

  const attentionPlants = useMemo(
    () => buildAttentionPlants(plants, pendingTasks).slice(0, 4),
    [plants, pendingTasks],
  );

  const recommendedAction = suggestedAction(plants, overdueTasks, todayTasks);
  const completedCount = tasks.filter((task) => task.status === 'DONE').length;
  const gardenScore =
    plants.length === 0
      ? 0
      : Math.max(45, Math.min(100, 100 - overdueTasks.length * 12 - todayTasks.length * 2));
  const needsAttentionCount = attentionPlants.filter((item) => item.tone !== 'info').length;
  const dashboardLoading = tasksLoading || plantsLoading;
  const seasonalTip = getSeasonalTip(plants.length);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 text-white shadow-xl shadow-emerald-900/15">
        <div className="relative p-5 sm:p-7">
          <div
            className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden
          />
          <div
            className="absolute -bottom-16 left-16 h-36 w-36 rounded-full bg-lime-300/20 blur-2xl"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100">
                {format(new Date(), 'EEEE, MMM d')}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Hi, {firstName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90">
                {plants.length === 0
                  ? 'Start your garden by adding a plant and Plant Care will build your daily routine.'
                  : `Your garden has ${plants.length} plant${plants.length === 1 ? '' : 's'}, ${summary.todayPending} task${summary.todayPending === 1 ? '' : 's'} due today, and ${overdueTasks.length} overdue.`}
              </p>
            </div>
            <Link
              to="/garden/plants/new"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50"
            >
              + Add plant
            </Link>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardMetric
              label="Garden score"
              value={plants.length === 0 ? 'New' : gardenScore}
              helper={plants.length === 0 ? 'Add a plant to begin' : scoreLabel(gardenScore)}
              accent="emerald"
            />
            <DashboardMetric
              label="Due today"
              value={summary.todayPending}
              helper={todayTasks.length ? 'Ready for care' : 'Nothing urgent today'}
              accent="amber"
            />
            <DashboardMetric
              label="Overdue"
              value={overdueTasks.length}
              helper={overdueTasks.length ? 'Needs attention' : 'All caught up'}
              accent="rose"
            />
            <DashboardMetric
              label="Completed"
              value={completedCount}
              helper="In the recent range"
              accent="sky"
            />
          </div>

          {plants.length > 0 && (
            <div className="relative mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-50/85">
                <span>Garden health signal</span>
                <span>{gardenScore}/100</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-lime-300 transition-all"
                  style={{ width: `${gardenScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {(weather?.rainSkipApplied || weather?.message) && (
        <section
          className={`rounded-2xl border p-4 text-sm ${
            weather.rainSkipApplied
              ? 'border-blue-100 bg-blue-50 text-blue-900'
              : 'border-emerald-100 bg-white text-gray-700'
          }`}
        >
          <p className="font-medium">
            {weather.rainSkipApplied ? 'Rain-smart care update' : 'Weather note'}
          </p>
          <p className="mt-1">
            {weather.rainSkipApplied
              ? 'Rain is expected, so outdoor watering tasks may be adjusted.'
              : weather.message}
          </p>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Start here"
            title="Today's care"
            actionLabel="All tasks"
            actionTo="/garden/tasks"
          />

          {dashboardLoading ? (
            <DashboardSkeleton />
          ) : plants.length === 0 ? (
            <EmptyState
              title="Build your first care plan"
              body="Add a plant to generate watering, fertilizing, pruning, pest checks, and care instructions."
              actionLabel="Add your first plant"
              actionTo="/garden/plants/new"
            />
          ) : focusDayGroups.length === 0 ? (
            <EmptyState
              title="Nothing due right now"
              body="Your next care tasks will show up here. You can still add a journal note or check a plant profile."
              actionLabel="View your plants"
              actionTo="#plants"
            />
          ) : (
            <div className="space-y-4">
              {focusDayGroups.map((group) => (
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
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
            <h2 className="text-base font-semibold text-emerald-950 font-display">
              Needs attention
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {needsAttentionCount
                ? `${needsAttentionCount} plant${needsAttentionCount === 1 ? '' : 's'} may need a closer look.`
                : 'No major issues detected from your current schedule.'}
            </p>

            <div className="mt-4 space-y-3">
              {attentionPlants.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Add more photos, notes, and care feedback over time to make this smarter.
                </p>
              ) : (
                attentionPlants.map((item) => <AttentionPlantCard key={item.plant.id} item={item} />)
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
            <h2 className="text-base font-semibold text-emerald-950 font-display">
              Next seven days
            </h2>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {weekPreview.map((day) => (
                <div
                  key={day.key}
                  className={`rounded-2xl px-1.5 py-2 text-center ${
                    day.count
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide">
                    {day.label}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] opacity-80">{day.dateLabel}</p>
                  <p className="mt-1 text-lg font-bold">{day.count}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <SuggestionCard
          title={recommendedAction.title}
          body={recommendedAction.body}
          actionLabel={recommendedAction.actionLabel}
          actionTo={recommendedAction.actionTo}
        />
        <SuggestionCard
          title="Seasonal care note"
          body={seasonalTip}
          actionLabel="Review tasks"
          actionTo="/garden/tasks"
        />
        <SuggestionCard
          title="Dr. Plant is ready"
          body="If a plant looks off, open its profile and ask Dr. Plant with a photo and recent symptoms."
          actionLabel="Choose a plant"
          actionTo="#plants"
        />
      </section>

      <section id="plants" className="space-y-4 scroll-mt-24">
        <SectionHeader
          eyebrow="Garden"
          title="Your plants"
          actionLabel="Add plant"
          actionTo="/garden/plants/new"
        />

        {plantsError && (
          <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {plantsError}
          </p>
        )}

        {plantsLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl border border-emerald-100 bg-white"
              />
            ))}
          </div>
        ) : plants.length === 0 ? (
          <EmptyState
            title="No plants yet"
            body="Add a plant and Plant Care will create a schedule, care guide, and profile you can track over time."
            actionLabel="Add your first plant"
            actionTo="/garden/plants/new"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} tasks={pendingTasks} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardMetric({
  label,
  value,
  helper,
  accent,
}: {
  label: string;
  value: string | number;
  helper: string;
  accent: 'emerald' | 'amber' | 'rose' | 'sky';
}) {
  const accentClasses = {
    emerald: 'bg-emerald-300/20 text-emerald-50',
    amber: 'bg-amber-300/25 text-amber-50',
    rose: 'bg-rose-300/20 text-rose-50',
    sky: 'bg-sky-300/20 text-sky-50',
  };

  return (
    <div className={`rounded-2xl border border-white/10 p-4 backdrop-blur ${accentClasses[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{helper}</p>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  actionTo,
}: {
  eyebrow: string;
  title: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold text-emerald-950 font-display">{title}</h2>
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  actionTo,
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-white p-6 text-center shadow-sm shadow-emerald-900/5">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-3xl">
        🌿
      </div>
      <h3 className="mt-4 text-lg font-semibold text-emerald-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">{body}</p>
      <Link
        to={actionTo}
        className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1].map((index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-3xl border border-emerald-100 bg-white"
        />
      ))}
    </div>
  );
}

function AttentionPlantCard({ item }: { item: AttentionPlant }) {
  const toneClasses = {
    urgent: 'border-red-100 bg-red-50 text-red-900',
    warning: 'border-amber-100 bg-amber-50 text-amber-950',
    info: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  };
  const name = item.plant.nickname || item.plant.species.commonName;

  return (
    <Link
      to={`/garden/plants/${item.plant.id}`}
      className={`block rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClasses[item.tone]}`}
    >
      <div className="flex gap-3">
        <PlantThumb plant={item.plant} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="mt-0.5 text-xs opacity-80">{item.reason}</p>
          {item.nextTask && (
            <p className="mt-1 text-xs font-medium">
              {taskTypeLabel(item.nextTask.taskType)} · {format(parseISO(item.nextTask.dueDate), 'MMM d')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function SuggestionCard({
  title,
  body,
  actionLabel,
  actionTo,
}: {
  title: string;
  body: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <article className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5">
      <h2 className="text-lg font-semibold text-emerald-950 font-display">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-gray-600">{body}</p>
      <Link
        to={actionTo}
        className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
      >
        {actionLabel}
      </Link>
    </article>
  );
}

function PlantCard({ plant, tasks }: { plant: Plant; tasks: TaskItem[] }) {
  const next = findNextTaskForPlant(plant, tasks);
  const name = plant.nickname || plant.species.commonName;
  const plantTasks = tasks.filter((task) => task.plant.id === plant.id);
  const overdueCount = plantTasks.filter(
    (task) => startOfDay(parseISO(task.dueDate)) < startOfDay(new Date()),
  ).length;

  return (
    <Link
      to={`/garden/plants/${plant.id}`}
      className="group overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex gap-4 p-4">
        <PlantThumb plant={plant} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-emerald-950">{name}</h3>
              <p className="truncate text-sm text-gray-500">{plant.species.commonName}</p>
            </div>
            {overdueCount > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                {overdueCount} late
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-gray-600">
            {next ? (
              <p className="font-medium text-emerald-800">
                <span aria-hidden>{TASK_TYPE_ICONS[next.taskType] ?? '🌿'} </span>
                Next: {taskTypeLabel(next.taskType)} on {format(parseISO(next.dueDate), 'MMM d')}
              </p>
            ) : (
              <p className="font-medium text-amber-700">No upcoming task found</p>
            )}
            {plant.location && <p>Location: {plant.location}</p>}
            {plant.species.sunlight && <p>Light: {plant.species.sunlight}</p>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlantThumb({ plant, size }: { plant: Plant; size: 'sm' | 'lg' }) {
  const dimensions = size === 'sm' ? 'h-12 w-12 rounded-xl text-xl' : 'h-20 w-20 rounded-2xl text-3xl';

  return (
    <div className={`${dimensions} flex shrink-0 items-center justify-center overflow-hidden bg-emerald-100`}>
      {plant.imageUrl ? (
        <img
          src={plant.imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <span aria-hidden>🌿</span>
      )}
    </div>
  );
}

function buildAttentionPlants(plants: Plant[], tasks: TaskItem[]): AttentionPlant[] {
  const today = startOfDay(new Date());

  return plants
    .map((plant): AttentionPlant | null => {
      const plantTasks = tasks.filter((task) => task.plant.id === plant.id);
      const nextTask = findNextTaskForPlant(plant, tasks);
      const overdueCount = plantTasks.filter(
        (task) => startOfDay(parseISO(task.dueDate)) < today,
      ).length;
      const dueTodayCount = plantTasks.filter((task) => isToday(parseISO(task.dueDate))).length;

      if (overdueCount > 0) {
        return {
          plant,
          reason: `${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`,
          tone: 'urgent',
          nextTask,
        };
      }

      if (dueTodayCount > 0) {
        return {
          plant,
          reason: `${dueTodayCount} task${dueTodayCount === 1 ? '' : 's'} due today`,
          tone: 'warning',
          nextTask,
        };
      }

      if (!plant.imageUrl) {
        return {
          plant,
          reason: 'Add a photo to make progress tracking more useful',
          tone: 'info',
          nextTask,
        };
      }

      if (!nextTask) {
        return {
          plant,
          reason: 'No upcoming task found in the current window',
          tone: 'info',
        };
      }

      return null;
    })
    .filter((item): item is AttentionPlant => Boolean(item));
}

function findNextTaskForPlant(plant: Plant, tasks: TaskItem[]) {
  const fromTaskList = tasks
    .filter((task) => task.plant.id === plant.id && task.status === 'PENDING')
    .sort(sortTasksByDue)[0];
  const fromPlantPreview = plant.tasks.find((task) => task.status === 'PENDING') ?? plant.tasks[0];
  return fromTaskList ?? fromPlantPreview;
}

function suggestedAction(plants: Plant[], overdueTasks: TaskItem[], todayTasks: TaskItem[]) {
  if (plants.length === 0) {
    return {
      title: 'Add your first plant',
      body: 'Start with a plant you already own. The app will generate a schedule and care profile.',
      actionLabel: 'Add plant',
      actionTo: '/garden/plants/new',
    };
  }

  if (overdueTasks.length > 0) {
    return {
      title: 'Catch up gently',
      body: 'Start with the oldest overdue task, then open the care instructions if the plant looks stressed.',
      actionLabel: 'Review overdue',
      actionTo: '/garden/tasks',
    };
  }

  if (todayTasks.length > 0) {
    return {
      title: 'Finish today strong',
      body: 'Complete the tasks due today and use skip only when the plant does not need the care yet.',
      actionLabel: "Do today's care",
      actionTo: '/garden/tasks',
    };
  }

  return {
    title: 'Log a quick observation',
    body: 'Add a note or photo to a plant profile so future diagnoses and care advice have better context.',
    actionLabel: 'Open garden',
    actionTo: '#plants',
  };
}

function getSeasonalTip(plantCount: number) {
  if (plantCount === 0) {
    return 'Once you add plants, this space can surface seasonal tips based on your garden and location.';
  }

  const month = new Date().getMonth();
  if (month <= 1 || month === 11) {
    return 'Winter care usually means slower growth: check soil before watering and reduce fertilizer unless a plant is actively growing.';
  }
  if (month >= 2 && month <= 4) {
    return 'Spring is a good time to inspect roots, refresh soil, prune leggy growth, and restart fertilizer for active growers.';
  }
  if (month >= 5 && month <= 7) {
    return 'Warm weather can dry pots faster. Watch outdoor plants, sun-facing windows, and small containers closely.';
  }
  return 'Fall is a transition period: slow fertilizer, inspect for pests before moving plants indoors, and adjust watering as light drops.';
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Thriving';
  if (score >= 75) return 'Steady';
  if (score >= 60) return 'Needs a check';
  return 'Needs attention';
}

function sortTasksByDue(a: TaskItem, b: TaskItem) {
  return compareAsc(parseISO(a.dueDate), parseISO(b.dueDate));
}
