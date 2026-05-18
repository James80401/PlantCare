import {
  FormEvent,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { SharePlantCard } from '../components/engagement/SharePlantCard';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import DrPlantChat from '../components/DrPlantChat';
import DiagnosisResult from '../components/DiagnosisResult';
import TaskInstructionsLink from '../components/TaskInstructionsLink';
import { PLANT_LOCATIONS } from '../constants/plantLocations';
import { plantsApi, journalApi, tasksApi, diagnosisApi } from '../services/api';
import {
  careSectionToneClasses,
  getCareSectionMeta,
  sectionLead,
} from '../utils/careGuideSections';
import { formatGuideBody, taskTypeLabel } from '../utils/tasks';

interface CareOverviewSection {
  heading: string;
  body: string;
}

interface CareOverview {
  growingEnvironment: string;
  environmentLabel: string;
  sections: CareOverviewSection[];
}

type PlantRecord = Record<string, unknown>;

interface TimelineEvent {
  id: string;
  date: Date;
  type: 'journal' | 'care' | 'diagnosis';
  title: string;
  description: string;
  meta?: string;
  imageUrl?: string | null;
}

const profileSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'care', label: 'Care' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'journal', label: 'Journal' },
  { id: 'diagnosis', label: 'Diagnosis' },
];

const journalPrompts = [
  'New growth:',
  'Height:',
  'Leaf count:',
  'Soil check:',
  'Pest check:',
  'After care:',
];

