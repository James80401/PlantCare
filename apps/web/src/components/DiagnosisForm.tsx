import { FormEvent, useState } from 'react';
import { Textarea } from './ui/Input';

interface DiagnosisFormProps {
  plantName: string;
  onSubmit: (
    payload: {
      symptomsText?: string;
      symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
      recentCareChange?: 'NONE' | 'WATERING' | 'LIGHT' | 'REPOT' | 'FERTILIZER' | 'TEMPERATURE' | 'PEST_TREATMENT';
      pestsVisible?: boolean;
    },
    image?: File,
  ) => Promise<void>;
}

export default function DiagnosisForm({ plantName, onSubmit }: DiagnosisFormProps) {
  const [symptoms, setSymptoms] = useState('');
  const [symptomDuration, setSymptomDuration] = useState<
    'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS'
  >('TODAY');
  const [recentCareChange, setRecentCareChange] = useState<
    'NONE' | 'WATERING' | 'LIGHT' | 'REPOT' | 'FERTILIZER' | 'TEMPERATURE' | 'PEST_TREATMENT'
  >('NONE');
  const [pestsVisible, setPestsVisible] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim() && !photo) {
      setError('Describe symptoms or attach a photo.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(
        {
          symptomsText: symptoms.trim() || undefined,
          symptomDuration,
          recentCareChange,
          pestsVisible,
        },
        photo ?? undefined,
      );
      setSymptoms('');
      setSymptomDuration('TODAY');
      setRecentCareChange('NONE');
      setPestsVisible(false);
      setPhoto(null);
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setPhotoKey((key) => key + 1);
    } catch {
      setError('Could not run diagnosis. Try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-4"
    >
      <motionHeader plantName={plantName} />
      <Textarea
        label="What are you seeing?"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Yellow lower leaves, soggy soil, spots on new growth…"
        rows={4}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="font-medium text-gray-700">How long has this been happening?</span>
          <select
            value={symptomDuration}
            onChange={(e) =>
              setSymptomDuration(
                e.target.value as 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS',
              )
            }
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
          >
            <option value="TODAY">Today</option>
            <option value="DAYS_2_3">2-3 days</option>
            <option value="DAYS_4_7">4-7 days</option>
            <option value="WEEKS_2_PLUS">2+ weeks</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="font-medium text-gray-700">Any recent changes?</span>
          <select
            value={recentCareChange}
            onChange={(e) =>
              setRecentCareChange(
                e.target.value as
                  | 'NONE'
                  | 'WATERING'
                  | 'LIGHT'
                  | 'REPOT'
                  | 'FERTILIZER'
                  | 'TEMPERATURE'
                  | 'PEST_TREATMENT',
              )
            }
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
          >
            <option value="NONE">No recent changes</option>
            <option value="WATERING">Watering routine</option>
            <option value="LIGHT">Light exposure</option>
            <option value="REPOT">Repotting</option>
            <option value="FERTILIZER">Fertilizer usage</option>
            <option value="TEMPERATURE">Temperature/humidity shift</option>
            <option value="PEST_TREATMENT">Pest treatment</option>
          </select>
        </label>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={pestsVisible}
          onChange={(e) => setPestsVisible(e.target.checked)}
          className="h-4 w-4 rounded border-emerald-200 text-emerald-700"
        />
        I can see pests/webbing/sticky residue
      </label>
      <motionPhotoField
        photoKey={photoKey}
        previewUrl={photoPreview}
        onPick={(file) => {
          setPhoto(file);
          setPhotoPreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Analyzing…' : 'Run diagnosis'}
      </button>
    </form>
  );
}

function motionHeader({ plantName }: { plantName: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Symptom check
      </p>
      <h3 className="mt-1 font-semibold text-emerald-950">Check {plantName}</h3>
      <p className="mt-1 text-sm text-gray-600">
        Add a clear photo and symptoms for a structured treatment plan.
      </p>
    </div>
  );
}

function motionPhotoField({
  photoKey,
  previewUrl,
  onPick,
}: {
  photoKey: number;
  previewUrl: string | null;
  onPick: (file: File | null) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Photo (optional)</label>
      <input
        key={photoKey}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        className="mt-1.5 block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-800"
      />
      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Symptom photo preview"
          className="mt-3 max-h-48 w-full rounded-2xl object-cover border border-emerald-100"
        />
      ) : null}
    </div>
  );
}
