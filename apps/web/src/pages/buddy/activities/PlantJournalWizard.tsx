import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, journalApi, plantsApi } from '../../../services/api';

const PROMPTS = [
  'What changed since your last visit?',
  'Any new growth, buds, or flowers?',
  'How does the soil feel today?',
  'Anything worrying you about this plant?',
  'One win you want to remember this week.',
];

type PlantRow = { id: string; nickname: string | null; species: { commonName: string } };

export default function PlantJournalWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<PlantRow[]>([]);
  const [plantId, setPlantId] = useState('');
  const [prompt, setPrompt] = useState(PROMPTS[0]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const finish = async () => {
    if (!plantId) {
      setMessage('Select a plant.');
      return;
    }
    const trimmed = notes.trim();
    if (trimmed.length < 20) {
      setMessage('Write at least a few words (20+ characters) for your journal entry.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await journalApi.create(plantId, { notes: `${prompt}\n\n${trimmed}` }, file ?? undefined);
      const { data } = await buddyApi.completeActivity({
        activityType: 'PLANT_JOURNAL',
        plantId,
        notes: trimmed,
      });
      setMessage(
        `Saved to journal! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.`,
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
        title="📓 Plant journal"
        description="Reflect on one plant — entry saves to your timeline."
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

        <p className="rounded-xl bg-emerald-50/80 px-3 py-2 text-sm italic text-emerald-900">
          {prompt}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
        >
          Another prompt
        </Button>

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Your entry</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Take your time — a few sentences is perfect."
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Photo (optional)</span>
          <input
            type="file"
            accept="image/*"
            className="mt-1 w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {preview && (
          <img
            src={preview}
            alt="Preview"
            loading="lazy"
            className="max-h-40 w-full rounded-2xl object-cover"
          />
        )}

        {message && <p className="text-sm text-emerald-800">{message}</p>}

        <Button type="button" fullWidth disabled={submitting} onClick={finish}>
          {submitting ? 'Saving…' : 'Save journal entry'}
        </Button>
      </Card>
    </div>
  );
}
