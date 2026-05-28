import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, type To } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import TaskRow from '../components/tasks/TaskRow';
import { useDashboard, type DashboardAttention } from '../hooks/useDashboard';
import { useDashboardTaskActions } from '../hooks/useDashboardTaskActions';
import { tasksApi } from '../services/api';
import type { SharedPlantView } from '../utils/household';
import { WeatherAdvicePanel } from '../components/weather/WeatherAdvicePanel';
import BuddyDashboardPanel from '../components/buddy/BuddyDashboardPanel';
import SeasonalBanner from '../components/buddy/SeasonalBanner';
import {
  findNextTaskForPlant,
  getOverdueTasks,
  getPendingTasks,
  getSeasonalTip,
  getSuggestedAction,
  getTodayTasks,
  type DashboardPlant,
} from '../utils/dashboard';
import { EngagementProgress } from '../components/engagement/EngagementProgress';
import {
  resolveMilestones,
  getGardenWellness,
  getMilestoneHighlights,
  getOldestPlantAgeDays,
} from '../utils/engagement';
import { TASK_TYPE_ICONS, type TaskItem } from '../utils/taskGroups';
import { taskTypeLabel } from '../utils/tasks';
import { plantDrPlantPath } from './plant-profile/constants';
import {
  isDiagnosisAttentionReason,
  isProfilePhotoAttentionReason,
  plantProfileDetailsPath,
} from '../utils/gardenPaths';

interface ScheduleSuggestion {
  id: string;
  plantId: string;
  plantName: string;
  taskType: string;
  title: string;
  explanation: string;
  adjustmentDays: number;
  affectedTaskCount: number;
  confidence: 'low' | 'medium' | 'high';
  reversible: boolean;
}

type PlantScope = 'all' | 'mine' | 'shared';

