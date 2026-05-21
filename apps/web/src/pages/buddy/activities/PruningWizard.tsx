import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

const REASONS = [
  'Dead or yellow leaves',
  'Leggy / stretched growth',
  'Spent flowers',
  'Damaged stems',
  'Shape / size control',
] as const;

export default function PruningWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantId, setPlantId] = useState('');
  const [reasons, setReasons] = useState<Set<string>>(new Set());
  const [sterilized, setSterilized] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const toggle = (label: string) => {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const finish = async () => {
    if (!plantId) {
      setMessage('Select a plant.');
      return;
    }
    if (reasons.size === 0) {
      setMessage('Select at least one reason for pruning.');
      return;
    }
    const plant = plants.find((p) => p.id === plantId);
    const name = plant?.nickname || plant?.species.commonName || 'plant';
    const summary = `Pruned ${name} — ${[...reasons].join(', ')}${sterilized ? '; sterilized tools' : ''}${notes ? `. ${notes}` : ''}`;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'PRUNING_GUIDE',
        plantId,
        notes: summary,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` Marked ${data.activity.tasksCompleted} prune task(s) done.`
          : '';
      setMessage(
        `Done! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.${extra}`,
      );
      setTimeout(() => navigate('/garden/buddy/quests'), 1800);
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
        title="✂️ Pruning guide"
        description="Trim with intention — marks pending prune tasks complete."
      />

      {step === 0 && (
        <Card className="space-y-3">
          <p className="text-xs text-gray-600">
            Use clean, sharp scissors. Never remove more than ~25% of healthy foliage at once.
          </p>
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Plant</span>
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
          <p className="text-sm font-medium text-emerald-900">What are you pruning?</p>
          <ul className="space-y-2">
            {REASONS.map((label) => (
              <li key={label}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={reasons.has(label)}
                    onChange={() => toggle(label)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sterilized}
              onChange={(e) => setSterilized(e.target.checked)}
            />
            Tools wiped with alcohol / clean blade
          </label>
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
            <span className="font-medium text-emerald-900">What you removed (optional)</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Two yellow leaves at the base…"
            />
          </label>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Complete pruning'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
