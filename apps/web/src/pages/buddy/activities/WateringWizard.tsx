import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

export default function WateringWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState<'light' | 'moderate' | 'soak'>('moderate');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const finish = async () => {
    const plantIds = [...selected];
    if (plantIds.length === 0) {
      setMessage('Select at least one plant.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const summary = `Watered ${plantIds.length} plant(s) — ${amount}${notes ? `. ${notes}` : ''}`;
      const { data } = await buddyApi.completeActivity({
        activityType: 'WATERING_CHECK',
        plantIds,
        notes: summary,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` Marked ${data.activity.tasksCompleted} watering task(s) done.`
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
        title="💧 Watering check"
        description="Log which plants you watered — care tasks sync automatically."
      />

      {step === 0 && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-emerald-900">Which plants did you water?</p>
          {plants.length === 0 ? (
            <p className="text-sm text-gray-500">
              No plants yet.{' '}
              <a href="/garden/plants/new" className="font-medium text-emerald-800 underline">
                Add a plant
              </a>{' '}
              first.
            </p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {plants.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 px-3 py-2 hover:bg-emerald-50/50">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggle(p.id)}
                    />
                    <span className="text-sm">{p.nickname || p.species.commonName}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <Button type="button" fullWidth disabled={plants.length === 0} onClick={() => setStep(1)}>
            Next
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <p className="text-sm font-medium text-emerald-900">How much water?</p>
          {(['light', 'moderate', 'soak'] as const).map((v) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="amount"
                checked={amount === v}
                onChange={() => setAmount(v)}
              />
              {v === 'light' && 'A little — top soil moist'}
              {v === 'moderate' && 'Moderate — even moisture'}
              {v === 'soak' && 'Thorough soak — drainage checked'}
            </label>
          ))}
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Notes (optional)</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Complete'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
