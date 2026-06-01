import { Link, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { PageHeader, Card, SkeletonGrid } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { useGardenDetail } from '../../hooks/useGardenDetail';
import { taskTypeLabel } from '../../utils/tasks';

const addPlantButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900';

/** All plants in a garden, each a card linking to its Plant Dashboard. */
export default function GardenPlants() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const { garden, loading, error } = useGardenDetail(gardenId);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Plants" />
        <SkeletonGrid count={6} />
      </div>
    );
  }
  if (error || !garden) {
    return (
      <div className="space-y-4">
        <Link
          to={`/garden/gardens/${gardenId ?? ''}`}
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Garden
        </Link>
        <FormError>{error || 'Garden not found.'}</FormError>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to={`/garden/gardens/${garden.id}`}
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← {garden.name}
      </Link>
      <PageHeader
        eyebrow={garden.name}
        title="All Plants"
        description={`${garden.plants.length} plant${garden.plants.length === 1 ? '' : 's'} in this garden`}
        action={
          <Link to={`/garden/plants/new?gardenId=${garden.id}`} className={addPlantButtonClass}>
            + Add plant
          </Link>
        }
      />

      {garden.plants.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-gray-600">No plants yet in this garden.</p>
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
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="h-14 w-14 rounded-2xl object-cover" />
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
    </div>
  );
}

function formatDue(iso: string): string {
  const date = parseISO(iso);
  const diffDays = Math.round(
    (date.getTime() - new Date(new Date().toDateString()).getTime()) / 86_400_000,
  );
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return format(date, 'MMM d');
}
