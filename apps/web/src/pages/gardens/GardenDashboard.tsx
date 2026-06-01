import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader, Card, SkeletonGrid } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { gardensApi, type GardenDetail } from '../../services/api';

const addPlantButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900';

/**
 * Garden Dashboard (Phase 1: minimal). Shows the garden header, its plants as cards
 * (click → Plant Dashboard), and an add-plant entry point. Phase 2 adds task buckets,
 * upcoming care, and subsection summary cards (Tasks / Care Schedule / Notes / Members).
 */
export default function GardenDashboard() {
  const { gardenId } = useParams<{ gardenId: string }>();
  const [garden, setGarden] = useState<GardenDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!gardenId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await gardensApi.detail(gardenId);
      setGarden(data);
    } catch {
      setError('Could not load this garden.');
    } finally {
      setLoading(false);
    }
  }, [gardenId]);

  useEffect(() => {
    load();
  }, [load]);

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
        <Link to="/garden/gardens" className="text-sm font-medium text-emerald-700 hover:underline">
          ← My Gardens
        </Link>
        <FormError>{error || 'Garden not found.'}</FormError>
      </div>
    );
  }

  const memberCount = garden.members.length;

  return (
    <div className="space-y-6">
      <Link to="/garden/gardens" className="text-sm font-medium text-emerald-700 hover:underline">
        ← My Gardens
      </Link>

      <PageHeader
        eyebrow={garden.location ?? 'Garden'}
        title={garden.name}
        description={`${garden.plants.length} plant${garden.plants.length === 1 ? '' : 's'} · ${memberCount} member${memberCount === 1 ? '' : 's'}${garden.isOwner ? ' · You own this garden' : ' · Shared with you'}`}
        action={
          <Link to={`/garden/plants/new?gardenId=${garden.id}`} className={addPlantButtonClass}>
            + Add plant
          </Link>
        }
      />

      {garden.plants.length === 0 ? (
        <Card padding="lg" className="text-center">
          <h2 className="text-lg font-semibold text-emerald-950 font-display">No plants yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Add your first plant to this garden to start building its care schedule.
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
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-14 w-14 rounded-2xl object-cover"
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
              {p.needsAttention ? (
                <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700">
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
