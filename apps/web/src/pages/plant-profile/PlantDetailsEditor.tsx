import { useState } from 'react';
import { PhotoCaptureZone } from '../../components/plants/PhotoCaptureZone';
import { plantsApi } from '../../services/api';
import { PLANT_DETAILS_SECTION_ID } from '../../utils/gardenPaths';
import { usePlantProfile } from './PlantProfileContext';

const POT_OPTIONS = [
  { value: 'SMALL', label: 'Small pot' },
  { value: 'MEDIUM', label: 'Medium pot' },
  { value: 'LARGE', label: 'Large pot' },
] as const;

export function PlantDetailsEditor() {
  const ctx = usePlantProfile();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState('');
  const [potSize, setPotSize] = useState('MEDIUM');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const startEdit = () => {
    setNickname((ctx.plant?.nickname as string) || '');
    setPotSize((ctx.plant?.potSize as string) || 'MEDIUM');
    setNotes((ctx.plant?.notes as string) || '');
    setPhotoPreview((ctx.plant?.imageUrl as string) || null);
    setPendingPhoto(null);
    setMessage('');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setPendingPhoto(null);
    setPhotoPreview((ctx.plant?.imageUrl as string) || null);
    setMessage('');
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      let imageUrl: string | undefined | null = undefined;
      if (pendingPhoto) {
        setUploadingPhoto(true);
        const { data: uploadData } = await plantsApi.upload(pendingPhoto);
        imageUrl = uploadData.url as string;
        setUploadingPhoto(false);
      }

      const { data } = await plantsApi.update(ctx.id, {
        nickname: nickname.trim() || undefined,
        potSize,
        notes: notes.trim() || undefined,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
      });
      ctx.load();
      setEditing(false);
      setPendingPhoto(null);
      setPhotoPreview((data.imageUrl as string) || null);
      setMessage(
        data.tasksRescheduled
          ? 'Details saved. Upcoming care tasks were refreshed for the new pot or location.'
          : 'Plant details saved.',
      );
    } catch {
      setMessage('Could not save details. Try again.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const busy = saving || uploadingPhoto;

  return (
    <div
      id={PLANT_DETAILS_SECTION_ID}
      className="scroll-anchor rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Plant details
          </p>
          <p className="mt-0.5 text-sm text-gray-600">Nickname, pot size, notes, and photo</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            className="min-h-11 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
          >
            Edit details
          </button>
        ) : null}
      </div>

      {!editing ? (
        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-gray-500">Nickname</dt>
            <dd className="font-medium text-emerald-950">
              {(ctx.plant?.nickname as string) || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Pot size</dt>
            <dd className="font-medium text-emerald-950">
              {POT_OPTIONS.find((o) => o.value === ctx.plant?.potSize)?.label ||
                String(ctx.plant?.potSize || 'Medium')}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Notes</dt>
            <dd className="text-gray-800 whitespace-pre-wrap">
              {(ctx.plant?.notes as string) || '—'}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Nickname</span>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Kitchen monstera"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
              disabled={busy}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Pot size</span>
            <select
              value={potSize}
              onChange={(e) => setPotSize(e.target.value)}
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
              disabled={busy}
            >
              {POT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Changing pot size refreshes watering intervals on your schedule.
            </p>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Care preferences, repot history, quirks…"
              className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm resize-none"
              disabled={busy}
            />
          </label>
          <PhotoCaptureZone
            label="Update plant photo"
            hint="Optional — replaces the current profile image"
            busy={uploadingPhoto}
            previewUrl={photoPreview}
            onFile={(file) => {
              setPendingPhoto(file);
              setPhotoPreview(URL.createObjectURL(file));
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy}
              className="min-h-11 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save details'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={busy}
              className="min-h-11 rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}
    </div>
  );
}
