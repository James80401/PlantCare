import { format } from 'date-fns';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import {
  careSectionToneClasses,
  getCareSectionMeta,
  sectionLead,
} from '../../utils/careGuideSections';
import { formatGuideBody, taskTypeLabel } from '../../utils/tasks';
import type { CareOverviewSection, PlantRecord, TimelineEvent } from './types';

export function ProfileSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6">
      <motionHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
    </section>
  );
}

function motionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-semibold text-emerald-950 font-display">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">{description}</p>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

export function SectionEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center">
      <p className="font-semibold text-emerald-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{body}</p>
    </div>
  );
}

export function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'emerald' | 'amber' | 'sky';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-950',
    amber: 'bg-amber-50 text-amber-950',
    sky: 'bg-sky-50 text-sky-950',
  };

  return (
    <div className={`rounded-2xl px-3 py-3 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5">{value}</p>
    </div>
  );
}

export function CareGuideCard({ section }: { section: CareOverviewSection }) {
  const meta = getCareSectionMeta(section.heading);
  const toneClasses = careSectionToneClasses(meta.tone);
  const lead = sectionLead(section);

  return (
    <article className={`rounded-2xl border p-4 ${toneClasses.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses.badge}`}>
            {meta.label}
          </span>
          <h3 className="mt-3 font-semibold text-emerald-950">{section.heading}</h3>
        </div>
      </div>
      {lead ? (
        <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-sm font-medium leading-6 text-gray-700">
          {lead}
        </p>
      ) : null}
      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {meta.intent}
      </p>
      <div
        className="mt-3 text-sm leading-6 text-gray-700 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2"
        dangerouslySetInnerHTML={{ __html: formatGuideBody(section.body) }}
      />
    </article>
  );
}

export function PlantTimeline({
  events,
  onEditJournal,
  onDeleteJournal,
  busyJournalId,
}: {
  events: TimelineEvent[];
  onEditJournal?: (journalId: string) => void;
  onDeleteJournal?: (journalId: string) => void;
  busyJournalId?: string | null;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-emerald-950">Plant timeline</h3>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          {events.length} event{events.length === 1 ? '' : 's'}
        </span>
      </div>
      <ol className="relative space-y-4 border-l border-emerald-100 pl-4">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span
              className={`absolute -left-[1.55rem] top-4 flex h-5 w-5 items-center justify-center rounded-full text-xs ${timelineDotClass(event.type)}`}
              aria-hidden
            >
              {timelineIcon(event.type)}
            </span>
            <article className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {timelineTypeLabel(event.type)}
                  </p>
                  <h4 className="mt-1 font-semibold text-emerald-950">{event.title}</h4>
                </div>
                <time className="text-xs font-medium text-gray-400" dateTime={event.date.toISOString()}>
                  {format(event.date, 'MMM d, h:mm a')}
                </time>
              </div>
              {event.meta ? <p className="mt-1 text-xs text-gray-500">{event.meta}</p> : null}
              {event.description ? (
                <p className="mt-2 text-sm leading-6 text-gray-700">{event.description}</p>
              ) : null}
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt=""
                  className="mt-3 max-h-64 w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              ) : null}
              {event.journalId && (onEditJournal || onDeleteJournal) ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {onEditJournal ? (
                    <button
                      type="button"
                      onClick={() => onEditJournal(event.journalId!)}
                      disabled={busyJournalId === event.journalId}
                      className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Edit
                    </button>
                  ) : null}
                  {onDeleteJournal ? (
                    <button
                      type="button"
                      onClick={() => onDeleteJournal(event.journalId!)}
                      disabled={busyJournalId === event.journalId}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-100 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {busyJournalId === event.journalId ? 'Deleting…' : 'Delete'}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RecoveryPanel({
  activeCount,
  onLogRecovery,
}: {
  activeCount: number;
  onLogRecovery: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
            Recovery workflow
          </p>
          <h3 className="mt-1 font-semibold text-amber-950">
            {activeCount
              ? `${activeCount} active diagnosis${activeCount === 1 ? '' : 'es'} needs follow-up`
              : 'No active diagnosis issues'}
          </h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-700">
            Recheck symptoms after care changes, schedule a health-check reminder, and mark the
            issue recovered when the plant is stable.
          </p>
        </div>
        <button
          type="button"
          onClick={onLogRecovery}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-100 hover:bg-amber-100"
        >
          Log recovery note
        </button>
      </div>
    </div>
  );
}

export function buildTimelineEvents({
  journalEntries,
  tasks,
  diagnoses,
}: {
  journalEntries: PlantRecord[];
  tasks: PlantRecord[];
  diagnoses: PlantRecord[];
}): TimelineEvent[] {
  const journalEvents: TimelineEvent[] = journalEntries.map((entry) => {
    const parts: string[] = [];
    if (entry.heightCm != null) parts.push(`Height ${entry.heightCm} cm`);
    if (entry.widthCm != null) parts.push(`Width ${entry.widthCm} cm`);
    if (entry.leafCount != null) parts.push(`${entry.leafCount} leaves`);
    const measurementMeta = parts.length ? parts.join(' · ') : undefined;

    return {
      id: `journal-${entry.id as string}`,
      journalId: entry.id as string,
      date: new Date(entry.createdAt as string),
      type: 'journal' as const,
      title: entry.photoUrl ? 'Photo journal entry' : 'Journal note',
      description: (entry.notes as string | null) || 'Photo update',
      meta: measurementMeta,
      imageUrl: entry.photoUrl as string | null,
    };
  });

  const taskEvents: TimelineEvent[] = tasks
    .filter((task) => task.status !== 'PENDING' && task.completedAt)
    .map((task) => ({
      id: `task-${task.id as string}`,
      date: new Date(task.completedAt as string),
      type: 'care' as const,
      title: `${taskTypeLabel(task.taskType as string)} ${
        task.status === 'DONE' ? 'completed' : 'skipped'
      }`,
      description:
        task.status === 'SKIPPED'
          ? 'This care task was skipped. Feedback can help future scheduling improve.'
          : 'This care task was marked complete.',
      meta: `Originally due ${format(new Date(task.dueDate as string), 'MMM d')}`,
    }));

  const diagnosisEvents: TimelineEvent[] = diagnoses.map((diagnosis) => ({
    id: `diagnosis-${diagnosis.id as string}`,
    date: new Date(diagnosis.createdAt as string),
    type: 'diagnosis' as const,
    title: (diagnosis.resultLabel as string) || 'Diagnosis result',
    description: (diagnosis.adviceText as string | null) || 'Diagnosis saved for this plant.',
    meta:
      typeof diagnosis.confidence === 'number'
        ? `${Math.round((diagnosis.confidence as number) * 100)}% confidence`
        : undefined,
    imageUrl: diagnosis.imageUrl as string | null,
  }));

  return [...journalEvents, ...taskEvents, ...diagnosisEvents].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );
}

export function appendJournalPrompt(
  prompt: string,
  setJournalNotes: Dispatch<SetStateAction<string>>,
) {
  setJournalNotes((current) => {
    const prefix = current.trim() ? `${current.trim()}\n` : '';
    return `${prefix}${prompt} `;
  });
}

function timelineTypeLabel(type: TimelineEvent['type']) {
  if (type === 'care') return 'Care action';
  if (type === 'diagnosis') return 'Diagnosis';
  return 'Journal';
}

function timelineIcon(type: TimelineEvent['type']) {
  if (type === 'care') return '✓';
  if (type === 'diagnosis') return '!';
  return '•';
}

function timelineDotClass(type: TimelineEvent['type']) {
  if (type === 'care') return 'bg-emerald-700 text-white';
  if (type === 'diagnosis') return 'bg-amber-500 text-white';
  return 'bg-sky-600 text-white';
}

export function LocationEditor({
  editingLocation,
  currentLocation,
  locationDraft,
  locationOptions,
  locationSaving,
  locationMessage,
  environmentLabel,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
}: {
  editingLocation: boolean;
  currentLocation: string;
  locationDraft: string;
  locationOptions: readonly string[];
  locationSaving: boolean;
  locationMessage: string;
  environmentLabel?: string;
  onDraftChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Growing spot</p>
      {editingLocation ? (
        <div className="mt-3 space-y-3">
          <label className="block text-sm font-medium text-gray-700" htmlFor="plant-location">
            Where it grows
          </label>
          <select
            id="plant-location"
            value={locationDraft}
            onChange={(e) => onDraftChange(e.target.value)}
            className="w-full rounded-xl border border-emerald-100 px-3 py-2 text-sm"
            disabled={locationSaving}
          >
            {locationOptions.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={locationSaving || locationDraft === currentLocation}
              className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {locationSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={locationSaving}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs leading-5 text-gray-500">
            Saving a new location refreshes upcoming tasks for this growing spot.
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-lg font-semibold text-emerald-950">{currentLocation}</p>
          {environmentLabel ? <p className="text-sm text-gray-500">{environmentLabel}</p> : null}
          <button
            type="button"
            onClick={onEdit}
            className="mt-3 rounded-full bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Change location
          </button>
        </div>
      )}
      {locationMessage ? <p className="mt-3 text-sm text-emerald-700">{locationMessage}</p> : null}
    </div>
  );
}
