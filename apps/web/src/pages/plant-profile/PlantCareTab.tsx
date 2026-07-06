import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { taskTypeLabel } from '../../utils/tasks';
import { plantDrPlantPath } from './constants';
import { usePlantProfile } from './PlantProfileContext';
import type { CareDetailLevel, CareOverviewSection, PlantCareTopicId } from './types';
import { CareGuideCard, ProfileSection, SectionEmptyState } from './shared';

const CARE_SECTION_ORDER: PlantCareTopicId[] = [
  'water',
  'light',
  'soil',
  'humidity',
  'temperature',
  'fertilizer',
  'pruning',
  'repotting',
  'pests',
  'troubleshooting',
  'toxicity',
  'propagation',
  'season',
  'notes',
];

export function sortCareSections(sections: CareOverviewSection[]) {
  return [...sections].sort((a, b) => {
    const aIndex = CARE_SECTION_ORDER.indexOf(a.id);
    const bIndex = CARE_SECTION_ORDER.indexOf(b.id);
    const normalizedA = aIndex === -1 ? CARE_SECTION_ORDER.length : aIndex;
    const normalizedB = bIndex === -1 ? CARE_SECTION_ORDER.length : bIndex;
    if (normalizedA !== normalizedB) return normalizedA - normalizedB;
    return a.heading.localeCompare(b.heading);
  });
}

function defaultCareDetailLevel(experienceLevel?: string | null): CareDetailLevel {
  if (experienceLevel === 'advanced' || experienceLevel === 'expert') {
    return 'advanced';
  }
  return 'beginner';
}

export default function PlantCareTab() {
  const ctx = usePlantProfile();
  const { user } = useAuth();
  const defaultDetailLevel = defaultCareDetailLevel(user?.experienceLevel);
  const sortedSections = sortCareSections(ctx.careOverview?.sections ?? []);
  const wateringDays =
    typeof ctx.species.wateringFreqDays === 'number' ? ctx.species.wateringFreqDays : null;
  const nextTaskLabel = ctx.nextTask
    ? `${taskTypeLabel(ctx.nextTask.taskType as string)} is next`
    : 'No urgent care task right now';

  return (
    <ProfileSection
      eyebrow="Guide"
      title="Care"
      description="Start with the practical basics, then open more detail when you need it."
      help="plant-care"
    >
      <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Care at a glance
            </p>
            <h3 className="mt-1 text-lg font-semibold text-emerald-950">{nextTaskLabel}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">
              {ctx.careOverview?.environmentLabel
                ? `${ctx.currentLocation} is treated as ${ctx.careOverview.environmentLabel.toLowerCase()} for task timing.`
                : `${ctx.currentLocation} is used for task timing when environment guidance is available.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/garden/plants/${ctx.id}/tasks`}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              Open tasks
            </Link>
            <Link
              to={plantDrPlantPath(ctx.id)}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              Ask Dr. Plant
            </Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <CareSummaryTile
            label="Watering baseline"
            value={wateringDays ? `Every ${wateringDays} days` : 'Not set yet'}
          />
          <CareSummaryTile
            label="Light"
            value={(ctx.species.sunlight as string) || 'Not specified yet'}
          />
          <CareSummaryTile
            label="Safety"
            value={ctx.species.toxicity ? String(ctx.species.toxicity) : 'No special note saved'}
            tone={ctx.species.toxicity ? 'amber' : 'emerald'}
          />
        </div>
      </div>

      {sortedSections.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {sortedSections.map((section) => (
            <CareGuideCard
              key={section.id}
              section={section}
              defaultDetailLevel={defaultDetailLevel}
              drPlantPath={plantDrPlantPath(ctx.id)}
              plantId={ctx.id}
            />
          ))}
        </div>
      ) : (
        <SectionEmptyState
          title="No care guide yet"
          body="Care guidance will appear here when a guide is available for this species. Use tasks and Dr. Plant for the current routine."
        />
      )}
    </ProfileSection>
  );
}

function CareSummaryTile({
  label,
  value,
  tone = 'emerald',
}: {
  label: string;
  value: string;
  tone?: 'emerald' | 'amber';
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-amber-100 bg-white text-amber-950'
      : 'border-emerald-100 bg-white text-emerald-950';

  return (
    <div className={`rounded-2xl border px-3 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}
