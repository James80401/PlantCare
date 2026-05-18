import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import JournalPhotoCompare from '../../components/JournalPhotoCompare';
import { journalPrompts } from './constants';
import { usePlantProfile } from './PlantProfileContext';
import { PlantTimeline, ProfileSection, SectionEmptyState } from './shared';
import type { PlantRecord } from './types';

export default function PlantJournalTab() {
  const ctx = usePlantProfile();
  const photoEntries = useMemo(
    () => ctx.journalEntries.filter((e) => e.photoUrl),
    [ctx.journalEntries],
  );
  const [compareBeforeId, setCompareBeforeId] = useState('');
  const [compareAfterId, setCompareAfterId] = useState('');

  const compareUrls = useMemo(() => {
    const before = photoEntries.find((e) => e.id === compareBeforeId);
    const after = photoEntries.find((e) => e.id === compareAfterId);
    if (!before?.photoUrl || !after?.photoUrl) return null;
    return { before: before.photoUrl as string, after: after.photoUrl as string };
  }, [photoEntries, compareBeforeId, compareAfterId]);

  return (
    <ProfileSection
      eyebrow="History"
      title="Journal"
      description="Capture observations, measurements, and photos. Edit or delete entries from the timeline."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <JournalForm />

        <JournalSidebar
          photoEntries={photoEntries}
          compareUrls={compareUrls}
          compareBeforeId={compareBeforeId}
          compareAfterId={compareAfterId}
          onBeforeChange={setCompareBeforeId}
          onAfterChange={setCompareAfterId}
          ctx={ctx}
        />
      </div>
    </ProfileSection>
  );
}

function JournalForm() {
  const ctx = usePlantProfile();
  const isEditing = Boolean(ctx.editingJournalId);

  return (
    <form
      onSubmit={isEditing ? ctx.saveJournalEdit : ctx.addJournal}
      className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-4"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-950">
          {isEditing ? 'Edit journal entry' : 'New observation'}
        </p>
        {isEditing ? (
          <button
            type="button"
            onClick={() => ctx.setEditingJournalId(null)}
            className="mt-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Cancel edit
          </button>
        ) : null}
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Notes</span>
        <textarea
          value={ctx.journalNotes}
          onChange={(e) => ctx.setJournalNotes(e.target.value)}
          placeholder="Add a note about growth, soil, pests, symptoms, or what changed after care..."
          rows={4}
          className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Height (cm)</span>
          <input
            type="number"
            min={0}
            value={ctx.journalHeightCm}
            onChange={(e) => ctx.setJournalHeightCm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Width (cm)</span>
          <input
            type="number"
            min={0}
            value={ctx.journalWidthCm}
            onChange={(e) => ctx.setJournalWidthCm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Leaf count</span>
          <input
            type="number"
            min={0}
            value={ctx.journalLeafCount}
            onChange={(e) => ctx.setJournalLeafCount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Helpful prompts
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {journalPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => ctx.appendJournalPrompt(prompt)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-emerald-950">Progress photo</span>
        <input
          key={ctx.journalPhotoInputKey}
          type="file"
          accept="image/*"
          onChange={(event) => ctx.setJournalPhoto(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
      </label>

      <button
        type="submit"
        disabled={!ctx.journalNotes.trim() && !ctx.journalPhoto && !isEditing}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isEditing ? 'Save changes' : 'Save journal entry'}
      </button>
    </form>
  );
}

function JournalSidebar({
  photoEntries,
  compareUrls,
  compareBeforeId,
  compareAfterId,
  onBeforeChange,
  onAfterChange,
  ctx,
}: {
  photoEntries: PlantRecord[];
  compareUrls: { before: string; after: string } | null;
  compareBeforeId: string;
  compareAfterId: string;
  onBeforeChange: (id: string) => void;
  onAfterChange: (id: string) => void;
  ctx: ReturnType<typeof usePlantProfile>;
}) {
  return (
    <div className="space-y-4">
      {photoEntries.length >= 2 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          <p className="text-sm font-semibold text-emerald-950">Compare growth photos</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-600">
              Earlier photo
              <select
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                value={compareBeforeId}
                onChange={(e) => onBeforeChange(e.target.value)}
              >
                <option value="">Select…</option>
                {photoEntries.map((entry) => (
                  <option key={`b-${entry.id as string}`} value={entry.id as string}>
                    {formatJournalOption(entry)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-gray-600">
              Later photo
              <select
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                value={compareAfterId}
                onChange={(e) => onAfterChange(e.target.value)}
              >
                <option value="">Select…</option>
                {photoEntries.map((entry) => (
                  <option key={`a-${entry.id as string}`} value={entry.id as string}>
                    {formatJournalOption(entry)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {compareUrls ? (
            <JournalPhotoCompare beforeUrl={compareUrls.before} afterUrl={compareUrls.after} />
          ) : null}
        </div>
      ) : null}

      {ctx.timelineEvents.length ? (
        <PlantTimeline
          events={ctx.timelineEvents}
          busyJournalId={ctx.busyJournalId}
          onEditJournal={(journalId) => ctx.setEditingJournalId(journalId)}
          onDeleteJournal={(journalId) => ctx.deleteJournalEntry(journalId)}
        />
      ) : (
        <SectionEmptyState
          title="No timeline events yet"
          body="Add a note or complete a task to start building this plant's care history."
        />
      )}
    </div>
  );
}

function formatJournalOption(entry: PlantRecord) {
  const date = format(new Date(entry.createdAt as string), 'MMM d, yyyy');
  const note = ((entry.notes as string) || 'Photo').slice(0, 40);
  return `${date} — ${note}`;
}
