import { FormEvent, useState } from 'react';
import { Textarea } from './ui/Input';

interface DiagnosisFormProps {
  plantName: string;
  onSubmit: (symptomsText: string, image?: File) => Promise<void>;
}

export default function DiagnosisForm({ plantName, onSubmit }: DiagnosisFormProps) {
  const [symptoms, setSymptoms] = useState('');
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
      await onSubmit(symptoms.trim(), photo ?? undefined);
      setSymptoms('');
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
