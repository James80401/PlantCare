import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { PageHeader, Card, SkeletonGrid } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { useGardenDetail } from '../../hooks/useGardenDetail';
import { resolveApiThumbnailUrl } from '../../utils/apiAssets';
import { taskTypeLabel } from '../../utils/tasks';
import type { GardenDetail } from '../../services/api';

const addPlantButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900';

/**
 * Garden Dashboard — summarizes everything in one garden and links into subsections.
 * Progressive summarization: subsection cards each show a one-line summary, plant cards
 * show the next task, and everything drills deeper.
 */
export default function GardenDashboard() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const { garden, loading, error } = useGardenDetail(gardenId);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Garden" />
        <SkeletonGrid count={3} />
      </div>
    );
  }
  if (error || !garden) {
    return (
      <div className="space-y-4">
        <BackLink />
        <FormError>{error || 'Garden not found.'}</FormError>
      </div>
    );
  }

  const base = `/garden/gardens/${garden.id}`;
  const { taskSummary } = garden;
  const memberCount = garden.members.length;
  const environment = garden.location === 'Outdoor' ? 'Outdoor garden' : 'Indoor garden';

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        eyebrow={environment}
        title={garden.name}
        description={`${garden.plants.length} plant${garden.plants.length === 1 ? '' : 's'} · ${memberCount} member${memberCount === 1 ? '' : 's'}${garden.isOwner ? ' · You own this garden' : ' · Shared with you'}`}
        help="garden-detail"
        action={
          <Link to={`/garden/plants/new?gardenId=${garden.id}`} className={addPlantButtonClass}>
            + Add plant
          </Link>
        }
      />

      {/* Subsection summary cards — each summarizes, then drills deeper. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SubsectionCard
          to={`${base}/plants`}
          title="All Plants"
          summary={summarizePlants(garden)}
          accent="emerald"
        />
        <SubsectionCard
          to={`${base}/tasks`}
          title="Tasks"
          summary={`${taskSummary.dueToday + taskSummary.overdue} care stops ready, ${taskSummary.upcoming} upcoming`}
          accent={taskSummary.overdue > 0 ? 'rose' : 'amber'}
        />
        <SubsectionCard
          to={`${base}/tasks`}
          title="Care Schedule"
          summary={
            garden.nextWatering
              ? `Next watering: ${formatDue(garden.nextWatering)}`
              : 'No watering scheduled'
          }
          accent="sky"
        />
        <SubsectionCard
          to={`${base}/plants`}
          title="Notes"
          summary={`${garden.notesCount} journal ${garden.notesCount === 1 ? 'entry' : 'entries'}`}
          accent="violet"
        />
        <SubsectionCard
          to={`${base}/members`}
          title="Members / Sharing"
          summary={
            memberCount > 1
              ? `Shared with ${memberCount - 1} ${memberCount - 1 === 1 ? 'person' : 'people'}`
              : 'Just you — invite someone'
          }
          accent="emerald"
        />
      </div>

      {/* Plants */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Plants
        </h2>
        {garden.plants.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-sm text-gray-600">
              No plants yet. Add your first plant to start building this garden's care schedule.
            </p>
            <div className="mt-4">
              <Link to={`/garden/plants/new?gardenId=${garden.id}`} className={addPlantButtonClass}>
                + Add a plant
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {garden.plants.map((p) => (
              <Link
                key={p.id}
                to={`/garden/plants/${p.id}`}
                className="group rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5 transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  {plantImageUrl(p) ? (
                    <img
                      src={plantImageUrl(p) ?? undefined}
                      alt=""
                      className="h-14 w-14 rounded-2xl bg-emerald-50 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
                      🪴
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-emerald-950">
                      {p.nickname || p.species.commonName}
                    </h3>
                    <p className="truncate text-sm text-gray-500">{p.species.commonName}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  {p.nextTask
                    ? `Next: ${taskTypeLabel(p.nextTask.taskType)} · ${formatDue(p.nextTask.dueDate)}`
                    : 'No upcoming tasks'}
                </p>
                {p.needsAttention ? (
                  <p className="mt-2 rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
                    ⚠ Needs a closer look
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/garden/gardens" className="text-sm font-medium text-emerald-700 hover:underline">
      ← My Gardens
    </Link>
  );
}

const ACCENTS: Record<string, string> = {
  emerald: 'border-emerald-100 hover:border-emerald-200',
  amber: 'border-amber-100 hover:border-amber-200',
  rose: 'border-rose-100 hover:border-rose-200',
  sky: 'border-sky-100 hover:border-sky-200',
  violet: 'border-violet-100 hover:border-violet-200',
};

function SubsectionCard({
  to,
  title,
  summary,
  accent,
}: {
  to: string;
  title: string;
  summary: string;
  accent: keyof typeof ACCENTS | string;
}) {
  return (
    <Link
      to={to}
      className={`block rounded-3xl border bg-white p-4 shadow-sm shadow-emerald-900/5 transition hover:shadow-md ${ACCENTS[accent] ?? ACCENTS.emerald}`}
    >
      <h3 className="font-semibold text-emerald-950">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{summary}</p>
    </Link>
  );
}

function summarizePlants(garden: GardenDetail): string {
  const total = garden.plants.length;
  const attention = garden.plants.filter((p) => p.needsAttention).length;
  if (total === 0) return 'No plants yet';
  return `${total} plant${total === 1 ? '' : 's'}${attention ? `, ${attention} need attention` : ''}`;
}

function plantImageUrl(plant: GardenDetail['plants'][number]): string | null {
  return resolveApiThumbnailUrl(plant.imageUrl ?? plant.species.defaultImageUrl ?? null, 160);
}

function formatDue(iso: string): string {
  const date = parseISO(iso);
  const today = new Date();
  const diffDays = Math.round((date.getTime() - new Date(today.toDateString()).getTime()) / 86_400_000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return format(date, 'MMM d');
}
