import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

const NEEDS_PLANT = new Set(['PLANT_JOURNAL']);

interface Props {
  activityType: string;
}

export default function GenericActivityFlow({ activityType }: Props) {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<
    { id: string; nickname: string | null; species: { commonName: string } }[]
  >([]);
  const [plantId, setPlantId] = useState('');
  const [notes, setNotes] = useState('');
  const [meta, setMeta] = useState<{ label: string; emoji: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    buddyApi.activityLibrary().then(({ data }) => {
      const row = data.find((a: { activityType: string }) => a.activityType === activityType);
      if (row) setMeta({ label: row.label, emoji: row.emoji });
    });
    plantsApi.list().then(({ data }) => setPlants(data));
  }, [activityType]);

  const needsPlant = NEEDS_PLANT.has(activityType);

  const complete = async () => {
    if (needsPlant && !plantId) {
      setMessage('Select a plant to continue.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType,
        plantId: plantId || undefined,
        notes: notes || undefined,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` ${data.activity.tasksCompleted} task(s) updated.`
          : '';
      setMessage(
        `Done! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.${extra}`,
      );
      setTimeout(() => navigate('/garden/buddy/quests'), 1500);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response
        ?.data?.message;
      setMessage(Array.isArray(raw) ? raw.join(' ') : raw || 'Could not complete activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Activity"
        title={meta ? `${meta.emoji} ${meta.label}` : activityType}
        description="Complete the guided steps, then finish to earn rewards."
      />

      <Card className="space-y-4">
        {needsPlant && (
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Plant</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
            >
              <option value="">Select a plant…</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || p.species.commonName}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Notes (optional)</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              activityType === 'PLANT_JOURNAL'
                ? 'What did you notice about your plants today?'
                : 'Any observations…'
            }
          />
        </label>

        {activityType === 'PEST_INSPECTION' && plantId && (
          <a
            href={`/garden/plants/${plantId}/health`}
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            Open Dr. Plant for this plant →
          </a>
        )}

        {message && <p className="text-sm text-emerald-800">{message}</p>}

        <Button type="button" fullWidth disabled={submitting} onClick={complete}>
          {submitting ? 'Saving…' : 'Complete activity'}
        </Button>
      </Card>
    </div>
  );
}