export default function PlantProfile() {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [journalNotes, setJournalNotes] = useState('');
  const [journalPhoto, setJournalPhoto] = useState<File | null>(null);
  const [journalPhotoInputKey, setJournalPhotoInputKey] = useState(0);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [updatingDiagnosisId, setUpdatingDiagnosisId] = useState<string | null>(null);
  const [sharingPlant, setSharingPlant] = useState(false);

  const load = () => {
    if (id) plantsApi.get(id).then((r) => setPlant(r.data));
  };

  useEffect(load, [id]);

  useEffect(() => {
    if (plant) {
      setLocationDraft((plant.location as string) || PLANT_LOCATIONS[0]);
    }
  }, [plant?.location]);

  const saveLocation = async () => {
    if (!id) return;
    setLocationSaving(true);
    setLocationMessage('');
    try {
      const { data } = await plantsApi.update(id, { location: locationDraft });
      setPlant(data);
      setEditingLocation(false);
      if (data.tasksRescheduled) {
        setLocationMessage('Location saved. Upcoming care tasks were updated for this spot.');
      } else {
        setLocationMessage('Location saved.');
      }
    } catch {
      setLocationMessage('Could not save location. Try again.');
    } finally {
      setLocationSaving(false);
    }
  };

  const completeTask = async (taskId: string) => {
    await tasksApi.complete(taskId);
    load();
  };

  const addJournal = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || (!journalNotes.trim() && !journalPhoto)) return;
    await journalApi.create(id, journalNotes.trim(), journalPhoto ?? undefined);
    setJournalNotes('');
    setJournalPhoto(null);
    setJournalPhotoInputKey((key) => key + 1);
    load();
  };

  const updateDiagnosisStatus = async (diagnosisId: string, resolved: boolean) => {
    if (!id) return;
    setUpdatingDiagnosisId(diagnosisId);
    try {
      const { data } = await diagnosisApi.updateStatus(id, diagnosisId, resolved);
      setPlant((current) => {
        if (!current) return current;
        const currentDiagnoses = (current.diagnoses as PlantRecord[] | undefined) || [];
        return {
          ...current,
          diagnoses: currentDiagnoses.map((diagnosis) =>
            diagnosis.id === diagnosisId ? { ...diagnosis, ...data } : diagnosis,
          ),
        };
      });
    } finally {
      setUpdatingDiagnosisId(null);
    }
  };

  if (!plant || !id) return <p className="text-gray-500">Loading…</p>;

  const species = plant.species as PlantRecord;
  const tasks = ((plant.tasks as PlantRecord[]) || []).sort(
    (a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime(),
  );
  const journal = plant.journalEntries as PlantRecord[] | undefined;
  const diagnoses = plant.diagnoses as PlantRecord[] | undefined;
  const pending = tasks.filter((t) => t.status === 'PENDING');
  const completed = tasks.filter((t) => t.status === 'DONE');
  const nextTask = pending[0];
  const latestCompleted = completed
    .filter((t) => t.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt as string).getTime() - new Date(a.completedAt as string).getTime(),
    )[0];
  const careOverview = plant.careOverview as CareOverview | undefined;
  const currentLocation = (plant.location as string) || PLANT_LOCATIONS[0];
  const locationOptions = (PLANT_LOCATIONS as readonly string[]).includes(currentLocation)
    ? PLANT_LOCATIONS
    : ([...PLANT_LOCATIONS, currentLocation] as const);
  const plantLabel = (plant.nickname as string) || (species.commonName as string);
  const journalEntries = journal || [];
  const diagnosisEntries = diagnoses || [];
  const activeDiagnosisCount = diagnosisEntries.filter((diagnosis) => !diagnosis.resolved).length;
  const timelineEvents = buildTimelineEvents({
    journalEntries,
    tasks,
    diagnoses: diagnosisEntries,
  });
  const sectionCounts = {
    tasks: pending.length,
    journal: timelineEvents.length,
    diagnosis: diagnosisEntries.length,
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      <Link
        to="/garden"
        className="inline-flex rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
      >
        ← Back to garden
      </Link>

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm shadow-emerald-900/5">
        <div className="grid gap-5 p-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-6">
          <div className="h-36 w-full overflow-hidden rounded-3xl bg-emerald-100 sm:h-36 sm:w-36">
            {(plant.imageUrl as string) ? (
              <img src={plant.imageUrl as string} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-5xl" aria-hidden>
                🌿
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Plant profile
            </p>
            <h1 className="mt-1 text-3xl font-bold text-emerald-950 font-display">
              {plantLabel}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {species.commonName as string}
              {species.scientificName ? (
                <span className="italic"> · {species.scientificName as string}</span>
              ) : null}
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryTile
                label="Next task"
                value={
                  nextTask
                    ? `${taskTypeLabel(nextTask.taskType as string)} · ${format(new Date(nextTask.dueDate as string), 'MMM d')}`
                    : 'Nothing scheduled'
                }
                tone={nextTask ? 'amber' : 'emerald'}
              />
              <SummaryTile
                label="Location"
                value={
                  careOverview?.environmentLabel
                    ? `${currentLocation} · ${careOverview.environmentLabel}`
                    : currentLocation
                }
                tone="emerald"
              />
              <SummaryTile
                label="Watering"
                value={`Every ${species.wateringFreqDays as number} days base`}
                tone="sky"
              />
              <SummaryTile
                label="Light"
                value={(species.sunlight as string) || 'Not specified'}
                tone="emerald"
              />
            </div>

            {species.toxicity ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                ⚠️ {String(species.toxicity)}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => setSharingPlant(true)}
              className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
            >
              Share plant card
            </button>
          </div>
        </div>
      </section>

      {sharingPlant ? (
        <SharePlantCard
          snapshot={{
            plantName: plantLabel,
            speciesName: species.commonName as string,
            scientificName: (species.scientificName as string) || null,
            location: currentLocation,
            sunlight: (species.sunlight as string) || null,
            nextCareLabel: nextTask
              ? `${taskTypeLabel(nextTask.taskType as string)} · ${format(new Date(nextTask.dueDate as string), 'MMM d')}`
              : null,
          }}
          onClose={() => setSharingPlant(false)}
        />
      ) : null}

      <nav
        className="sticky top-[4.5rem] z-20 overflow-x-auto rounded-2xl border border-emerald-100 bg-white/95 p-1 shadow-sm shadow-emerald-900/5 backdrop-blur"
        aria-label="Plant profile sections"
      >
        <div className="flex min-w-max gap-1">
          {profileSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {section.label}
              {section.id === 'tasks' && sectionCounts.tasks ? ` (${sectionCounts.tasks})` : ''}
              {section.id === 'journal' && sectionCounts.journal ? ` (${sectionCounts.journal})` : ''}
              {section.id === 'diagnosis' && sectionCounts.diagnosis
                ? ` (${sectionCounts.diagnosis})`
                : ''}
            </a>
          ))}
        </div>
      </nav>

      <ProfileSection
        id="overview"
        eyebrow="Snapshot"
        title="Overview"
        description="The key growing context and recent care signals for this plant."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          <div className="space-y-4">
            <InfoRow label="Common name" value={species.commonName as string} />
            {species.scientificName ? (
              <InfoRow label="Scientific name" value={species.scientificName as string} />
            ) : null}
            <InfoRow label="Sunlight" value={(species.sunlight as string) || 'Not specified yet'} />
            <InfoRow
              label="Base watering cadence"
              value={`Every ${species.wateringFreqDays as number} days before environment adjustments`}
            />
            {latestCompleted ? (
              <InfoRow
                label="Last completed care"
                value={`${taskTypeLabel(latestCompleted.taskType as string)} · ${format(new Date(latestCompleted.completedAt as string), 'PPp')}`}
              />
            ) : (
              <InfoRow label="Last completed care" value="No completed care logged yet" />
            )}
          </div>

          <LocationEditor
            editingLocation={editingLocation}
            currentLocation={currentLocation}
            locationDraft={locationDraft}
            locationOptions={locationOptions}
            locationSaving={locationSaving}
            locationMessage={locationMessage}
            environmentLabel={careOverview?.environmentLabel}
            onDraftChange={setLocationDraft}
            onEdit={() => setEditingLocation(true)}
            onSave={saveLocation}
            onCancel={() => {
              setLocationDraft(currentLocation);
              setEditingLocation(false);
              setLocationMessage('');
            }}
          />
        </div>
      </ProfileSection>

      <ProfileSection
        id="care"
        eyebrow="Guide"
        title="Care"
        description="Care guidance tailored by species and growing environment when data is available."
      >
        {careOverview?.sections?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {careOverview.sections.map((section) => (
              <CareGuideCard key={section.heading} section={section} />
            ))}
          </div>
        ) : (
          <SectionEmptyState
            title="No care guide yet"
            body="Care guidance will appear here when a guide is available for this species."
          />
        )}
      </ProfileSection>

      <ProfileSection
        id="tasks"
        eyebrow="Schedule"
        title="Tasks"
        description="Upcoming care actions for this plant. Open care steps before completing unfamiliar tasks."
      >
        {pending.length ? (
          <ul className="space-y-3">
            {pending.slice(0, 10).map((task) => (
              <li
                key={task.id as string}
                className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-emerald-950">
                      {taskTypeLabel(task.taskType as string)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Due {format(new Date(task.dueDate as string), 'EEEE, MMM d')}
                    </p>
                    <div className="mt-2">
                      <TaskInstructionsLink
                        taskId={task.id as string}
                        taskType={task.taskType as string}
                        plantLabel={plantLabel}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => completeTask(task.id as string)}
                    className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900"
                  >
                    Mark done
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <SectionEmptyState
            title="No pending tasks"
            body="This plant is caught up in the current schedule window."
          />
        )}
      </ProfileSection>

      <ProfileSection
        id="journal"
        eyebrow="History"
        title="Journal"
        description="Capture observations and review notes, care actions, photos, and diagnoses together."
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <form
              onSubmit={addJournal}
              className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4"
            >
              <label className="block">
                <span className="text-sm font-semibold text-emerald-950">New observation</span>
                <textarea
                  value={journalNotes}
                  onChange={(e) => setJournalNotes(e.target.value)}
                  placeholder="Add a note about growth, soil, pests, symptoms, or what changed after care..."
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Helpful prompts
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {journalPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => appendJournalPrompt(prompt, setJournalNotes)}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-emerald-950">Progress photo</span>
                <input
                  key={journalPhotoInputKey}
                  type="file"
                  accept="image/*"
                  onChange={(event) => setJournalPhoto(event.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-emerald-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </label>
              {journalPhoto ? (
                <p className="mt-2 text-xs text-gray-500">Selected: {journalPhoto.name}</p>
              ) : null}

              <button
                type="submit"
                disabled={!journalNotes.trim() && !journalPhoto}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save journal entry
              </button>
            </form>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <p className="text-sm font-semibold text-sky-950">Growth tracking groundwork</p>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                Use prompts like height and leaf count for now. A future section can turn these into
                structured measurements without losing today&apos;s notes.
              </p>
            </div>
          </div>

          {timelineEvents.length ? (
            <PlantTimeline events={timelineEvents} />
        ) : (
            <SectionEmptyState
              title="No timeline events yet"
              body="Add a note or complete a task to start building this plant's care history."
            />
          )}
        </div>
      </ProfileSection>

      <ProfileSection
        id="diagnosis"
        eyebrow="Plant health"
        title="Diagnosis"
        description="Ask Dr. Plant about symptoms and review past diagnosis results."
      >
        <div className="space-y-5">
          <RecoveryPanel
            activeCount={activeDiagnosisCount}
            onLogRecovery={() =>
              appendJournalPrompt(
                'Recovery check:',
                setJournalNotes,
              )
            }
          />

          <DrPlantChat plantId={id} plantName={plantLabel} />

          {diagnosisEntries.length ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold text-emerald-950">Past diagnoses</h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {activeDiagnosisCount} active
                </span>
              </div>
              <ul className="mt-3 space-y-3">
                {diagnosisEntries.map((diagnosis) => (
                  <li key={diagnosis.id as string}>
                    <DiagnosisResult
                      diagnosis={{
                        resultLabel: diagnosis.resultLabel as string,
                        confidence: diagnosis.confidence as number | null,
                        adviceText: diagnosis.adviceText as string | null,
                        source: diagnosis.source as string | undefined,
                        detailJson: diagnosis.detailJson as string | null,
                        resolved: Boolean(diagnosis.resolved),
                      }}
                      updating={updatingDiagnosisId === diagnosis.id}
                      onResolvedChange={(resolved) =>
                        updateDiagnosisStatus(diagnosis.id as string, resolved)
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <SectionEmptyState
              title="No diagnosis history"
              body="If this plant looks stressed, start a Dr. Plant chat and add a clear photo."
            />
          )}
        </div>
      </ProfileSection>
    </div>
  );
}

function SummaryTile({
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

function CareGuideCard({ section }: { section: CareOverviewSection }) {
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

function PlantTimeline({ events }: { events: TimelineEvent[] }) {
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
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RecoveryPanel({
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
            Recheck symptoms after care changes, add a recovery note, and mark the issue recovered
            when the plant is stable. Dedicated follow-up task creation is documented as the next
            API step.
          </p>
        </div>
        <a
          href="#journal"
          onClick={onLogRecovery}
          className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-100 hover:bg-amber-100"
        >
          Log recovery note
        </a>
      </div>
    </div>
  );
}

function buildTimelineEvents({
  journalEntries,
  tasks,
  diagnoses,
}: {
  journalEntries: PlantRecord[];
  tasks: PlantRecord[];
  diagnoses: PlantRecord[];
}): TimelineEvent[] {
  const journalEvents: TimelineEvent[] = journalEntries.map((entry) => ({
    id: `journal-${entry.id as string}`,
    date: new Date(entry.createdAt as string),
    type: 'journal',
    title: entry.photoUrl ? 'Photo journal entry' : 'Journal note',
    description: (entry.notes as string | null) || 'Photo update',
    imageUrl: entry.photoUrl as string | null,
  }));

  const taskEvents: TimelineEvent[] = tasks
    .filter((task) => task.status !== 'PENDING' && task.completedAt)
    .map((task) => ({
      id: `task-${task.id as string}`,
      date: new Date(task.completedAt as string),
      type: 'care',
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
    type: 'diagnosis',
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

function appendJournalPrompt(
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

function ProfileSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-36 rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6"
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold text-emerald-950 font-display">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function SectionEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center">
      <p className="font-semibold text-emerald-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">{body}</p>
    </div>
  );
}

function LocationEditor({
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
