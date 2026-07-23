import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { GrowthMeasurementsPanel } from '../../components/journal/GrowthMeasurementsPanel';
import JournalPhotoCompare from '../../components/JournalPhotoCompare';
import { plantProgressApi, type PlantProgressPayload } from '../../services/api';
import { resolveApiAssetUrl } from '../../utils/apiAssets';
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
  const progressEntries = useMemo(
    () => ((ctx.plant.progressEntries as PlantRecord[] | undefined) || []),
    [ctx.plant],
  );
  const latestJournalEntry = useMemo(() => pickLatestEntry(ctx.journalEntries), [ctx.journalEntries]);
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
      description="Capture quick journal notes, periodic Plant Check-Ins, photos, and care history in one place."
      help="plant-journal"
    >
      <JournalProgressStory
        journalEntries={ctx.journalEntries}
        photoEntries={photoEntries}
        measurementCount={measurementPoints.length}
        timelineCount={ctx.timelineEvents.length}
        latestEntry={latestJournalEntry}
      />

      <JournalModeGuide />

      <ProgressCheckInPanel progressEntries={progressEntries} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
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

function ProgressCheckInPanel({ progressEntries }: { progressEntries: PlantRecord[] }) {
  const ctx = usePlantProfile();
  const location = useLocation();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [overallHealth, setOverallHealth] = useState('STABLE');
  const [growthChange, setGrowthChange] = useState('');
  const [leafCondition, setLeafCondition] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('');
  const [pestSigns, setPestSigns] = useState('');
  const [recentCare, setRecentCare] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [latestResult, setLatestResult] = useState<PlantRecord | null>(null);

  const progressTaskId = useMemo(
    () => new URLSearchParams(location.search).get('progressTask') || '',
    [location.search],
  );
  const pendingHealthChecks = ctx.pending.filter((task) => task.taskType === 'HEALTH_CHECK');
  const pendingRoutineCheck =
    pendingHealthChecks.find((task) => task.id === progressTaskId) ||
    pendingHealthChecks.find((task) => !task.sourceDiagnosisId);
  const latestProgress = progressEntries[0];
  const isEditing = Boolean(editingEntryId);
  const previewUrl = photoPreview || (existingPhotoUrl ? resolveApiAssetUrl(existingPhotoUrl) : null);
  const plantLifeMilestones = useMemo(
    () => plantLifeMilestonesForPlant(ctx.plant.milestones as PlantRecord[] | undefined, ctx.id),
    [ctx.plant, ctx.id],
  );
  const progressMilestones = useMemo(() => progressBadges(progressEntries), [progressEntries]);

  useEffect(() => {
    if (location.hash !== '#progress-check-in') return;
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      formRef.current?.querySelector('select')?.focus();
    }, 50);
  }, [location.hash, location.search]);

  const setProgressPhoto = (file: File | null) => {
    setPhoto(file);
    if (file) setRemovePhoto(false);
    setPhotoPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
    setExistingPhotoUrl(null);
    setRemovePhoto(true);
    setPhotoInputKey((key) => key + 1);
  };

  const resetForm = () => {
    setOverallHealth('STABLE');
    setGrowthChange('');
    setLeafCondition('');
    setSoilMoisture('');
    setPestSigns('');
    setRecentCare('');
    setNotes('');
    setEditingEntryId(null);
    setExistingPhotoUrl(null);
    setRemovePhoto(false);
    setPhoto(null);
    setPhotoPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
    setPhotoInputKey((key) => key + 1);
  };

  const startEdit = (entry: PlantRecord) => {
    setEditingEntryId(entry.id as string);
    setOverallHealth((entry.overallHealth as string) || 'STABLE');
    setGrowthChange((entry.growthChange as string) || '');
    setLeafCondition((entry.leafCondition as string) || '');
    setSoilMoisture((entry.soilMoisture as string) || '');
    setPestSigns((entry.pestSigns as string) || '');
    setRecentCare((entry.recentCare as string) || '');
    setNotes((entry.notes as string) || '');
    setPhoto(null);
    setPhotoPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return null;
    });
    setExistingPhotoUrl((entry.photoUrl as string | null) || null);
    setRemovePhoto(false);
    setPhotoInputKey((key) => key + 1);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const progressPayload = (): PlantProgressPayload => ({
    overallHealth,
    growthChange: growthChange || null,
    leafCondition: leafCondition || null,
    soilMoisture: soilMoisture || null,
    pestSigns: pestSigns || null,
    recentCare: recentCare || null,
    notes: notes.trim() || null,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = progressPayload();
      const { data } = editingEntryId
        ? await plantProgressApi.update(
            ctx.id,
            editingEntryId,
            { ...payload, removePhoto },
            photo ?? undefined,
          )
        : await plantProgressApi.create(
            ctx.id,
            { ...payload, taskId: pendingRoutineCheck?.id as string | undefined },
            photo ?? undefined,
          );
      setLatestResult(data);
      resetForm();
      await ctx.load();
    } catch {
      setError(isEditing ? 'Could not update this Plant Check-In.' : 'Could not save this Plant Check-In.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (
      !window.confirm(
        'Delete this Plant Check-In? This removes the entry, refreshes Plant Life history, and cannot be undone.',
      )
    ) {
      return;
    }
    setBusyEntryId(entryId);
    setError('');
    try {
      await plantProgressApi.remove(ctx.id, entryId);
      if (editingEntryId === entryId) resetForm();
      await ctx.load();
    } catch {
      setError('Could not delete this Plant Check-In.');
    } finally {
      setBusyEntryId(null);
    }
  };

  return (
    <section id="progress-check-in" className="mt-5 rounded-2xl border border-lime-100 bg-lime-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">
            Plant Life
          </p>
          <h3 className="mt-1 font-semibold text-emerald-950">
            Check in on {ctx.plantLabel}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
            Log a quick health snapshot every month or so. Dr. Plant compares it with previous
            check-ins and saves the story to this plant's Plant Life history.
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-lime-900 ring-1 ring-lime-100">
          {progressEntries.length} check-in{progressEntries.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <form
          ref={formRef}
          onSubmit={submit}
          className="space-y-4 rounded-2xl bg-white/75 p-4 ring-1 ring-lime-100"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-emerald-950">
              {isEditing ? 'Edit Plant Check-In' : 'New Plant Check-In'}
            </p>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-lime-50"
              >
                Cancel edit
              </button>
            ) : null}
          </div>

          <p className="rounded-2xl bg-lime-50 px-3 py-2 text-xs leading-5 text-lime-950 ring-1 ring-lime-100">
            Most check-ins only need the dropdowns. Notes and photos are optional, but helpful when
            you are tracking symptoms or recovery.
          </p>

          {isEditing ? (
            <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 ring-1 ring-amber-100">
              Saving changes refreshes the Dr. Plant summary for this Plant Check-In.
            </p>
          ) : null}

          <ProgressFieldGroup title="Overall condition">
            <ProgressSelect
              label="Overall health"
              value={overallHealth}
              onChange={setOverallHealth}
              options={OVERALL_HEALTH_OPTIONS}
              required
            />
          </ProgressFieldGroup>

          <ProgressFieldGroup title="Leaves and growth">
            <ProgressSelect
              label="Growth change"
              value={growthChange}
              onChange={setGrowthChange}
              options={GROWTH_CHANGE_OPTIONS}
            />
            <ProgressSelect
              label="Leaves"
              value={leafCondition}
              onChange={setLeafCondition}
              options={LEAF_CONDITION_OPTIONS}
            />
          </ProgressFieldGroup>

          <ProgressFieldGroup title="Soil/water and recent care">
            <ProgressSelect
              label="Soil moisture"
              value={soilMoisture}
              onChange={setSoilMoisture}
              options={SOIL_MOISTURE_OPTIONS}
            />
            <ProgressSelect
              label="Recent care"
              value={recentCare}
              onChange={setRecentCare}
              options={RECENT_CARE_OPTIONS}
            />
          </ProgressFieldGroup>

          <ProgressFieldGroup title="Pests or concerns">
            <ProgressSelect
              label="Pest signs"
              value={pestSigns}
              onChange={setPestSigns}
              options={PEST_SIGNS_OPTIONS}
            />
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-gray-700">Notes</span>
              <span className="ml-1 text-xs font-normal text-gray-500">(optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="What changed since the last check-in?"
                className="mt-2 w-full rounded-2xl border border-lime-100 px-4 py-3 text-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-100"
              />
            </label>
          </ProgressFieldGroup>

          <label className="block rounded-2xl border border-lime-100 bg-white p-3">
            <span className="text-sm font-semibold text-emerald-950">Optional photo</span>
            <span className="mt-1 block text-xs leading-5 text-gray-600">
              Helpful for color, leaf shape, pest, or recovery changes. You can save the check-in
              without one.
            </span>
            <input
              key={photoInputKey}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setProgressPhoto(file);
              }}
              className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-lime-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {previewUrl ? (
              <div className="mt-3 space-y-2">
                <img
                  src={previewUrl}
                  alt="Plant Check-In photo preview"
                  className="max-h-48 w-full rounded-2xl border border-lime-100 object-cover"
                />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="text-xs font-semibold text-rose-700 hover:underline"
                >
                  Remove photo
                </button>
              </div>
            ) : null}
          </label>

          {pendingRoutineCheck ? (
            <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-100">
              Submitting this will complete the pending health check task due{' '}
              {format(new Date(pendingRoutineCheck.dueDate as string), 'MMM d')}.
            </p>
          ) : null}

          {error ? (
            <p className="text-sm text-rose-600" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-lime-700 px-5 py-2 text-sm font-semibold text-white hover:bg-lime-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Checking in...' : isEditing ? 'Update Plant Check-In' : 'Save Plant Check-In'}
          </button>
        </form>

        <div className="space-y-3">
          <ProgressSummaryCard entry={latestResult || latestProgress} />
          <ProgressTrendStrip entries={progressEntries} />
          <ProgressMilestones milestones={plantLifeMilestones} fallbackBadges={progressMilestones} />
          <ProgressHistoryList
            entries={progressEntries}
            busyEntryId={busyEntryId}
            onEdit={startEdit}
            onDelete={deleteEntry}
          />
        </div>
      </div>
    </section>
  );
}

function ProgressSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      <select
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-lime-100 bg-white px-3 py-2 text-sm"
      >
        {!required ? <option value="">Select...</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProgressFieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-2xl border border-lime-100 bg-white p-3">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-lime-800">
        {title}
      </legend>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function ProgressSummaryCard({ entry }: { entry?: PlantRecord | null }) {
  if (!entry) {
    return (
      <div className="rounded-2xl border border-dashed border-lime-200 bg-white/70 p-4">
        <p className="font-semibold text-emerald-950">No Plant Check-Ins yet</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          The first one becomes the baseline Dr. Plant uses for future Plant Life summaries.
        </p>
      </div>
    );
  }

  const story = parseProgressStory(entry.storyJson);
  const createdAt = entry.createdAt ? new Date(entry.createdAt as string) : null;

  return (
    <div className="rounded-2xl border border-lime-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">Latest Plant Life story</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h4 className="font-semibold text-emerald-950">
          {progressHealthLabel(entry.overallHealth as string)}
        </h4>
        {story.trend ? (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${trendClass(story.trend)}`}>
            {trendLabel(story.trend)}
          </span>
        ) : null}
      </div>
      {createdAt ? (
        <p className="mt-1 text-xs text-gray-500">
          Logged {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>
      ) : null}
      <div className="mt-3 rounded-2xl border border-lime-100 bg-lime-50/80 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-lime-900">Dr. Plant summary</p>
        <p className="mt-1 text-xs leading-5 text-lime-950">
          Generated from this Plant Check-In and prior Plant Life history.
        </p>
        {story.source ? (
          <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-700">
            {story.source === 'openai'
              ? 'AI-assisted summary'
              : 'Rules-based care summary'}
          </p>
        ) : null}
        {entry.analysisSummary ? (
          <p className="mt-2 text-sm leading-6 text-gray-700">{entry.analysisSummary as string}</p>
        ) : (
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Summary unavailable right now. The check-in is saved and can still anchor the next
            Plant Life summary.
          </p>
        )}
        {entry.adviceText ? (
          <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm leading-6 text-lime-950 ring-1 ring-lime-100">
            {entry.adviceText as string}
          </p>
        ) : null}
      </div>
      {story.flags.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {story.flags.map((flag) => (
            <span
              key={flag}
              className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100"
            >
              {flag}
            </span>
          ))}
        </div>
      ) : null}
      {entry.photoUrl ? (
        <img
          src={resolveApiAssetUrl(entry.photoUrl as string) ?? undefined}
          alt="Latest plant progress"
          className="mt-3 max-h-48 w-full rounded-2xl object-cover"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

function ProgressTrendStrip({ entries }: { entries: PlantRecord[] }) {
  if (!entries.length) return null;
  const ordered = [...entries]
    .sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime())
    .slice(-8);

  return (
    <div className="rounded-2xl border border-lime-100 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-950">Health trend</p>
        <p className="text-xs text-gray-500">Last {ordered.length}</p>
      </div>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${ordered.length}, minmax(0, 1fr))` }}>
        {ordered.map((entry) => {
          const score = healthScore(entry.overallHealth as string);
          return (
            <div key={entry.id as string} className="flex flex-col items-center gap-1">
              <div className="flex h-16 w-full items-end rounded-xl bg-lime-50 px-1 pb-1">
                <div
                  className={`w-full rounded-lg ${healthBarClass(entry.overallHealth as string)}`}
                  style={{ height: `${score}%` }}
                  title={progressHealthLabel(entry.overallHealth as string)}
                />
              </div>
              <time className="text-[0.65rem] font-medium text-gray-500">
                {format(new Date(entry.createdAt as string), 'M/d')}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressMilestones({
  milestones,
  fallbackBadges,
}: {
  milestones: PlantRecord[];
  fallbackBadges: string[];
}) {
  if (!milestones.length && !fallbackBadges.length) return null;
  return (
    <div className="rounded-2xl border border-lime-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-950">Plant Life milestones</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Earned from this plant's Plant Check-Ins and Plant Life history.
          </p>
        </div>
        {milestones.length ? (
          <span className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-semibold text-lime-900 ring-1 ring-lime-100">
            {milestones.length}
          </span>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {milestones.length
          ? milestones.map((milestone) => (
              <span
                key={milestone.id as string}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100"
                title={
                  milestone.unlockedAt
                    ? `Unlocked ${format(new Date(milestone.unlockedAt as string), 'MMM d, yyyy')}`
                    : undefined
                }
              >
                {milestone.title as string}
              </span>
            ))
          : fallbackBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-lime-50 px-3 py-1.5 text-xs font-semibold text-lime-900 ring-1 ring-lime-100"
              >
                {badge}
              </span>
            ))}
      </div>
    </div>
  );
}

function ProgressHistoryList({
  entries,
  busyEntryId,
  onEdit,
  onDelete,
}: {
  entries: PlantRecord[];
  busyEntryId: string | null;
  onEdit: (entry: PlantRecord) => void;
  onDelete: (entryId: string) => void;
}) {
  if (!entries.length) return null;
  return (
    <div className="rounded-2xl border border-lime-100 bg-white p-4">
      <p className="text-sm font-semibold text-emerald-950">Plant Check-In history</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">
        Editing refreshes the Dr. Plant summary. Deleting removes the entry and updates Plant Life
        history.
      </p>
      <div className="mt-3 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id as string} className="border-t border-lime-50 pt-3 first:border-t-0 first:pt-0">
            <div className="flex gap-3">
              {entry.photoUrl ? (
                <img
                  src={resolveApiAssetUrl(entry.photoUrl as string) ?? undefined}
                  alt="Plant Check-In"
                  className="h-14 w-14 rounded-xl object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {progressHealthLabel(entry.overallHealth as string)}
                  </p>
                  <time className="shrink-0 text-xs text-gray-400">
                    {format(new Date(entry.createdAt as string), 'MMM d')}
                  </time>
                </div>
                <p className="mt-1 text-xs leading-5 text-gray-600">
                  {summarizeProgressEntry(entry)}
                </p>
                {entry.analysisSummary ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    {entry.analysisSummary as string}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    aria-label={`Edit Plant Check-In from ${format(new Date(entry.createdAt as string), 'MMM d')}`}
                    className="rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-800 hover:bg-lime-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyEntryId === entry.id}
                    onClick={() => onDelete(entry.id as string)}
                    aria-label={`Delete Plant Check-In from ${format(new Date(entry.createdAt as string), 'MMM d')}`}
                    className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    {busyEntryId === entry.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalProgressStory({
  journalEntries,
  photoEntries,
  measurementCount,
  timelineCount,
  latestEntry,
}: {
  journalEntries: PlantRecord[];
  photoEntries: PlantRecord[];
  measurementCount: number;
  timelineCount: number;
  latestEntry: PlantRecord | null;
}) {
  const latestDate = latestEntry?.createdAt ? new Date(latestEntry.createdAt as string) : null;
  const readiness =
    photoEntries.length >= 2
      ? 'Photo comparison is ready'
      : photoEntries.length === 1
        ? 'Add one more photo to compare progress'
        : 'Add photos to build a visual progress story';
  const nextSuggestion =
    measurementCount === 0
      ? 'Log height, width, or leaf count once to start growth trends.'
      : photoEntries.length < 2
        ? 'Take a matching progress photo from the same angle next time.'
        : 'Use the timeline to compare photos after care changes or recovery checks.';

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Plant Life snapshot
          </p>
          <h3 className="mt-1 font-semibold text-emerald-950">
            {latestDate
              ? `Latest update ${formatDistanceToNow(latestDate, { addSuffix: true })}`
              : 'Start this plant history'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-600">{nextSuggestion}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-100">
            {journalEntries.length} journal
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-sky-800 ring-1 ring-sky-100">
            {photoEntries.length} photos
          </span>
          <span className="rounded-full bg-lime-50 px-3 py-1 text-lime-900 ring-1 ring-lime-100">
            {measurementCount} measurements
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-900 ring-1 ring-amber-100">
            {timelineCount} timeline
          </span>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <StoryCue label="Visual record" value={readiness} />
        <StoryCue
          label="Latest note"
          value={
            latestEntry
              ? summarizeLatestEntry(latestEntry)
              : 'Add an observation, care reaction, or progress photo.'
          }
        />
        <StoryCue
          label="Best next log"
          value={
            measurementCount === 0
              ? 'First measurement snapshot'
              : photoEntries.length < 2
                ? 'Second progress photo'
                : 'Recovery or growth change'
          }
        />
      </div>
    </section>
  );
}

function JournalModeGuide() {
  return (
    <section
      className="mt-5 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5"
      aria-labelledby="journal-mode-guide"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">What to log</p>
        <h3 id="journal-mode-guide" className="mt-1 font-semibold text-emerald-950">
          Notes, care events, and Plant Check-Ins each do a different job
        </h3>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <JournalModeCard
          title="Journal note"
          body="A quick observation, photo, or measurement you want to remember."
        />
        <JournalModeCard
          title="Care event"
          body="Completed, skipped, or snoozed care from the Tasks tab. These show in the timeline."
        />
        <JournalModeCard
          title="Plant Check-In"
          body="A periodic health snapshot Dr. Plant summarizes into this plant's Plant Life story."
        />
      </div>
    </section>
  );
}

function JournalModeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-emerald-50/60 px-3 py-3">
      <p className="text-sm font-semibold text-emerald-950">{title}</p>
      <p className="mt-1 text-xs leading-5 text-gray-600">{body}</p>
    </div>
  );
}

function StoryCue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-emerald-50/60 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-1 text-sm leading-5 text-emerald-950">{value}</p>
    </div>
  );
}

function JournalForm() {
  const ctx = usePlantProfile();
  const isEditing = Boolean(ctx.editingJournalId);
  const hasContent = ctx.hasJournalContent;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isEditing) setOpen(true);
  }, [isEditing]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col items-start rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60"
      >
        <span className="text-sm font-semibold text-emerald-950">+ Add a note</span>
        <span className="mt-1 text-xs leading-5 text-gray-600">
          Log an observation, measurement, or photo whenever it is useful. Nothing here is on a
          schedule.
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={isEditing ? ctx.saveJournalEdit : ctx.addJournal}
      className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4"
    >
      <div>
        <p className="text-sm font-semibold text-emerald-950">
          {isEditing ? 'Edit journal note' : 'New journal note'}
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-600">
          Use this for quick observations, measurements, or photos. Plant Check-Ins are the
          periodic health form above.
        </p>
        <button
          type="button"
          onClick={() => (isEditing ? ctx.setEditingJournalId(null) : setOpen(false))}
          className="mt-1 text-xs font-semibold text-emerald-700 hover:underline"
        >
          {isEditing ? 'Cancel edit' : 'Close'}
        </button>
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
          Log numbers on their own or with notes and photos. Trends appear in the sidebar.
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

      <label className="block rounded-2xl border border-emerald-100 bg-white/70 p-3">
        <span className="text-sm font-semibold text-emerald-950">Optional journal photo</span>
        <span className="mt-1 block text-xs leading-5 text-gray-600">
          Optional. Try to match angle and distance over time so comparisons are easier.
        </span>
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
              className="max-h-48 w-full rounded-2xl border border-emerald-100 object-cover"
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
          .join(' -> ')
      : null;

  return (
    <div className="space-y-4">
      <GrowthMeasurementsPanel points={measurementPoints} />

      {photoEntries.length >= 2 ? (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-emerald-950">Compare growth photos</p>
              <p className="mt-1 text-xs leading-5 text-gray-600">
                Pick two journal photos to inspect shape, color, leaf count, and recovery signs.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const latest = pickLatestPhotoCompareIds(photoEntries);
                  if (latest) {
                    onBeforeChange(latest.beforeId);
                    onAfterChange(latest.afterId);
                  }
                }}
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
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
                className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Oldest to newest
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-gray-600">
              Earlier photo
              <select
                className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
                value={compareBeforeId}
                onChange={(e) => onBeforeChange(e.target.value)}
              >
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
      ) : (
        <SectionEmptyState
          title="Photo comparison not ready"
          body={
            photoEntries.length === 1
              ? 'Add one more optional journal photo to compare visual changes over time.'
              : 'Add two optional journal photos to unlock side-by-side and slider comparison.'
          }
        />
      )}

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
          body="Add a journal note, save a Plant Check-In, or complete a care task to start building this plant's care history."
        />
      )}
    </div>
  );
}

const OVERALL_HEALTH_OPTIONS = [
  { value: 'THRIVING', label: 'Thriving' },
  { value: 'STABLE', label: 'Stable' },
  { value: 'CONCERNED', label: 'Some concerns' },
  { value: 'DECLINING', label: 'Declining' },
];

const GROWTH_CHANGE_OPTIONS = [
  { value: 'NEW_GROWTH', label: 'New growth' },
  { value: 'SAME', label: 'About the same' },
  { value: 'LEAF_LOSS', label: 'Leaf loss' },
  { value: 'STRETCHING', label: 'Stretching or legginess' },
  { value: 'FLOWERING', label: 'Flowering' },
  { value: 'NOT_SURE', label: 'Not sure' },
];

const LEAF_CONDITION_OPTIONS = [
  { value: 'HEALTHY', label: 'Healthy leaves' },
  { value: 'YELLOWING', label: 'Yellowing' },
  { value: 'BROWN_TIPS', label: 'Brown tips' },
  { value: 'SPOTS', label: 'Spots' },
  { value: 'DROOPING', label: 'Drooping' },
  { value: 'WILTING', label: 'Wilting' },
  { value: 'PEST_DAMAGE', label: 'Pest damage' },
  { value: 'NOT_SURE', label: 'Not sure' },
];

const SOIL_MOISTURE_OPTIONS = [
  { value: 'DRY', label: 'Dry' },
  { value: 'SLIGHTLY_DRY', label: 'Slightly dry' },
  { value: 'MOIST', label: 'Moist' },
  { value: 'WET', label: 'Wet' },
  { value: 'NOT_CHECKED', label: 'Not checked' },
];

const PEST_SIGNS_OPTIONS = [
  { value: 'NONE', label: 'No pest signs' },
  { value: 'POSSIBLE', label: 'Possible signs' },
  { value: 'VISIBLE_PESTS', label: 'Visible pests' },
  { value: 'WEBBING', label: 'Webbing' },
  { value: 'STICKY_RESIDUE', label: 'Sticky residue' },
  { value: 'NOT_CHECKED', label: 'Not checked' },
];

const RECENT_CARE_OPTIONS = [
  { value: 'WATERED', label: 'Watered' },
  { value: 'FERTILIZED', label: 'Fertilized' },
  { value: 'REPOTTED', label: 'Repotted' },
  { value: 'PRUNED', label: 'Pruned' },
  { value: 'MOVED_LIGHT', label: 'Moved light' },
  { value: 'PEST_TREATED', label: 'Pest treated' },
  { value: 'NO_CHANGE', label: 'No change' },
  { value: 'MULTIPLE', label: 'Multiple changes' },
];

const PROGRESS_VALUE_LABELS = new Map(
  [
    ...OVERALL_HEALTH_OPTIONS,
    ...GROWTH_CHANGE_OPTIONS,
    ...LEAF_CONDITION_OPTIONS,
    ...SOIL_MOISTURE_OPTIONS,
    ...PEST_SIGNS_OPTIONS,
    ...RECENT_CARE_OPTIONS,
  ].map((item) => [item.value, item.label]),
);

function progressHealthLabel(value?: string) {
  return value ? PROGRESS_VALUE_LABELS.get(value) || value : 'Plant Check-In';
}

function summarizeProgressEntry(entry: PlantRecord) {
  const parts = [
    entry.growthChange ? PROGRESS_VALUE_LABELS.get(entry.growthChange as string) : null,
    entry.leafCondition ? PROGRESS_VALUE_LABELS.get(entry.leafCondition as string) : null,
    entry.soilMoisture ? `${PROGRESS_VALUE_LABELS.get(entry.soilMoisture as string)} soil` : null,
    entry.pestSigns ? PROGRESS_VALUE_LABELS.get(entry.pestSigns as string) : null,
  ].filter(Boolean);
  if (parts.length) return parts.join(' - ');
  if (entry.notes) return String(entry.notes).slice(0, 90);
  return 'Check-in saved';
}

function parseProgressStory(value: unknown): {
  trend?: 'improving' | 'stable' | 'watch' | 'declining';
  source?: 'openai' | 'rules';
  flags: string[];
} {
  if (typeof value !== 'string' || !value.trim()) return { flags: [] };
  try {
    const parsed = JSON.parse(value) as {
      trend?: string;
      source?: string;
      flags?: unknown;
    };
    const trend = ['improving', 'stable', 'watch', 'declining'].includes(parsed.trend || '')
      ? (parsed.trend as 'improving' | 'stable' | 'watch' | 'declining')
      : undefined;
    const flags = Array.isArray(parsed.flags)
      ? parsed.flags.filter((flag): flag is string => typeof flag === 'string').slice(0, 4)
      : [];
    const source =
      parsed.source === 'openai' || parsed.source === 'rules'
        ? parsed.source
        : undefined;
    return { trend, source, flags };
  } catch {
    return { flags: [] };
  }
}

function trendLabel(trend: string) {
  return (
    {
      improving: 'Improving',
      stable: 'Stable',
      watch: 'Watch',
      declining: 'Declining',
    }[trend] || 'Trend'
  );
}

function trendClass(trend: string) {
  if (trend === 'improving') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100';
  if (trend === 'declining') return 'bg-rose-50 text-rose-800 ring-1 ring-rose-100';
  if (trend === 'watch') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-100';
  return 'bg-lime-50 text-lime-900 ring-1 ring-lime-100';
}

function healthScore(value?: string) {
  return (
    {
      THRIVING: 100,
      STABLE: 72,
      CONCERNED: 44,
      DECLINING: 22,
    }[value || ''] || 50
  );
}

function healthBarClass(value?: string) {
  if (value === 'THRIVING') return 'bg-emerald-500';
  if (value === 'STABLE') return 'bg-lime-500';
  if (value === 'CONCERNED') return 'bg-amber-400';
  if (value === 'DECLINING') return 'bg-rose-400';
  return 'bg-gray-300';
}

function progressBadges(entries: PlantRecord[]) {
  const badges: string[] = [];
  if (entries.length >= 1) badges.push('Baseline saved');
  if (entries.length >= 3) badges.push('Three check-ins');
  if (entries.some((entry) => entry.photoUrl)) badges.push('Photo record');
  if (entries.some((entry) => entry.growthChange === 'NEW_GROWTH')) badges.push('New growth noted');
  if (
    entries.length >= 3 &&
    entries.slice(0, 3).every((entry) => ['THRIVING', 'STABLE'].includes(entry.overallHealth as string))
  ) {
    badges.push('Stable streak');
  }
  if (hasRecoveryMoment(entries)) badges.push('Recovery signal');
  return badges.slice(0, 6);
}

function hasRecoveryMoment(entries: PlantRecord[]) {
  const ordered = [...entries].sort(
    (a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime(),
  );
  return ordered.some((entry, index) => {
    if (index === 0) return false;
    const previous = ordered[index - 1];
    return (
      ['CONCERNED', 'DECLINING'].includes(previous.overallHealth as string) &&
      ['STABLE', 'THRIVING'].includes(entry.overallHealth as string)
    );
  });
}

function plantLifeMilestonesForPlant(milestones: PlantRecord[] = [], plantId: string) {
  const prefix = `plant_life:${plantId}:`;
  return milestones
    .filter((milestone) => String(milestone.milestoneKey || '').startsWith(prefix))
    .sort(
      (a, b) =>
        new Date(b.unlockedAt as string).getTime() - new Date(a.unlockedAt as string).getTime(),
    );
}

function pickLatestEntry(entries: PlantRecord[]): PlantRecord | null {
  if (!entries.length) return null;
  return [...entries].sort(
    (a, b) =>
      new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime(),
  )[0];
}

function summarizeLatestEntry(entry: PlantRecord) {
  const measurements = measurementSummaryForEntry(entry);
  const notes = typeof entry.notes === 'string' ? entry.notes.trim() : '';
  if (measurements) return measurements;
  if (notes) return notes.length > 72 ? `${notes.slice(0, 72)}...` : notes;
  if (entry.photoUrl) return 'Photo update';
  return 'Journal update';
}

function formatJournalOption(entry: PlantRecord) {
  const date = format(new Date(entry.createdAt as string), 'MMM d, yyyy');
  const measurements = measurementSummaryForEntry(entry);
  const note = ((entry.notes as string) || (measurements ? 'Measurements' : 'Photo')).slice(0, 32);
  return measurements ? `${date} - ${measurements}` : `${date} - ${note}`;
}