export default function Dashboard() {
  const location = useLocation();
  const [plantScope, setPlantScope] = useState<PlantScope>('all');
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [metricsOpen, setMetricsOpen] = useState(false);

  const { data: dash, loading: dashLoading, error: dashError, reload: reloadDash } =
    useDashboard();

  const refreshAfterTask = async () => {
    await reloadDash();
  };

  const {
    tasks: todayCareTasks,
    animating,
    syncTasks,
    handleComplete,
    handleSkip,
    handleSnooze,
  } = useDashboardTaskActions(dash?.todayTasks ?? [], refreshAfterTask);

  useEffect(() => {
    if (dash?.todayTasks) {
      syncTasks(dash.todayTasks);
    }
  }, [dash?.todayTasks, syncTasks]);

  const applyScheduleSuggestion = async (suggestionId: string) => {
    setApplyingSuggestionId(suggestionId);
    setScheduleMessage('');
    try {
      const { data } = await tasksApi.applyScheduleSuggestion(suggestionId);
      setScheduleMessage(data.message || 'Schedule updated.');
      await refreshAfterTask();
    } catch {
      setScheduleMessage('Could not apply that schedule suggestion. Try again.');
    } finally {
      setApplyingSuggestionId(null);
    }
  };

  const scheduleSuggestions = dash?.scheduleSuggestions ?? [];
  const firstName = dash?.greeting.name ?? 'there';
  const plants = dash?.plants ?? [];
  const sharedPlants = dash?.sharedPlants ?? [];
  const pendingTasks = useMemo(
    () => getPendingTasks(dash?.pendingTasks ?? []),
    [dash?.pendingTasks],
  );

  const currentDate = useMemo(() => new Date(), []);

  const visiblePlants = useMemo((): Array<DashboardPlant | SharedPlantView> => {
    if (plantScope === 'mine') return plants;
    if (plantScope === 'shared') return sharedPlants;
    return [...plants, ...sharedPlants];
  }, [plantScope, plants, sharedPlants]);

  const allGardenPlants = useMemo(
    () => [...plants, ...sharedPlants],
    [plants, sharedPlants],
  );

  useEffect(() => {
    if (location.hash.replace('#', '') !== 'plants') return;
    document.getElementById('plants')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash, location.pathname]);

  const overdueTasks = useMemo(
    () => getOverdueTasks(pendingTasks, currentDate),
    [currentDate, pendingTasks],
  );

  const todayTasks = useMemo(
    () => getTodayTasks(pendingTasks, currentDate),
    [currentDate, pendingTasks],
  );

  const weekPreview = dash?.weekPreview ?? [];
  const attentionItems = dash?.attention ?? [];
  const metrics = dash?.metrics;

  const drPlantAction = useMemo((): To => {
    if (allGardenPlants.length === 1) {
      return plantDrPlantPath(allGardenPlants[0].id);
    }
    const diagnosisPlant = attentionItems.find((item) =>
      isDiagnosisAttentionReason(item.reason),
    );
    if (diagnosisPlant) {
      return plantDrPlantPath(diagnosisPlant.plantId);
    }
    return { pathname: '/garden', hash: '#plants' };
  }, [allGardenPlants, attentionItems]);

  const drPlantShortcut = useMemo(() => {
    const diagnosisItem = attentionItems.find((item) =>
      isDiagnosisAttentionReason(item.reason),
    );
    if (diagnosisItem) {
      return { name: diagnosisItem.plantName, plantId: diagnosisItem.plantId };
    }
    if (allGardenPlants.length >= 2 && allGardenPlants.length <= 5) {
      const withDx = plants.find((p) => p.unresolvedDiagnosis);
      if (withDx) {
        return {
          name: withDx.nickname || withDx.species.commonName,
          plantId: withDx.id,
        };
      }
    }
    return null;
  }, [attentionItems, allGardenPlants, plants]);

  const recommendedAction = getSuggestedAction(plants, overdueTasks, todayTasks);
  const completedTodayCount = metrics?.completedToday ?? 0;
  const engagementContext = useMemo(
    () => ({
      plantCount: plants.length,
      oldestPlantAgeDays: getOldestPlantAgeDays(plants.map((plant) => plant.createdAt)),
      completedInRange: dash?.engagement.completedInRange ?? 0,
      streak: dash?.engagement.streak ?? 0,
    }),
    [dash?.engagement, plants],
  );
  const gardenWellness = useMemo(
    () =>
      getGardenWellness(
        plants.length,
        overdueTasks.length,
        todayTasks.length,
        engagementContext.completedInRange,
        engagementContext.streak,
      ),
    [engagementContext, overdueTasks.length, plants.length, todayTasks.length],
  );
  const milestones = useMemo(
    () => resolveMilestones(dash?.engagement.milestones, engagementContext),
    [dash?.engagement.milestones, engagementContext],
  );
  const milestoneHighlights = useMemo(
    () => getMilestoneHighlights(milestones),
    [milestones],
  );
  const gardenScore = dash?.engagement.score ?? gardenWellness.score;
  const needsAttentionCount = attentionItems.filter((item) => item.priority !== 'info').length;
  const dashboardLoading = dashLoading;
  const plantCount = metrics?.totalPlants ?? plants.length;
  const seasonalTip = getSeasonalTip(plants.length, currentDate);

  return (
    <div className="space-y-6 min-w-0">
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
                {dash?.greeting.dateLabel ?? format(new Date(), 'EEEE, MMM d')}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl font-display">
                Hi, {firstName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90">
                {dash?.greeting.statusLine ??
                  'Start your garden by adding a plant and Plant Care will build your daily routine.'}
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
              helper={plants.length === 0 ? 'Add a plant to begin' : gardenWellness.label}
              accent="emerald"
              to={plants.length === 0 ? undefined : '/garden/insights/score'}
            />
            <DashboardMetric
              label="Due today"
              value={metrics?.dueToday ?? todayTasks.length}
              helper={todayTasks.length ? 'Ready for care' : 'Nothing urgent today'}
              accent="amber"
              to="/garden/tasks/today"
              highlight={todayTasks.length > 0}
            />
            <DashboardMetric
              label="Overdue"
              value={overdueTasks.length}
              helper={overdueTasks.length ? 'Needs attention' : 'All caught up'}
              accent="rose"
              to="/garden/tasks/overdue"
              highlight={overdueTasks.length > 0}
              urgent={overdueTasks.length > 0}
            />
            <DashboardMetric
              label="Completed"
              value={completedTodayCount}
              helper="Finished today"
              accent="sky"
              to="/garden/tasks/completed-today"
            />
          </div>

          {plants.length > 0 && (
            <div className="relative mt-5">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-50/85">
                <span>{gardenWellness.headline}</span>
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

      {dash?.weather.hasLocation && dash.weather.cachedSummary ? (
        <section className="max-h-28 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Weather</p>
          <p className="mt-1 line-clamp-3 leading-6">{dash.weather.cachedSummary}</p>
        </section>
      ) : null}

      <WeatherAdvicePanel />

      <BuddyDashboardPanel />
      <SeasonalBanner />

      {dashError ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {dashError}
        </p>
      ) : null}

      {(scheduleSuggestions.length > 0 || scheduleMessage) && (
        <section className="rounded-3xl border border-lime-100 bg-lime-50/70 p-4 shadow-sm shadow-emerald-900/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">
                Adaptive scheduling
              </p>
              <h2 className="mt-1 text-lg font-semibold text-lime-950 font-display">
                Review schedule suggestions
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">
                Suggestions are based on skipped-task feedback, season, and care context. Nothing
                changes unless you approve it.
              </p>
            </div>
          </div>
          {scheduleMessage ? (
            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-lime-900">
              {scheduleMessage}
            </p>
          ) : null}
          {scheduleSuggestions.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {scheduleSuggestions.map((suggestion) => (
                <ScheduleSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  applying={applyingSuggestionId === suggestion.id}
                  onApply={() => applyScheduleSuggestion(suggestion.id)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Start here"
            title="Today's care"
            actionLabel="View all"
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
          ) : todayCareTasks.length === 0 ? (
            <EmptyState
              title="You're all caught up for today"
              body="No tasks due right now. Log a journal note, browse species, or ask Dr. Plant if something looks off."
              actionLabel={
                plants.length === 1 ? 'Ask Dr. Plant' : 'View your plants'
              }
              actionTo={
                plants.length === 1
                  ? plantDrPlantPath(plants[0].id)
                  : '#plants'
              }
            />
          ) : (
            <ul className="space-y-2">
              {todayCareTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  animState={animating[task.id] ?? null}
                  onComplete={(id, feedback) => {
                    handleComplete(id, feedback);
                    window.setTimeout(() => void refreshAfterTask(), 700);
                  }}
                  onSkip={(id, feedback) => {
                    handleSkip(id, feedback);
                    window.setTimeout(() => void refreshAfterTask(), 700);
                  }}
                  onSnooze={async (id, days) => {
                    await handleSnooze(id, days);
                    await refreshAfterTask();
                  }}
                />
              ))}
            </ul>
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
              {attentionItems.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Add more photos, notes, and care feedback over time to make this smarter.
                </p>
              ) : (
                attentionItems.map((item) => (
                  <AttentionItemCard
                    key={item.plantId}
                    item={item}
                    plant={plants.find((p) => p.id === item.plantId)}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
            <h2 className="text-base font-semibold text-emerald-950 font-display">
              Next seven days
            </h2>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {weekPreview.map((day) => (
                <Link
                  key={day.date}
                  to="/garden/calendar"
                  className={`rounded-2xl px-1.5 py-2 text-center transition hover:ring-2 hover:ring-emerald-200 ${
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
                </Link>
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
          body={
            drPlantShortcut
              ? `Continue with ${drPlantShortcut.name} — symptoms, photos, and follow-ups in one thread.`
              : 'Each plant has its own Dr. Plant chat — describe symptoms or add a photo for tailored advice.'
          }
          actionLabel={
            drPlantShortcut
              ? `Ask Dr. Plant · ${drPlantShortcut.name}`
              : allGardenPlants.length === 1
                ? 'Ask Dr. Plant'
                : 'Pick a plant'
          }
          actionTo={
            drPlantShortcut
              ? plantDrPlantPath(drPlantShortcut.plantId)
              : drPlantAction
          }
        />
      </section>

      {plantCount > 0 && (
        <EngagementProgress
          wellness={gardenWellness}
          streak={dash?.engagement.streak ?? engagementContext.streak}
          milestones={milestoneHighlights}
        />
      )}

      <section id="plants" className="space-y-4 scroll-mt-24">
        <SectionHeader
          eyebrow="Garden"
          title="Your plants"
          actionLabel="Add plant"
          actionTo="/garden/plants/new"
        />

        {(plants.length > 0 || sharedPlants.length > 0) && (
          <div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['all', 'All plants'],
                  ['mine', 'My plants'],
                  ['shared', 'Shared with me'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlantScope(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    plantScope === key
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-emerald-100 text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  {label}
                  {key === 'shared' && sharedPlants.length > 0 ? ` (${sharedPlants.length})` : ''}
                </button>
              ))}
            </div>
            {sharedPlants.length > 0 ? (
              <p className="text-xs text-gray-500">
                Shared plants come from households you joined.{' '}
                <Link to="/garden/household" className="font-semibold text-emerald-700 hover:underline">
                  Manage Care Share
                </Link>
              </p>
            ) : null}
          </div>
        )}

        {dashboardLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl border border-emerald-100 bg-white"
              />
            ))}
          </div>
        ) : visiblePlants.length === 0 ? (
          <EmptyState
            title={plantScope === 'shared' ? 'No shared plants yet' : 'No plants yet'}
            body={
              plantScope === 'shared'
                ? 'Accept a household invite to see plants others share with you.'
                : 'Add a plant and Plant Care will create a schedule, care guide, and profile you can track over time.'
            }
            actionLabel={plantScope === 'shared' ? 'Household settings' : 'Add your first plant'}
            actionTo={plantScope === 'shared' ? '/garden/household' : '/garden/plants/new'}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visiblePlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                tasks={pendingTasks}
                sharedMeta={
                  'shared' in plant && plant.shared
                    ? { gardenName: plant.gardenName, role: plant.memberRole }
                    : undefined
                }
              />
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
  to,
  highlight,
  urgent,
}: {
  label: string;
  value: string | number;
  helper: string;
  accent: 'emerald' | 'amber' | 'rose' | 'sky';
  to?: string;
  highlight?: boolean;
  urgent?: boolean;
}) {
  const accentClasses = {
    emerald: 'bg-emerald-300/20 text-emerald-50',
    amber: 'bg-amber-300/25 text-amber-50',
    rose: 'bg-rose-300/20 text-rose-50',
    sky: 'bg-sky-300/20 text-sky-50',
  };

  const className = `block rounded-2xl border p-4 backdrop-blur transition ${accentClasses[accent]} ${
    urgent ? 'border-rose-200/60 ring-2 ring-rose-300/40' : highlight ? 'border-white/25' : 'border-white/10'
  } ${
    to
      ? 'hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
      : ''
  }`;

  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{helper}</p>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} aria-label={`${label}: ${value}. ${helper}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
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
          className="flex gap-3 rounded-2xl border border-emerald-100 bg-white p-3 animate-pulse"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-100" />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className="h-4 w-2/3 rounded-full bg-emerald-100" />
            <div className="h-3 w-1/2 rounded-full bg-emerald-50" />
            <div className="h-8 w-28 rounded-full bg-emerald-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleSuggestionCard({
  suggestion,
  applying,
  onApply,
}: {
  suggestion: ScheduleSuggestion;
  applying: boolean;
  onApply: () => void;
}) {
  return (
    <article className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
            <Link
              to={`/garden/plants/${suggestion.plantId}`}
              className="hover:underline"
            >
              {suggestion.plantName}
            </Link>{' '}
            · {taskTypeLabel(suggestion.taskType)}
          </p>
          <h3 className="mt-1 font-semibold text-emerald-950">{suggestion.title}</h3>
        </div>
        <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-900">
          {suggestion.confidence} confidence
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-gray-700">{suggestion.explanation}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
        <span className="rounded-full bg-gray-50 px-2.5 py-1">
          {suggestion.affectedTaskCount} task{suggestion.affectedTaskCount === 1 ? '' : 's'}
        </span>
        <span className="rounded-full bg-gray-50 px-2.5 py-1">
          {suggestion.adjustmentDays > 0 ? '+' : ''}
          {suggestion.adjustmentDays} days
        </span>
        {suggestion.reversible && (
          <span className="rounded-full bg-gray-50 px-2.5 py-1">Pending tasks only</span>
        )}
      </div>
      <button
        type="button"
        onClick={onApply}
        disabled={applying}
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-lime-700 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-800 disabled:opacity-50"
      >
        {applying ? 'Applying...' : 'Apply suggestion'}
      </button>
    </article>
  );
}

function AttentionItemCard({
  item,
  plant,
}: {
  item: DashboardAttention;
  plant?: DashboardPlant;
}) {
  const toneClasses = {
    urgent: 'border-red-100 bg-red-50 text-red-900',
    warning: 'border-amber-100 bg-amber-50 text-amber-950',
    info: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  };
  const isDiagnosis = isDiagnosisAttentionReason(item.reason);
  const needsPhoto = isProfilePhotoAttentionReason(item.reason);
  const primaryTo = isDiagnosis
    ? plantDrPlantPath(item.plantId)
    : needsPhoto
      ? plantProfileDetailsPath(item.plantId)
      : `/garden/plants/${item.plantId}`;
  const primaryLabel = isDiagnosis
    ? 'Ask Dr. Plant'
    : needsPhoto
      ? 'Add photo'
      : 'Open plant';

  return (
    <article
      className={`rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClasses[item.priority]}`}
    >
      <div className="flex gap-3">
        {plant ? <PlantThumb plant={plant} size="sm" /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{item.plantName}</p>
          <p className="mt-0.5 text-xs opacity-80">{item.reason}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to={primaryTo}
              className="inline-flex min-h-9 items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-white"
            >
              {primaryLabel}
            </Link>
            {isDiagnosis ? (
              <Link
                to={`/garden/plants/${item.plantId}`}
                className="inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-semibold opacity-80 hover:opacity-100"
              >
                Profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
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
  actionTo: To;
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

function PlantCard({
  plant,
  tasks,
  sharedMeta,
}: {
  plant: DashboardPlant;
  tasks: TaskItem[];
  sharedMeta?: { gardenName: string; role: string };
}) {
  const next = findNextTaskForPlant(plant, tasks);
  const name = plant.nickname || plant.species.commonName;
  const plantTasks = tasks.filter((task) => task.plant.id === plant.id);
  const overdueCount = getOverdueTasks(plantTasks).length;

  return (
    <article className="group overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex gap-4 p-4">
        <Link to={`/garden/plants/${plant.id}`} className="flex min-w-0 flex-1 gap-4">
          <PlantThumb plant={plant} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-emerald-950">{name}</h3>
            <p className="truncate text-sm text-gray-500">{plant.species.commonName}</p>
            {sharedMeta ? (
              <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-900">
                Shared · {sharedMeta.gardenName}
              </span>
            ) : null}
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
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {plant.unresolvedDiagnosis ? (
            <Link
              to={plantDrPlantPath(plant.id)}
              className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-semibold text-rose-900 hover:bg-rose-200"
            >
              Health check
            </Link>
          ) : null}
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
              {overdueCount} late
            </span>
          )}
        </div>
      </div>
      <div className="border-t border-emerald-50 px-4 pb-3 pt-2">
        <Link
          to={plantDrPlantPath(plant.id)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          <span aria-hidden>🩺</span>
          Ask Dr. Plant
        </Link>
        <p className="mt-1.5 text-[0.65rem] text-gray-500">Symptoms, photos, follow-ups</p>
      </div>
    </article>
  );
}

function PlantThumb({ plant, size }: { plant: DashboardPlant; size: 'sm' | 'lg' }) {
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

