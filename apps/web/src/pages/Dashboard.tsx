import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, type To } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import TaskRow from '../components/tasks/TaskRow';
import { TaskTypeIcon } from '../components/tasks/TaskTypeIcon';
import {
  useDashboard,
  type DashboardAttention,
  type DashboardHealthStory,
} from '../hooks/useDashboard';
import { useDashboardTaskActions } from '../hooks/useDashboardTaskActions';
import { tasksApi, gardensApi, type GardenSummaryCard } from '../services/api';
import { GardenCard } from '../components/gardens/GardenCard';
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
import { FormError } from '../components/a11y/FormError';
import { StatusMessage } from '../components/a11y/StatusMessage';
import { EngagementProgress } from '../components/engagement/EngagementProgress';
import { RecommendationPanel } from '../components/recommendations/RecommendationPanel';
import { HelpButton } from '../components/ui/HelpButton';
import {
  resolveMilestones,
  getGardenWellness,
  getMilestoneHighlights,
  getOldestPlantAgeDays,
} from '../utils/engagement';
import type { TaskItem } from '../utils/taskGroups';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../utils/taskFeedback';
import { taskTypeLabel } from '../utils/tasks';
import { plantDrPlantPath } from './plant-profile/constants';
import {
  isDiagnosisAttentionReason,
  isProfilePhotoAttentionReason,
  plantProfileDetailsPath,
} from '../utils/gardenPaths';
import { resolveApiAssetUrl, resolveApiThumbnailUrl } from '../utils/apiAssets';
import { formatMeasurementValues } from '../utils/journalMeasurements';

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

  const [gardenSummaries, setGardenSummaries] = useState<GardenSummaryCard[]>([]);
  const [gardenSummariesLoading, setGardenSummariesLoading] = useState(true);
  const [gardenSummariesError, setGardenSummariesError] = useState('');

  const loadGardenSummaries = () => {
    setGardenSummariesError('');
    setGardenSummariesLoading(true);
    gardensApi
      .summaries()
      .then(({ data }) => setGardenSummaries(data))
      .catch(() => {
        setGardenSummaries([]);
        setGardenSummariesError('Could not load garden summaries.');
      })
      .finally(() => setGardenSummariesLoading(false));
  };

  useEffect(() => {
    loadGardenSummaries();
  }, []);

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
  const recommendations = dash?.recommendations ?? [];
  const firstName = dash?.greeting.name ?? 'there';
  const plants = dash?.plants ?? [];
  const sharedPlants = dash?.sharedPlants ?? [];
  const pendingTasks = useMemo(
    () => getPendingTasks(dash?.pendingTasks ?? []),
    [dash?.pendingTasks],
  );

  const [currentDate, setCurrentDate] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setCurrentDate(new Date());
    const now = new Date();
    const msUntilNextMinute = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60_000);
    }, msUntilNextMinute);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

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
  const weekSummary = dash?.weekSummary;
  const attentionItems = dash?.attention ?? [];
  const metrics = dash?.metrics;
  const healthStory = dash?.healthStory;
  const careSummary = dash?.careSummary;
  const attentionSummary = dash?.attentionSummary;
  const plantCount = metrics?.totalPlants ?? plants.length;
  const dueTodayCount = careSummary?.counts.dueToday ?? metrics?.dueToday ?? todayTasks.length;
  const overdueCount = careSummary?.counts.overdue ?? metrics?.overdue ?? overdueTasks.length;
  const dueCareAreas = useMemo(
    () => new Set([...overdueTasks, ...todayTasks].map((task) => task.taskType)).size,
    [overdueTasks, todayTasks],
  );
  const gardensReady = useMemo(
    () =>
      gardenSummaries.filter((garden) => garden.tasksDueToday > 0 || garden.overdue > 0).length,
    [gardenSummaries],
  );
  const completedTodayCount =
    careSummary?.counts.completedToday ?? metrics?.completedToday ?? 0;
  const priorityCareTasks =
    todayCareTasks.length > 0
      ? todayCareTasks
      : dash?.todayTasks?.length
        ? dash.todayTasks
        : [...overdueTasks, ...todayTasks];

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

  const recommendedAction = careSummary
    ? {
        title: careSummary.headline,
        body: careSummary.body,
        actionLabel: careSummary.actionLabel,
        actionTo: careSummary.actionTo,
      }
    : getSuggestedAction(plants, overdueTasks, todayTasks);
  const hasGardenStarted = plantCount > 0 || gardenSummaries.length > 0;
  const completeDashboardTask = (id: string, feedback?: TaskCompleteFeedback) => {
    handleComplete(id, feedback);
    window.setTimeout(() => void refreshAfterTask(), 700);
  };
  const skipDashboardTask = (id: string, feedback?: TaskSkipFeedback) => {
    handleSkip(id, feedback);
    window.setTimeout(() => void refreshAfterTask(), 700);
  };
  const snoozeDashboardTask = async (id: string, days: 1 | 3 | 7) => {
    await handleSnooze(id, days);
    await refreshAfterTask();
  };
  const engagementContext = useMemo(
    () => ({
      plantCount,
      oldestPlantAgeDays: getOldestPlantAgeDays(plants.map((plant) => plant.createdAt)),
      completedInRange: dash?.engagement.completedInRange ?? 0,
      streak: dash?.engagement.streak ?? 0,
    }),
    [dash?.engagement, plantCount, plants],
  );
  const gardenWellness = useMemo(
    () =>
      getGardenWellness(
        plantCount,
        overdueCount,
        dueTodayCount,
        engagementContext.completedInRange,
        engagementContext.streak,
      ),
    [dueTodayCount, engagementContext, overdueCount, plantCount],
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
  const needsAttentionCount =
    attentionSummary?.counts.needsAttention ??
    attentionItems.filter((item) => item.priority !== 'info').length;
  const dashboardLoading = dashLoading;
  const gardensLoading = dashLoading || gardenSummariesLoading;
  const seasonalTip = getSeasonalTip(plants.length, currentDate);

  return (
    <div className="min-w-0 space-y-5 sm:space-y-6">
      <header className="overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 text-white shadow-xl shadow-emerald-900/15 sm:rounded-3xl">
        <div className="relative p-4 sm:p-7">
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-100">
                {dash?.greeting.dateLabel ?? format(new Date(), 'EEEE, MMM d')}
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-4xl font-display">
                Hi, {firstName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/90 sm:text-base">
                {dash?.greeting.statusLine ??
                  'Start your garden by adding a plant and Dr. Plant will build your daily routine.'}
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Link
                to="/garden/plants/new"
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50"
              >
                + Add plant
              </Link>
              <HelpButton topic="dashboard" />
            </div>
          </div>

          <CompactDashboardFocus
            dueTodayCount={dueTodayCount}
            overdueCount={overdueCount}
            dueCareAreas={dueCareAreas}
            completedTodayCount={completedTodayCount}
          />

          <button
            type="button"
            onClick={() => setMetricsOpen((open) => !open)}
            className="relative mt-3 flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-50 backdrop-blur transition hover:bg-white/15 sm:hidden"
            aria-expanded={metricsOpen}
            aria-controls="dashboard-metrics-grid"
          >
            <span>{metricsOpen ? 'Hide details' : 'Show details'}</span>
            <span aria-hidden>{metricsOpen ? '-' : '+'}</span>
          </button>

          <div
            id="dashboard-metrics-grid"
            className={`relative mt-3 gap-2 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 lg:grid-cols-5 ${
              metricsOpen ? 'grid' : 'hidden'
            }`}
          >
            <DashboardMetric
              label="My Gardens"
              value={gardenSummariesLoading ? '...' : gardenSummaries.length}
              helper={
                gardenSummariesLoading
                  ? 'Loading gardens'
                  : gardenSummaries.length
                    ? 'View all gardens'
                    : 'Create your first garden'
              }
              accent="emerald"
              to="/garden/gardens"
              highlight
            />
            <DashboardMetric
              label="Garden score"
              value={plants.length === 0 ? 'New' : gardenScore}
              helper={plants.length === 0 ? 'Add a plant to begin' : gardenWellness.label}
              accent="emerald"
              to={plants.length === 0 ? undefined : '/garden/insights/score'}
            />
            <DashboardMetric
              label="Care areas"
              value={dueCareAreas}
              helper={dueCareAreas ? 'Grouped into quick rounds' : 'Nothing urgent today'}
              accent="amber"
              to="/garden/tasks"
              highlight={dueCareAreas > 0}
            />
            <DashboardMetric
              label="Gardens ready"
              value={gardensReady}
              helper={gardensReady ? 'Care when it fits your day' : 'All settled'}
              accent="emerald"
              to="/garden/tasks"
              highlight={gardensReady > 0}
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

      {dashError ? (
        <FormError className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700">
          {dashError}
        </FormError>
      ) : null}

      {!dashboardLoading ? (
        <PriorityCareSection
          tasks={priorityCareTasks}
          animating={animating}
          hasGardenStarted={hasGardenStarted}
          dueTodayCount={dueTodayCount}
          overdueCount={overdueCount}
          onComplete={completeDashboardTask}
          onSkip={skipDashboardTask}
          onSnooze={snoozeDashboardTask}
        />
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

      {healthStory &&
      (healthStory.recentJournal.length > 0 ||
        healthStory.recentDiagnoses.length > 0 ||
        healthStory.openDiagnosisCount > 0) ? (
        <GardenStorySection story={healthStory} />
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
        <div className="space-y-4">
          <SectionHeader
            eyebrow="Start here"
            title="Your gardens"
            actionLabel="My Gardens"
            actionTo="/garden/gardens"
          />

          {gardenSummaries.length === 0 ? (
            gardensLoading ? (
              <>
                <StatusMessage className="sr-only">Loading gardens…</StatusMessage>
                <DashboardSkeleton />
              </>
            ) : gardenSummariesError ? (
              <section
                role="status"
                aria-live="polite"
                className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm shadow-emerald-900/5"
              >
                <h3 className="font-semibold text-amber-950">Garden summaries are unavailable</h3>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Your dashboard can still load care tasks and plants. Try the summaries again when
                  the connection settles.
                </p>
                <button
                  type="button"
                  onClick={loadGardenSummaries}
                  className="mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 hover:bg-amber-50"
                >
                  Retry summaries
                </button>
              </section>
            ) : (
              <EmptyState
                title="Create your first garden"
                body="Gardens group your plants and the people who help care for them. Create one, then add plants into it."
                actionLabel="Create a garden"
                actionTo="/garden/gardens"
              />
            )
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {gardenSummaries.map((garden) => (
                <GardenCard key={garden.id} garden={garden} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <RecommendationPanel
            recommendations={recommendations}
            onChanged={reloadDash}
            emptyText="No extra recommendations right now. Keep up with your care tasks."
          />

          <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
            <h2 className="text-base font-semibold text-emerald-950 font-display">
              {attentionSummary?.headline ?? 'Needs attention'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {attentionSummary?.body ??
                (needsAttentionCount
                  ? `${needsAttentionCount} plant${needsAttentionCount === 1 ? '' : 's'} may need a closer look.`
                  : 'No major issues detected from your current schedule.')}
            </p>

            <div className="mt-4 space-y-3">
              {attentionItems.length === 0 ? (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {attentionSummary?.body ??
                    'Add more photos, notes, and care feedback over time to make this smarter.'}
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
              {weekSummary?.headline ?? 'Next seven days'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {weekSummary?.body ?? 'Upcoming care tasks for the next seven days.'}
            </p>
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

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-3">
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

      <section className="space-y-3 sm:space-y-4" aria-label="Garden context">
        {dash?.weather.hasLocation && dash.weather.cachedSummary ? (
          <section className="max-h-28 overflow-hidden rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">Weather</p>
            <p className="mt-1 line-clamp-3 leading-6">{dash.weather.cachedSummary}</p>
          </section>
        ) : null}

        <WeatherAdvicePanel />

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          <BuddyDashboardPanel />
          <SeasonalBanner />
        </div>
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
                : 'Add a plant and Dr. Plant will create a schedule, care guide, and profile you can track over time.'
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

function GardenStorySection({ story }: { story: DashboardHealthStory }) {
  const latestJournal = story.recentJournal.slice(0, 3);
  const latestDiagnoses = story.recentDiagnoses.slice(0, 3);
  const recoveryPlants = story.recoveryPlants.slice(0, 3);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Garden story
          </p>
          <h2 className="mt-1 text-xl font-semibold text-emerald-950 font-display">
            Recent health and progress
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            A quick read across journal notes, diagnoses, and plants that may need a recovery
            follow-up.
          </p>
        </div>
        {story.openDiagnosisCount > 0 ? (
          <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 ring-1 ring-rose-100">
            {story.openDiagnosisCount} open health check
            {story.openDiagnosisCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            No open diagnoses
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <StoryColumn title="Journal notes">
          {latestJournal.length === 0 ? (
            <StoryEmpty text="No recent journal notes yet." />
          ) : (
            latestJournal.map((entry) => (
              <Link
                key={entry.id}
                to={`/garden/plants/${entry.plantId}?tab=journal`}
                className="block rounded-2xl border border-emerald-50 bg-emerald-50/60 p-3 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                <div className="flex gap-3">
                  {entry.photoUrl ? (
                    <img
                      src={resolveApiThumbnailUrl(entry.photoUrl, 96) ?? undefined}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl">
                      <span aria-hidden>🌿</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-emerald-950">
                      {entry.plantName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {format(parseISO(entry.createdAt), 'MMM d')}
                    </p>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-gray-700">
                  {entry.notePreview || formatMeasurementValues(entry.measurements) || 'Progress logged'}
                </p>
              </Link>
            ))
          )}
        </StoryColumn>

        <StoryColumn title="Recent diagnoses">
          {latestDiagnoses.length === 0 ? (
            <StoryEmpty text="No recent diagnoses yet." />
          ) : (
            latestDiagnoses.map((diagnosis) => (
              <Link
                key={diagnosis.id}
                to={plantDrPlantPath(diagnosis.plantId)}
                className="block rounded-2xl border border-sky-50 bg-sky-50/60 p-3 transition hover:border-sky-200 hover:bg-sky-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-sky-950">
                      {diagnosis.plantName}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">{diagnosis.resultLabel}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                      diagnosis.resolved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {diagnosis.resolved ? 'Resolved' : 'Open'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {format(parseISO(diagnosis.createdAt), 'MMM d')}
                  {diagnosis.confidence != null
                    ? ` - ${Math.round(diagnosis.confidence * 100)}% confidence`
                    : ''}
                </p>
              </Link>
            ))
          )}
        </StoryColumn>

        <StoryColumn title="Recovery follow-ups">
          {recoveryPlants.length === 0 ? (
            <StoryEmpty text="No active recovery follow-ups." />
          ) : (
            recoveryPlants.map((item) => (
              <Link
                key={item.diagnosisId}
                to={item.actionTo}
                className="block rounded-2xl border border-rose-50 bg-rose-50/60 p-3 transition hover:border-rose-200 hover:bg-rose-50"
              >
                <p className="truncate text-sm font-semibold text-rose-950">{item.plantName}</p>
                <p className="mt-1 text-sm leading-5 text-gray-700">{item.resultLabel}</p>
                <p className="mt-2 text-xs font-semibold text-rose-800">Ask Dr. Plant what changed</p>
              </Link>
            ))
          )}
        </StoryColumn>
      </div>
    </section>
  );
}

function StoryColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-emerald-950">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function StoryEmpty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
      {text}
    </p>
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

  const className = `block rounded-2xl border p-3 backdrop-blur transition sm:p-4 ${accentClasses[accent]} ${
    urgent ? 'border-rose-200/60 ring-2 ring-rose-300/40' : highlight ? 'border-white/25' : 'border-white/10'
  } ${
    to
      ? 'hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
      : ''
  }`;

  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-xl font-bold sm:text-2xl">{value}</p>
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

function CompactDashboardFocus({
  dueTodayCount,
  overdueCount,
  dueCareAreas,
  completedTodayCount,
}: {
  dueTodayCount: number;
  overdueCount: number;
  dueCareAreas: number;
  completedTodayCount: number;
}) {
  const items = [
    {
      label: 'Today',
      value: dueTodayCount,
      helper: 'due',
      to: '/garden/tasks',
      tone: dueTodayCount > 0 ? 'bg-white text-emerald-950' : 'bg-white/10 text-emerald-50',
      ariaLabel: `Today care: ${dueTodayCount} due`,
    },
    {
      label: 'Late',
      value: overdueCount,
      helper: 'overdue',
      to: '/garden/tasks/overdue',
      tone: overdueCount > 0 ? 'bg-rose-50 text-rose-950' : 'bg-white/10 text-emerald-50',
      ariaLabel: `Late care: ${overdueCount} overdue`,
    },
    {
      label: 'Areas',
      value: dueCareAreas,
      helper: 'types',
      to: '/garden/tasks',
      tone: dueCareAreas > 0 ? 'bg-amber-50 text-amber-950' : 'bg-white/10 text-emerald-50',
      ariaLabel: `Care type summary: ${dueCareAreas} areas`,
    },
    {
      label: 'Done',
      value: completedTodayCount,
      helper: 'today',
      to: '/garden/tasks/completed-today',
      tone: completedTodayCount > 0 ? 'bg-sky-50 text-sky-950' : 'bg-white/10 text-emerald-50',
      ariaLabel: `Completed today: ${completedTodayCount}`,
    },
  ];

  return (
    <nav className="relative mt-5 grid grid-cols-4 gap-2 sm:hidden" aria-label="Dashboard quick stats">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          aria-label={item.ariaLabel}
          className={`min-w-0 rounded-2xl px-2 py-2.5 text-center shadow-sm ring-1 ring-white/10 ${item.tone}`}
        >
          <span className="block text-[0.65rem] font-semibold uppercase tracking-wide opacity-80">
            {item.label}
          </span>
          <span className="mt-0.5 block text-lg font-bold leading-none">{item.value}</span>
          <span className="mt-0.5 block truncate text-[0.65rem] opacity-75">{item.helper}</span>
        </Link>
      ))}
    </nav>
  );
}

function PriorityCareSection({
  tasks,
  animating,
  hasGardenStarted,
  dueTodayCount,
  overdueCount,
  onComplete,
  onSkip,
  onSnooze,
}: {
  tasks: TaskItem[];
  animating: Record<string, 'completing' | 'skipping' | 'snoozing'>;
  hasGardenStarted: boolean;
  dueTodayCount: number;
  overdueCount: number;
  onComplete: (id: string, feedback?: TaskCompleteFeedback) => void;
  onSkip: (id: string, feedback?: TaskSkipFeedback) => void;
  onSnooze: (id: string, days: 1 | 3 | 7) => Promise<void>;
}) {
  if (!hasGardenStarted) return null;

  const visibleTasks = tasks.slice(0, 4);
  const hiddenCount = Math.max(0, tasks.length - visibleTasks.length);
  const hasCriticalCare = tasks.length > 0;
  const headline = overdueCount
    ? 'Catch up gently'
    : dueTodayCount
      ? "Today's care"
      : 'All caught up';
  const body = overdueCount
    ? `${overdueCount} overdue care item${overdueCount === 1 ? '' : 's'} should be handled before optional recommendations.`
    : dueTodayCount
      ? `${dueTodayCount} care item${dueTodayCount === 1 ? '' : 's'} due today.`
      : 'No critical care tasks need action today. Optional recommendations can wait.';

  return (
    <section
      className={`rounded-3xl border p-4 shadow-sm shadow-emerald-900/5 sm:p-5 ${
        hasCriticalCare
          ? 'border-amber-100 bg-amber-50/70'
          : 'border-emerald-100 bg-emerald-50/70'
      }`}
      aria-labelledby="priority-care-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wide ${
              hasCriticalCare ? 'text-amber-800' : 'text-emerald-700'
            }`}
          >
            Priority care
          </p>
          <h2 id="priority-care-heading" className="mt-1 text-lg font-semibold text-emerald-950 font-display">
            {headline}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">{body}</p>
        </div>
        <Link
          to="/garden/tasks"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
        >
          {hasCriticalCare ? 'Open tasks' : 'View calendar'}
        </Link>
      </div>

      {hasCriticalCare ? (
        <div className="mt-4 space-y-3">
          <ul className="space-y-2">
            {visibleTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                animState={animating[task.id] ?? null}
                onComplete={onComplete}
                onSkip={onSkip}
                onSnooze={onSnooze}
              />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <Link
              to="/garden/tasks"
              className="inline-flex text-sm font-semibold text-emerald-800 hover:underline"
            >
              View {hiddenCount} more care item{hiddenCount === 1 ? '' : 's'}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
          Keep an eye on recommendations below when you have time, but there is no urgent plant care waiting.
        </div>
      )}
    </section>
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
    <div className="flex min-w-0 items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
        <h2 className="mt-1 break-words text-xl font-semibold text-emerald-950 font-display">{title}</h2>
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-flex max-w-[45%] shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
        >
          <span className="truncate">{actionLabel}</span>
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
    <article className="min-w-0 rounded-2xl border border-lime-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
            <Link
              to={`/garden/plants/${suggestion.plantId}`}
              className="hover:underline"
            >
              {suggestion.plantName}
            </Link>{' '}
            · {taskTypeLabel(suggestion.taskType)}
          </p>
          <h3 className="mt-1 break-words font-semibold text-emerald-950">{suggestion.title}</h3>
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
          {suggestion.adjustmentDays === 0
            ? 'One-time task'
            : `${suggestion.adjustmentDays > 0 ? '+' : ''}${suggestion.adjustmentDays} days`}
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
      className={`min-w-0 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-sm ${toneClasses[item.priority]}`}
    >
      <div className="flex gap-3">
        {plant ? <PlantThumb plant={plant} size="sm" /> : null}
        <div className="min-w-0 flex-1">
          <p className="break-words font-semibold">{item.plantName}</p>
          <p className="mt-0.5 break-words text-xs opacity-80">{item.reason}</p>
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
    <article className="min-w-0 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5 sm:p-5">
      <h2 className="break-words text-lg font-semibold text-emerald-950 font-display">{title}</h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{body}</p>
      <Link
        to={actionTo}
        className="mt-3 inline-flex max-w-full rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 sm:mt-4"
      >
        <span className="truncate">{actionLabel}</span>
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
    <article className="group min-w-0 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
        <Link to={`/garden/plants/${plant.id}`} className="flex min-w-0 flex-1 gap-3 sm:gap-4">
          <PlantThumb plant={plant} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="break-words font-semibold leading-snug text-emerald-950">{name}</h3>
            <p className="truncate text-sm text-gray-500">{plant.species.commonName}</p>
            {sharedMeta ? (
              <span className="mt-1 inline-block max-w-full truncate rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold text-sky-900">
                Shared · {sharedMeta.gardenName}
              </span>
            ) : null}
            <div className="mt-3 space-y-1.5 text-xs text-gray-600">
              {next ? (
                <p className="flex min-w-0 items-center gap-1.5 font-medium text-emerald-800">
                  <TaskTypeIcon taskType={next.taskType} className="h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    Next: {taskTypeLabel(next.taskType)} on {format(parseISO(next.dueDate), 'MMM d')}
                  </span>
                </p>
              ) : (
                <p className="font-medium text-amber-700">No upcoming task found</p>
              )}
              {plant.location && <p>Location: {plant.location}</p>}
              {plant.species.sunlight && <p>Light: {plant.species.sunlight}</p>}
            </div>
          </div>
        </Link>
        <div className="flex max-w-24 shrink-0 flex-col items-end gap-1 sm:max-w-28">
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
      <div className="flex items-center justify-between gap-3 border-t border-emerald-50 px-4 pb-3 pt-2">
        <Link
          to={plantDrPlantPath(plant.id)}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          <span aria-hidden>🩺</span>
          Ask Dr. Plant
        </Link>
        <p className="hidden text-right text-[0.65rem] text-gray-500 sm:block">Symptoms, photos, follow-ups</p>
      </div>
    </article>
  );
}

function PlantThumb({ plant, size }: { plant: DashboardPlant; size: 'sm' | 'lg' }) {
  const dimensions = size === 'sm' ? 'h-12 w-12 rounded-xl text-xl' : 'h-16 w-16 rounded-2xl text-2xl sm:h-20 sm:w-20 sm:text-3xl';
  const imageUrl = resolveApiThumbnailUrl(
    plant.imageUrl ?? plant.species.defaultImageUrl ?? null,
    160,
  );

  return (
    <div className={`${dimensions} flex shrink-0 items-center justify-center overflow-hidden bg-emerald-100`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span aria-hidden>🌿</span>
      )}
    </div>
  );
}
