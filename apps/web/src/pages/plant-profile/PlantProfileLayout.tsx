import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { SharePlantCard } from '../../components/engagement/SharePlantCard';
import { resolveApiAssetUrl } from '../../utils/apiAssets';
import { plantProfileDetailsPath } from '../../utils/gardenPaths';
import { DR_PLANT_SECTION_ID, plantDrPlantPath, plantHealthPath, PROFILE_TABS } from './constants';
import { PlantProfileProvider, usePlantProfile } from './PlantProfileContext';
import { SummaryTile } from './shared';
import { taskTypeLabel } from '../../utils/tasks';

function PlantProfileShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const ctx = usePlantProfile();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;
    const mapped = hash === 'diagnosis' || hash === DR_PLANT_SECTION_ID ? 'health' : hash;
    if (PROFILE_TABS.some((t) => t.id === mapped)) {
      navigate(
        {
          pathname: `/garden/plants/${ctx.id}/${mapped}`,
          hash: hash === DR_PLANT_SECTION_ID ? `#${DR_PLANT_SECTION_ID}` : '',
        },
        { replace: true },
      );
    }
  }, [location.hash, ctx.id, navigate]);

  const { plant, species, plantLabel, sectionCounts, nextTask, careOverview, currentLocation } =
    ctx;

  const gardenId = plant?.gardenId as string | undefined;
  const gardenName = (plant?.garden as { name?: string } | undefined)?.name;
  const carePath = `/garden/plants/${ctx.id}/care`;
  const journalPath = `/garden/plants/${ctx.id}/journal`;
  const profileStatus =
    ctx.activeDiagnosisCount > 0
      ? `${ctx.activeDiagnosisCount} active health follow-up${
          ctx.activeDiagnosisCount === 1 ? '' : 's'
        }`
      : nextTask
        ? `Next up: ${taskTypeLabel(nextTask.taskType as string)} ${formatDueRelative(
            nextTask.dueDate as string,
          ).toLowerCase()}`
        : 'Care is caught up';
  const profileStatusClass =
    ctx.activeDiagnosisCount > 0
      ? 'border-rose-100 bg-rose-50 text-rose-900'
      : nextTask
        ? 'border-emerald-100 bg-emerald-50 text-emerald-900'
        : 'border-sky-100 bg-sky-50 text-sky-900';
  const plantImageUrl = resolveApiAssetUrl(
    ((plant.imageUrl as string | null) ?? (species.defaultImageUrl as string | null)) ?? null,
  );

  // Plant Dashboard summary cards (Watering / Light / Fertilizer / Health / History).
  const wateringTask = ctx.pending.find((t) => t.taskType === 'WATER');
  const fertilizeTask = ctx.pending.find((t) => t.taskType === 'FERTILIZE');

  return (
    <div className="min-w-0 space-y-5">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <Link to="/garden/gardens" className="font-medium text-emerald-700 hover:underline">
          My Gardens
        </Link>
        {gardenId ? (
          <>
            <span className="text-gray-400" aria-hidden>
              /
            </span>
            <Link
              to={`/garden/gardens/${gardenId}`}
              className="font-medium text-emerald-700 hover:underline"
            >
              {gardenName || 'Garden'}
            </Link>
          </>
        ) : null}
        <span className="text-gray-400" aria-hidden>
          /
        </span>
        <span className="font-semibold text-emerald-950">{plantLabel}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
        <div className="grid gap-5 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-6">
          <div className="h-36 w-full overflow-hidden rounded-3xl bg-emerald-100 sm:h-36 sm:w-36">
            {plantImageUrl ? (
              <img
                src={plantImageUrl}
                alt={`Photo of ${plantLabel}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="flex h-full items-center justify-center text-sm font-semibold text-emerald-800"
                aria-hidden
              >
                Plant
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Plant profile
            </p>
            <h1 className="mt-1 break-words text-2xl font-bold text-emerald-950 font-display sm:text-3xl">
              {plantLabel}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {species.commonName as string}
              {species.scientificName ? (
                <span className="italic"> - {species.scientificName as string}</span>
              ) : null}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex min-h-8 items-center rounded-full border px-3 py-1 text-xs font-semibold ${profileStatusClass}`}
              >
                {profileStatus}
              </span>
              {careOverview?.environmentLabel ? (
                <span className="inline-flex min-h-8 items-center rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
                  {currentLocation} - {careOverview.environmentLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <DrillCard
                to={carePath}
                label="Watering"
                value={
                  wateringTask
                    ? formatDueRelative(wateringTask.dueDate as string)
                    : `Every ${species.wateringFreqDays as number} days`
                }
                tone="sky"
              />
              <DrillCard
                to={carePath}
                label="Light"
                value={(species.sunlight as string) || 'Not specified'}
                tone="emerald"
              />
              <DrillCard
                to={carePath}
                label="Fertilizer"
                value={
                  fertilizeTask
                    ? `Next ${formatDueRelative(fertilizeTask.dueDate as string).toLowerCase()}`
                    : 'Not scheduled'
                }
                tone="amber"
              />
              <DrillCard
                to={plantHealthPath(ctx.id)}
                label="Health"
                value={
                  ctx.activeDiagnosisCount > 0
                    ? `${ctx.activeDiagnosisCount} active`
                    : 'Looks healthy'
                }
                tone={ctx.activeDiagnosisCount > 0 ? 'rose' : 'emerald'}
              />
              <DrillCard
                to={journalPath}
                label="History"
                value={
                  ctx.latestCompleted
                    ? `${taskTypeLabel(ctx.latestCompleted.taskType as string)} ${formatPastRelative(ctx.latestCompleted.completedAt as string)}`
                    : 'No history yet'
                }
                tone="emerald"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Location:{' '}
              {careOverview?.environmentLabel
                ? `${currentLocation} - ${careOverview.environmentLabel}`
                : currentLocation}
            </p>

            {species.toxicity ? (
              <p
                role="note"
                className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                <span className="font-semibold">Safety note: </span>
                {String(species.toxicity)}
              </p>
            ) : null}

            <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
              <Link
                to={plantDrPlantPath(ctx.id)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                Ask Dr. Plant
              </Link>
              <Link
                to={plantProfileDetailsPath(ctx.id)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                Edit details
              </Link>
              <button
                type="button"
                onClick={() => ctx.setSharingPlant(true)}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                Share plant card
              </button>
            </div>
          </div>
        </div>
      </section>

      <ProfileNextAction />

      {ctx.sharingPlant ? (
        <SharePlantCard
          snapshot={{
            plantName: plantLabel,
            speciesName: species.commonName as string,
            scientificName: (species.scientificName as string) || null,
            location: currentLocation,
            sunlight: (species.sunlight as string) || null,
            nextCareLabel: nextTask
              ? `${taskTypeLabel(nextTask.taskType as string)} - ${format(
                  new Date(nextTask.dueDate as string),
                  'MMM d',
                )}`
              : null,
          }}
          onClose={() => ctx.setSharingPlant(false)}
        />
      ) : null}

      <nav
        className="sticky top-[calc(4.5rem+env(safe-area-inset-top))] z-20 overflow-x-auto rounded-2xl border border-emerald-100 bg-white/95 p-1 shadow-sm shadow-emerald-900/5 backdrop-blur [-webkit-overflow-scrolling:touch] sm:top-[4.5rem]"
        aria-label="Plant profile sections"
      >
        <div className="flex min-w-max gap-1">
          {PROFILE_TABS.map((section) => (
            <NavLink
              key={section.id}
              to={`/garden/plants/${ctx.id}/${section.id}`}
              className={({ isActive }) =>
                `inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-800'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2`
              }
            >
              <span>{section.label}</span>
              <TabCountBadge
                count={
                  section.id === 'tasks'
                    ? sectionCounts.tasks
                    : section.id === 'journal'
                      ? sectionCounts.journal
                      : section.id === 'health'
                        ? ctx.activeDiagnosisCount
                        : 0
                }
              />
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}

function ProfileNextAction() {
  const ctx = usePlantProfile();
  const location = useLocation();
  const healthPath = plantDrPlantPath(ctx.id);
  const tasksPath = `/garden/plants/${ctx.id}/tasks`;
  const journalPath = `/garden/plants/${ctx.id}/journal`;
  const onTasksTab = location.pathname === tasksPath;

  if (ctx.activeDiagnosisCount > 0) {
    return (
      <ActionBanner
        eyebrow="Health follow-up"
        title={`${ctx.activeDiagnosisCount} active diagnosis ${
          ctx.activeDiagnosisCount === 1 ? 'needs' : 'need'
        } attention`}
        body="Review the latest guidance, add recovery notes, or ask Dr. Plant a follow-up question."
        to={healthPath}
        action="Open Dr. Plant"
        tone="rose"
      />
    );
  }

  if (ctx.nextTask) {
    // The Tasks tab immediately below already shows this exact task — a "View
    // tasks" button here would just link back to the page already on screen.
    if (onTasksTab) return null;
    const taskLabel = taskTypeLabel(ctx.nextTask.taskType as string);
    return (
      <ActionBanner
        eyebrow="Next care"
        title={`${taskLabel} is ${formatDueRelative(ctx.nextTask.dueDate as string).toLowerCase()}`}
        body={`Keep ${ctx.plantLabel}'s schedule moving with the next care step.`}
        to={tasksPath}
        action="View tasks"
        tone="emerald"
      />
    );
  }

  if (ctx.journalEntries.length === 0) {
    return (
      <ActionBanner
        eyebrow="Start the story"
        title="Add the first journal entry"
        body="Capture a note, photo, or measurement so future growth changes are easier to compare."
        to={journalPath}
        action="Open journal"
        tone="sky"
      />
    );
  }

  return (
    <ActionBanner
      eyebrow="Profile rhythm"
      title="Care is caught up"
      body="Add a quick observation after the next visible change to keep this profile useful."
      to={journalPath}
      action="Add observation"
      tone="emerald"
    />
  );
}

function ActionBanner({
  eyebrow,
  title,
  body,
  to,
  action,
  tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  to: string;
  action: string;
  tone: 'emerald' | 'rose' | 'sky';
}) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-100 bg-rose-50/70 text-rose-950'
      : tone === 'sky'
        ? 'border-sky-100 bg-sky-50/70 text-sky-950'
        : 'border-emerald-100 bg-emerald-50/70 text-emerald-950';
  const actionClass =
    tone === 'rose'
      ? 'bg-rose-700 text-white hover:bg-rose-800'
      : tone === 'sky'
        ? 'bg-sky-700 text-white hover:bg-sky-800'
        : 'bg-emerald-800 text-white hover:bg-emerald-900';

  return (
    <section
      className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-sm shadow-emerald-900/5 sm:flex-row sm:items-center sm:justify-between ${toneClass}`}
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm opacity-80">{body}</p>
      </div>
      <Link
        to={to}
        className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${actionClass}`}
      >
        {action}
      </Link>
    </section>
  );
}

function TabCountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-emerald-900 ring-1 ring-emerald-100">
      {count}
    </span>
  );
}

/** A summary tile that links to its detail page, with a drill-down affordance. */
function DrillCard({
  to,
  label,
  value,
  tone,
}: {
  to: string;
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'sky' | 'rose';
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl transition hover:ring-2 hover:ring-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
      aria-label={`${label}: ${value}. View details`}
    >
      <SummaryTile label={label} value={value} tone={tone} />
    </Link>
  );
}

function formatDueRelative(iso: string): string {
  const due = new Date(iso);
  const today = new Date(new Date().toDateString());
  const days = Math.round((new Date(due.toDateString()).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 14) return `In ${days} days`;
  return `Due ${format(due, 'MMM d')}`;
}

function formatPastRelative(iso: string): string {
  const date = new Date(iso);
  const today = new Date(new Date().toDateString());
  const days = Math.round((today.getTime() - new Date(date.toDateString()).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days <= 30) return `${days} days ago`;
  return format(date, 'MMM d');
}

export default function PlantProfileLayout() {
  return (
    <PlantProfileProvider>
      <PlantProfileShell />
    </PlantProfileProvider>
  );
}
