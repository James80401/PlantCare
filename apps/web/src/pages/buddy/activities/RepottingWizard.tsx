import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, plantsApi } from '../../../services/api';

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

const CHECKLIST = [
  'Gently remove plant from old pot',
  'Loosen roots; trim any mushy roots',
  'Add fresh potting mix to new pot',
  'Center plant and fill around roots',
  'Water lightly and place in indirect light',
] as const;

export default function RepottingWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantId, setPlantId] = useState('');
  const [rootbound, setRootbound] = useState<'yes' | 'no' | 'unsure'>('unsure');
  const [potSize, setPotSize] = useState<'same' | 'one-up' | 'two-up'>('one-up');
  const [done, setDone] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const toggleStep = (label: string) => {
    setDone((prev) => {
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
    const plant = plants.find((p) => p.id === plantId);
    const name = plant?.nickname || plant?.species.commonName || 'plant';
    const summary = `Repotted ${name} — rootbound: ${rootbound}, new pot: ${potSize}, steps: ${done.size}/${CHECKLIST.length}${notes ? `. ${notes}` : ''}`;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'REPOTTING_GUIDE',
        plantId,
        notes: summary,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` Marked ${data.activity.tasksCompleted} repot task(s) done.`
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
        title="🪴 Repotting guide"
        description="Step-by-step repot — syncs repot tasks when you finish."
      />

      {step === 0 && (
        <Card className="space-y-3">
          <label className="block text-sm">
            <span className="font-medium text-emerald-900">Which plant?</span>
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
          <p className="text-sm font-medium text-emerald-900">Are roots crowded?</p>
          {(['yes', 'no', 'unsure'] as const).map((v) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="rootbound"
                checked={rootbound === v}
                onChange={() => setRootbound(v)}
              />
              {v === 'yes' && 'Yes — circling or peeking out of drainage'}
              {v === 'no' && 'No — still room to grow'}
              {v === 'unsure' && 'Not sure — repotting for fresh soil anyway'}
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
          <p className="text-sm font-medium text-emerald-900">New pot size</p>
          {(
            [
              ['same', 'Same size — refresh soil only'],
              ['one-up', '1–2 inches wider (recommended)'],
              ['two-up', 'Much larger — only if very rootbound'],
            ] as const
          ).map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="pot"
                checked={potSize === v}
                onChange={() => setPotSize(v)}
              />
              {label}
            </label>
          ))}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" fullWidth onClick={() => setStep(3)}>
              Next
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-emerald-900">Check off as you go</p>
          <ul className="space-y-2">
            {CHECKLIST.map((label) => (
              <li key={label}>
                <label className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={done.has(label)}
                    onChange={() => toggleStep(label)}
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
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button type="button" fullWidth disabled={submitting} onClick={finish}>
              {submitting ? 'Saving…' : 'Complete repot'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
