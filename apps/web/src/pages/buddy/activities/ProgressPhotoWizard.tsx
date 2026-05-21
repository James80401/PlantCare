import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { buddyApi, journalApi, plantsApi } from '../../../services/api';

export default function ProgressPhotoWizard() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState<
    { id: string; nickname: string | null; species: { commonName: string } }[]
  >([]);
  const [plantId, setPlantId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    plantsApi.list().then(({ data }) => setPlants(data));
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
    if (!file) {
      setMessage('Add a photo to continue.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      await journalApi.create(plantId, { notes: notes || 'Progress photo' }, file);
      const { data } = await buddyApi.completeActivity({
        activityType: 'PROGRESS_PHOTO',
        plantId,
        notes: notes || undefined,
      });
      setMessage(
        `Photo saved! +${data.activity.sunlightEarned} sunlight, +${data.activity.dewdropsEarned} dewdrops.`,
      );
      setTimeout(() => navigate('/garden/buddy'), 1500);
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setMessage(raw || 'Could not save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Activity"
        title="📸 Progress photo"
        description="Capture growth — saved to your plant journal."
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

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Photo</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-1 w-full text-sm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {preview && (
          <img src={preview} alt="Preview" className="max-h-48 w-full rounded-2xl object-cover" />
        )}

        <label className="block text-sm">
          <span className="font-medium text-emerald-900">Caption (optional)</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        {message && <p className="text-sm text-emerald-800">{message}</p>}

        <Button type="button" fullWidth disabled={submitting} onClick={finish}>
          {submitting ? 'Uploading…' : 'Save photo'}
        </Button>
      </Card>
    </div>
  );
}
