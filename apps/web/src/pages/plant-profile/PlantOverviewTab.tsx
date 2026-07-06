import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { RecommendationPanel } from '../../components/recommendations/RecommendationPanel';
import { recommendationsApi, type RecommendationItem } from '../../services/api';
import { PLANT_DETAILS_SECTION_ID } from '../../utils/gardenPaths';
import { taskTypeLabel } from '../../utils/tasks';
import { plantDrPlantPath, plantHealthPath } from './constants';
import { PlantDetailsEditor } from './PlantDetailsEditor';
import { usePlantProfile } from './PlantProfileContext';
import { InfoRow, LocationEditor, ProfileSection } from './shared';

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

export default function PlantOverviewTab() {
  const ctx = usePlantProfile();
  const location = useLocation();
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const wateringFreqDays =
    typeof ctx.species.wateringFreqDays === 'number' ? ctx.species.wateringFreqDays : null;
  const nextTaskLabel = ctx.nextTask
    ? `${taskTypeLabel(ctx.nextTask.taskType as string)} ${formatDueRelative(
        ctx.nextTask.dueDate as string,
      ).toLowerCase()}`
    : 'No care tasks due right now';
  const healthLabel =
    ctx.activeDiagnosisCount > 0
      ? `${ctx.activeDiagnosisCount} active health follow-up${
          ctx.activeDiagnosisCount === 1 ? '' : 's'
        }`
      : 'No active health issues';
  const lastCareLabel = ctx.latestCompleted
    ? `${taskTypeLabel(ctx.latestCompleted.taskType as string)} - ${format(
        new Date(ctx.latestCompleted.completedAt as string),
        'MMM d, h:mm a',
      )}`
    : 'No completed care logged yet';

  const loadRecommendations = useCallback(async () => {
    const { data } = await recommendationsApi.list(ctx.id);
    setRecommendations(data);
  }, [ctx.id]);

  useEffect(() => {
    if (location.hash.replace('#', '') !== PLANT_DETAILS_SECTION_ID) return;
    document.getElementById(PLANT_DETAILS_SECTION_ID)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [location.hash, location.pathname]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  return (
    <ProfileSection
      eyebrow="Snapshot"
      title="Overview"
      description="The current status, next step, and growing context for this plant."
      help="plant-overview"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  What matters now
                </p>
                <h3 className="mt-1 text-lg font-semibold text-emerald-950">
                  {ctx.activeDiagnosisCount > 0
                    ? 'Start with the health follow-up.'
                    : ctx.nextTask
                      ? 'Start with the next care step.'
                      : 'Care is caught up.'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">
                  {ctx.activeDiagnosisCount > 0
                    ? 'Review the active diagnosis before changing routine care, then log what changed.'
                    : ctx.nextTask
                      ? 'Open tasks for instructions before completing unfamiliar care.'
                      : 'Use the next visible change as a reason to add a journal note or photo.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ctx.activeDiagnosisCount > 0 ? (
                  <Link
                    to={plantDrPlantPath(ctx.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
                  >
                    Open Dr. Plant
                  </Link>
                ) : (
                  <Link
                    to={`/garden/plants/${ctx.id}/tasks`}
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                  >
                    View tasks
                  </Link>
                )}
                <Link
                  to={`/garden/plants/${ctx.id}/journal`}
                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
                >
                  Add observation
                </Link>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <StatusInsight label="Next care" value={nextTaskLabel} />
              <StatusInsight
                label="Health"
                value={healthLabel}
                tone={ctx.activeDiagnosisCount > 0 ? 'rose' : 'emerald'}
                to={plantHealthPath(ctx.id)}
              />
              <StatusInsight label="Recent care" value={lastCareLabel} />
            </div>
            {ctx.species.toxicity ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-950">
                <span className="font-semibold">Safety note: </span>
                {String(ctx.species.toxicity)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <InfoRow label="Common name" value={ctx.species.commonName as string} />
          {ctx.species.scientificName ? (
            <InfoRow label="Scientific name" value={ctx.species.scientificName as string} />
          ) : null}
          <InfoRow
            label="Sunlight"
            value={(ctx.species.sunlight as string) || 'Not specified yet'}
          />
          <InfoRow
            label="Base watering cadence"
            value={
              wateringFreqDays
                ? `Every ${wateringFreqDays} days before environment adjustments`
                : 'No default cadence set yet'
            }
          />
          <InfoRow label="Last completed care" value={lastCareLabel} />
        </div>

        <PlantDetailsEditor />

        <div className="lg:col-span-2">
          <RecommendationPanel
            title={`${ctx.plantLabel} recommendations`}
            description="Useful plant-specific guidance that is not urgent enough to be a care task."
            recommendations={recommendations}
            onChanged={loadRecommendations}
            emptyText="No plant-specific recommendations right now."
          />
        </div>

        <LocationEditor
          editingLocation={ctx.editingLocation}
          currentLocation={ctx.currentLocation}
          locationDraft={ctx.locationDraft}
          locationOptions={ctx.locationOptions}
          locationSaving={ctx.locationSaving}
          locationMessage={ctx.locationMessage}
          environmentLabel={ctx.careOverview?.environmentLabel}
          onDraftChange={ctx.setLocationDraft}
          onEdit={() => ctx.setEditingLocation(true)}
          onSave={ctx.saveLocation}
          onCancel={() => {
            ctx.setLocationDraft(ctx.currentLocation);
            ctx.setEditingLocation(false);
          }}
        />
      </div>
    </ProfileSection>
  );
}

function StatusInsight({
  label,
  value,
  tone = 'emerald',
  to,
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'rose';
  to?: string;
}) {
  const toneClass =
    tone === 'rose'
      ? 'border-rose-100 bg-white text-rose-950'
      : 'border-emerald-100 bg-white text-emerald-950';
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`rounded-2xl border px-3 py-3 hover:ring-2 hover:ring-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 ${toneClass}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>{content}</div>;
}
