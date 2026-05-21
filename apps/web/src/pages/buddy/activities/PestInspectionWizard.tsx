import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, diagnosisChatApi, plantsApi } from '../../../services/api';

const SIGNS = [
  'Sticky residue on leaves',
  'Webbing under leaves',
  'Tiny flying insects',
  'Speckled / stippled leaves',
  'Visible bugs on stems',
  'No issues spotted',
] as const;

export default function PestInspectionWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<
    { id: string; nickname: string | null; species: { commonName: string } }[]
  >([]);
  const [plantId, setPlantId] = useState('');
  const [signs, setSigns] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
  }, []);

  const toggle = (label: string) => {
    setSigns((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const hasConcern = [...signs].some((s) => s !== 'No issues spotted');

  const finish = async () => {
    if (!plantId) {
      setMessage('Select a plant.');
      return;
    }
    if (signs.size === 0) {
      setMessage('Check at least one box.');
      return;
    }
    const plant = plants.find((p) => p.id === plantId);
    const name = plant?.nickname || plant?.species.commonName || 'plant';
    const summary = `Pest check — ${name}: ${[...signs].join(', ')}${notes ? `. ${notes}` : ''}`;

    setSubmitting(true);
    setMessage('');
    try {
      const { data } = await buddyApi.completeActivity({
        activityType: 'PEST_INSPECTION',
        plantId,
        notes: summary,
      });
      const extra =
        data.activity.tasksCompleted > 0
          ? ` ${data.activity.tasksCompleted} inspect task(s) updated.`
          : '';
      setMessage(
        `Done! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.${extra}`,
      );
      if (hasConcern) {
        const symptomMsg = `Pest inspection: ${[...signs].filter((s) => s !== 'No issues spotted').join(', ')}${notes ? `. ${notes}` : ''}`;
        try {
          await diagnosisChatApi.create(plantId, symptomMsg);
        } catch {
          // Health tab still available if chat seed fails
        }
        setTimeout(() => navigate(`/garden/plants/${plantId}/health`), 1200);
      } else {
        setTimeout(() => navigate('/garden/buddy/quests'), 1500);
      }
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
        title="🔍 Pest inspection"
        description="Scan leaves and stems — open Dr. Plant if something looks off."
      />

      <Card className="space-y-4">
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

        <p className="text-sm font-medium text-emerald-900">What did you notice?</p>
        <ul className="space-y-2">
          {SIGNS.map((label) => (
            <li key={label}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={signs.has(label)} onChange={() => toggle(label)} />
                {label}
              </label>
            </li>
          ))}
        </ul>

        {plantId && hasConcern && (
          <Link
            to={`/garden/plants/${plantId}/health`}
            className="block rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-center text-sm font-semibold text-rose-950 hover:bg-rose-100"
          >
            Open Dr. Plant for this plant →
          </Link>
        )}

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

        <Button type="button" fullWidth disabled={submitting} onClick={finish}>
          {submitting ? 'Saving…' : 'Complete inspection'}
        </Button>
      </Card>
    </div>
  );
}
