import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi, weatherApi } from '../../../services/api';

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

const SIGNS = [
  'Crispy brown leaf tips',
  'Wilting despite moist soil',
  'Condensation on leaves',
  'Mold on soil surface',
  'Leaves look healthy',
] as const;

const ACTIONS = [
  'Mist lightly',
  'Pebble tray / grouping plants',
  'Run humidifier',
  'Reduce misting / improve airflow',
  'No change needed',
] as const;

export default function HumidityCheckWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantId, setPlantId] = useState('');
  const [climate, setClimate] = useState<'tropical' | 'desert' | 'temperate'>('temperate');
  const [signs, setSigns] = useState<Set<string>>(new Set());
  const [actions, setActions] = useState<Set<string>>(new Set());
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [hasLocation, setHasLocation] = useState(false);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
    weatherApi
      .adviceStatus()
      .then(({ data }) => {
        setHasLocation(data.hasLocation);
        setLocationLabel(data.locationLabel);
      })
      .catch(() => {});
  }, []);

  const toggle = (set: Set<string>, label: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(label)) next.delete(label);
    else next.add(label);
    setter(next);
  };

  const finish = async () => {
    if (!plantId) {
      setMessage('Select a plant.');
      return;
    }
    if (signs.size === 0 || actions.size === 0) {
      setMessage('Select signs and at least one action.');
      return;
    }
    const plant = plants.find((p) => p.id === plantId);
    const name = plant?.nickname || plant?.species.commonName || 'plant';
    const summary = `Humidity check — ${name} (${climate} group): signs [${[...signs].join(', ')}]; actions [${[...actions].join(', ')}]${notes ? `. ${notes}` : ''}`;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'HUMIDITY_CHECK',
        plantId,
        notes: summary,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` Marked ${data.activity.tasksCompleted} mist task(s) done.`
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
        title="🌬️ Humidity check"
        description="Match moisture in the air to what your plants need."
      />

      {step === 0 && (
        <Card className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Plant to check</span>
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
          <p className="text-sm font-medium text-emerald-900">Plant group</p>
          {(
            [
              ['tropical', 'Tropical — ferns, calatheas, many houseplants'],
              ['desert', 'Desert — succulents, cacti'],
              ['temperate', 'Temperate — pothos, philodendron, herbs'],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="climate"
                checked={climate === v}
                onChange={() => setClimate(v)}
              />
              {label}
            </label>
          ))}
          {hasLocation && (
            <p className="text-xs text-gray-500">
              Local weather on file{locationLabel ? ` (${locationLabel})` : ''} — use rain/humid
              days as a cue to ease misting.
            </p>
          )}
          {!hasLocation && (
            <p className="text-xs text-gray-500">
              Add your city in{' '}
              <a href="/garden/settings" className="font-medium text-emerald-800 underline">
                Settings
              </a>{' '}
              for weather-aware tips.
            </p>
          )}
          <Button type="button" fullWidth disabled={!plantId} onClick={() => setStep(1)}>
            Next
          </Button>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-emerald-900">Signs you see</p>
          <ul className="space-y-2">
            {SIGNS.map((label) => (
              <li key={label}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={signs.has(label)}
                    onChange={() => toggle(signs, label, setSigns)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
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
          <p className="text-sm font-medium text-emerald-900">What you&apos;ll do</p>
          <ul className="space-y-2">
            {ACTIONS.map((label) => (
              <li key={label}>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={actions.has(label)}
                    onChange={() => toggle(actions, label, setActions)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Notes (optional)</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {message && <p className="text-sm text-emerald-800">{message}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Complete check'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
