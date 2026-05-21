import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

export default function PropagationWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantId, setPlantId] = useState('');
  const [method, setMethod] = useState<'stem' | 'leaf' | 'division' | 'water' | 'other'>('stem');
  const [vessel, setVessel] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const finish = async () => {
    if (!plantId) {
      setMessage('Select a parent plant.');
      return;
    }
    const plant = plants.find((p) => p.id === plantId);
    const name = plant?.nickname || plant?.species.commonName || 'plant';
    const methodLabel = {
      stem: 'stem cutting',
      leaf: 'leaf cutting',
      division: 'division',
      water: 'water propagation',
      other: 'other method',
    }[method];
    const summary = `Propagation from ${name} — ${methodLabel}${vessel ? ` in ${vessel}` : ''}${notes ? `. ${notes}` : ''}`;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'PROPAGATION_LOG',
        plantId,
        notes: summary,
      });
      setMessage(
        `Logged! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.`,
      );
      setTimeout(() => navigate('/garden/buddy'), 1500);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setMessage(Array.isArray(raw) ? raw.join(' ') : raw || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Activity"
        title="🌱 Propagation log"
        description="Record a new cutting or division — saved to your activity history."
      />

      {step === 0 && (
        <Card className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Parent plant</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
            >
              <option value="">Select…</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname || p.species.commonName}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" fullWidth disabled={!plantId} onClick={() => setStep(1)}>
            Next
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-emerald-900">Method</p>
          {(
            [
              ['stem', 'Stem cutting'],
              ['leaf', 'Leaf cutting'],
              ['division', 'Division / pup separation'],
              ['water', 'Water propagation'],
              ['other', 'Other'],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="method" checked={method === v} onChange={() => setMethod(v)} />
              {label}
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" fullWidth onClick={() => setStep(2)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Container / medium (optional)</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              value={vessel}
              onChange={(e) => setVessel(e.target.value)}
              placeholder="e.g. Small jar of water, 4-inch pot with perlite mix"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Notes</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Node count, rooting hormone, expected timeline…"
            />
          </label>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Log propagation'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
