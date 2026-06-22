import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { GrowthMeasurementsPanel } from '../../components/journal/GrowthMeasurementsPanel';
import JournalPhotoCompare from '../../components/JournalPhotoCompare';
import {
  extractMeasurementPoints,
  measurementDeltaSummary,
  measurementSummaryForEntry,
  pickCompareIdsAroundEntry,
  pickLatestPhotoCompareIds,
  pickPhotoCompareIds,
} from '../../utils/journalMeasurements';
import { journalPrompts } from './constants';
import { usePlantProfile } from './PlantProfileContext';
import { PlantTimeline, ProfileSection, SectionEmptyState } from './shared';
import type { PlantRecord } from './types';
import { resolveApiAssetUrl } from '../../utils/apiAssets';

export default function PlantJournalTab() {
  const ctx = usePlantProfile();
  const photoEntries = useMemo(
    () => ctx.journalEntries.filter((e) => e.photoUrl),
    [ctx.journalEntries],
  );
  const measurementPoints = useMemo(
    () => extractMeasurementPoints(ctx.journalEntries),
    [ctx.journalEntries],
  );
  const [compareBeforeId, setCompareBeforeId] = useState('');
  const [compareAfterId, setCompareAfterId] = useState('');

  useEffect(() => {
    const defaults = pickPhotoCompareIds(photoEntries);
    if (!defaults) return;
    setCompareBeforeId((current) => current || defaults.beforeId);
    setCompareAfterId((current) => current || defaults.afterId);
  }, [photoEntries]);

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
          measurementPoints={measurementPoints}
          compareUrls={compareUrls}
          compareBeforeId={compareBeforeId}
          compareAfterId={compareAfterId}
          onBeforeChange={setCompareBeforeId}
          onAfterChange={setCompareAfterId}
          onCompareEntry={(entryId) => {
            const pick = pickCompareIdsAroundEntry(photoEntries, entryId);
            if (pick) {
              setCompareBeforeId(pick.beforeId);
              setCompareAfterId(pick.afterId);
            }
          }}
          ctx={ctx}
        />
      </div>
    </ProfileSection>
  );
}

function JournalForm() {
  const ctx = usePlantProfile();
  const isEditing = Boolean(ctx.editingJournalId);
  const hasContent = ctx.hasJournalContent;

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
        <span className="ml-1 text-xs font-normal text-gray-500">(optional if you add a photo)</span>
        <textarea
          value={ctx.journalNotes}
          onChange={(e) => ctx.setJournalNotes(e.target.value)}
          placeholder="Add a note about growth, soil, pests, symptoms, or what changed after care..."
          rows={4}
          className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
      </label>

      <fieldset className="rounded-xl border border-emerald-100/80 bg-white/60 p-3">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Growth measurements (optional)
        </legend>
        <p className="mb-3 text-xs text-gray-500">
          Log numbers on their own or with notes and photos — trends appear in the sidebar.
        </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-gray-700">Height (cm)</span>
          <input
            type="number"
            min={0}
            value={ctx.journalHeightCm}
            onChange={(e) => ctx.setJournalHeightCm(e.target.value)}
            className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
            placeholder="e.g. 42"
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
            placeholder="e.g. 28"
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
            placeholder="e.g. 42"
          />
        </label>
      </div>
      </fieldset>

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
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) ctx.setJournalPhoto(file);
          }}
          className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
        />
        {ctx.journalPhotoPreview ? (
          <div className="mt-3 space-y-2">
            <img
              src={resolveApiAssetUrl(ctx.journalPhotoPreview) ?? undefined}
              alt="Journal entry photo preview"
              className="max-h-48 w-full rounded-2xl object-cover border border-emerald-100"
            />
            <button
              type="button"
              onClick={() => ctx.clearJournalPhoto()}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Remove photo
            </button>
          </div>
        ) : null}
      </label>

      {ctx.journalError ? (
        <p className="text-sm text-rose-600" role="alert">
          {ctx.journalError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!hasContent}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isEditing ? 'Save changes' : 'Save journal entry'}
      </button>
    </form>
  );
}

