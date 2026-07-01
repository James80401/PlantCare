import { FormEvent, useEffect, useState } from 'react';
import { Textarea } from './ui/Input';
import { formatApiErrorMessage } from '../utils/apiError';

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

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setPhotoKey((key) => key + 1);
  };

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
      clearPhoto();
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not run diagnosis. Try again in a moment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
    >
      <DiagnosisHeader plantName={plantName} />
      <Textarea
        label="What are you seeing?"
        value={symptoms}
        onChange={(e) => setSymptoms(e.target.value)}
        placeholder="Yellow lower leaves, soggy soil, spots on new growth..."
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
        I can see pests, webbing, or sticky residue
      </label>
      <DiagnosisPhotoField
        photoKey={photoKey}
        previewUrl={photoPreview}
        onClear={clearPhoto}
        onPick={(file) => {
          setPhoto(file);
          setPhotoPreview((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />
      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Analyzing...' : 'Run diagnosis'}
      </button>
    </form>
  );
}

function DiagnosisHeader({ plantName }: { plantName: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        Symptom intake
      </p>
      <h3 className="mt-1 font-semibold text-emerald-950">Check {plantName}</h3>
      <p className="mt-1 text-sm text-gray-600">
        Add symptoms and a clear photo if you have one. Dr. Plant will return a saved plant-care
        diagnosis with next steps and uncertainty noted.
      </p>
      <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 ring-1 ring-amber-100">
        If there is mold spreading fast, chemical exposure, or a pet or person may have eaten the
        plant, treat that as urgent and contact the right professional source.
      </p>
    </div>
  );
}

function DiagnosisPhotoField({
  photoKey,
  previewUrl,
  onPick,
  onClear,
}: {
  photoKey: number;
  previewUrl: string | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-emerald-950">
            Photo evidence (optional)
          </label>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Best results come from bright, close photos of the affected leaf plus the whole plant.
          </p>
        </div>
        <input
          key={photoKey}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          className="block max-w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-800"
        />
      </div>
      {previewUrl ? (
        <div className="mt-3 space-y-2">
          <img
            src={previewUrl}
            alt="Symptom photo preview"
            loading="lazy"
            className="max-h-48 w-full rounded-2xl border border-emerald-100 object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-rose-700 hover:underline"
          >
            Remove photo
          </button>
        </div>
      ) : null}
    </div>
  );
}
