import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card, SkeletonGrid } from '../../components/ui';
import { FormError } from '../../components/a11y/FormError';
import { GardenCard } from '../../components/gardens/GardenCard';
import { CreateGardenForm } from '../../components/gardens/CreateGardenForm';
import { gardensApi, type GardenSummaryCard } from '../../services/api';

export default function MyGardens() {
  const navigate = useNavigate();
  const [gardens, setGardens] = useState<GardenSummaryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await gardensApi.summaries();
      setGardens(data);
    } catch {
      setError('Could not load your gardens.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const owned = gardens.filter((g) => g.isOwner);
  const shared = gardens.filter((g) => !g.isOwner);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your spaces"
        title="My Gardens"
        description="Gardens group your plants and the people who help care for them."
        action={
          <Button onClick={() => setCreating((v) => !v)}>
            {creating ? 'Close' : '+ Create garden'}
          </Button>
        }
      />

      {creating ? (
        <Card padding="sm">
          <h2 className="mb-3 text-base font-semibold text-emerald-950 font-display">
            New garden
          </h2>
          <CreateGardenForm
            onCreated={(g) => {
              setCreating(false);
              navigate(`/garden/gardens/${g.id}`);
            }}
          />
        </Card>
      ) : null}

      {error ? <FormError>{error}</FormError> : null}

      {loading ? (
        <SkeletonGrid count={3} />
      ) : gardens.length === 0 ? (
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-emerald-950 font-display">
            Create your first garden
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            A garden is a shared workspace for your plants. Create one, then add plants into it.
          </p>
          <div className="mx-auto mt-4 max-w-sm text-left">
            <CreateGardenForm onCreated={(g) => navigate(`/garden/gardens/${g.id}`)} />
          </div>
        </Card>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-800">
              Gardens I own ({owned.length})
            </h2>
            {owned.length === 0 ? (
              <p className="text-sm text-gray-500">You don't own any gardens yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {owned.map((g) => (
                  <GardenCard key={g.id} garden={g} />
                ))}
              </div>
            )}
          </section>

          {shared.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-800">
                Shared with me ({shared.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {shared.map((g) => (
                  <GardenCard key={g.id} garden={g} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