function JournalSidebar({
  photoEntries,
  measurementPoints,
  compareUrls,
  compareBeforeId,
  compareAfterId,
  onBeforeChange,
  onAfterChange,
  onCompareEntry,
  ctx,
}: {
  photoEntries: PlantRecord[];
  measurementPoints: ReturnType<typeof extractMeasurementPoints>;
  compareUrls: { before: string; after: string } | null;
  compareBeforeId: string;
  compareAfterId: string;
  onBeforeChange: (id: string) => void;
  onAfterChange: (id: string) => void;
  onCompareEntry: (id: string) => void;
  ctx: ReturnType<typeof usePlantProfile>;
}) {
  const beforeEntry = photoEntries.find((e) => e.id === compareBeforeId);
  const afterEntry = photoEntries.find((e) => e.id === compareAfterId);
  const compareDeltaNote =
    beforeEntry && afterEntry ? measurementDeltaSummary(beforeEntry, afterEntry) : null;
  const beforeSummary = beforeEntry ? measurementSummaryForEntry(beforeEntry) : null;
  const afterSummary = afterEntry ? measurementSummaryForEntry(afterEntry) : null;
  const compareMeasurementNote =
    beforeEntry && afterEntry
      ? [measurementSummaryForEntry(beforeEntry), measurementSummaryForEntry(afterEntry)]
          .filter(Boolean)
          .join(' → ')
      : null;

  return (
    <div className="space-y-4">
      <GrowthMeasurementsPanel points={measurementPoints} />

      {photoEntries.length >= 2 ? (
        <div className="rounded-2xl border border-emerald-100 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-950">Compare growth photos</p>
            <button
              type="button"
              onClick={() => {
                const latest = pickLatestPhotoCompareIds(photoEntries);
                if (latest) {
                  onBeforeChange(latest.beforeId);
                  onAfterChange(latest.afterId);
                }
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Latest pair
            </button>
            <button
              type="button"
              onClick={() => {
                const defaults = pickPhotoCompareIds(photoEntries);
                if (defaults) {
                  onBeforeChange(defaults.beforeId);
                  onAfterChange(defaults.afterId);
                }
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Oldest → newest
            </button>
          </div>
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
            <>
              {compareDeltaNote ? (
                <p className="rounded-2xl bg-lime-50 px-3 py-2 text-xs text-lime-950 ring-1 ring-lime-100">
                  <span className="font-semibold">Measurement change: </span>
                  {compareDeltaNote}
                </p>
              ) : compareMeasurementNote ? (
                <p className="text-xs text-gray-600">{compareMeasurementNote}</p>
              ) : null}
              {(beforeSummary || afterSummary) && (
                <div className="grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                  <p className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">Earlier: </span>
                    {beforeSummary || 'No measurements'}
                  </p>
                  <p className="rounded-xl bg-gray-50 px-3 py-2">
                    <span className="font-semibold text-gray-700">Later: </span>
                    {afterSummary || 'No measurements'}
                  </p>
                </div>
              )}
              <JournalPhotoCompare
                beforeUrl={compareUrls.before}
                afterUrl={compareUrls.after}
                beforeLabel={
                  beforeEntry
                    ? format(new Date(beforeEntry.createdAt as string), 'MMM d, yyyy')
                    : 'Earlier'
                }
                afterLabel={
                  afterEntry
                    ? format(new Date(afterEntry.createdAt as string), 'MMM d, yyyy')
                    : 'Later'
                }
              />
            </>
          ) : null}
        </div>
      ) : null}

      {ctx.timelineEvents.length ? (
        <PlantTimeline
          events={ctx.timelineEvents}
          busyJournalId={ctx.busyJournalId}
          onEditJournal={(journalId) => ctx.setEditingJournalId(journalId)}
          onDeleteJournal={(journalId) => ctx.deleteJournalEntry(journalId)}
          onCompareJournal={(journalId) => onCompareEntry(journalId)}
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
  const measurements = measurementSummaryForEntry(entry);
  const note = ((entry.notes as string) || (measurements ? 'Measurements' : 'Photo')).slice(0, 32);
  return measurements ? `${date} — ${measurements}` : `${date} — ${note}`;
}
