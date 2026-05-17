import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import DrPlantChat from '../components/DrPlantChat';
import DiagnosisResult from '../components/DiagnosisResult';
import TaskInstructionsLink from '../components/TaskInstructionsLink';
import { PLANT_LOCATIONS } from '../constants/plantLocations';
import { plantsApi, journalApi, tasksApi } from '../services/api';
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

const profileSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'care', label: 'Care' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'journal', label: 'Journal' },
  { id: 'diagnosis', label: 'Diagnosis' },
];

export default function PlantProfile() {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [journalNotes, setJournalNotes] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

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
    if (!id || !journalNotes.trim()) return;
    await journalApi.create(id, journalNotes.trim());
    setJournalNotes('');
    load();
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
  const sectionCounts = {
    tasks: pending.length,
    journal: journalEntries.length,
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
          </div>
        </div>
      </section>

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
              <article
                key={section.heading}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4"
              >
                <h3 className="font-semibold text-emerald-950">{section.heading}</h3>
                <div
                  className="mt-2 text-sm leading-6 text-gray-700 prose prose-sm max-w-none prose-p:my-2"
                  dangerouslySetInnerHTML={{ __html: formatGuideBody(section.body) }}
                />
              </article>
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
        description="Capture photos, observations, and care notes so future advice has better context."
      >
        <form onSubmit={addJournal} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={journalNotes}
            onChange={(e) => setJournalNotes(e.target.value)}
            placeholder="Add a note about growth, soil, pests, or symptoms…"
            className="min-h-11 flex-1 rounded-2xl border border-emerald-100 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-800 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Save note
          </button>
        </form>

        {journalEntries.length ? (
          <ul className="mt-4 space-y-3 text-sm">
            {journalEntries.map((entry) => (
              <li key={entry.id as string} className="rounded-2xl border border-emerald-100 bg-white p-4">
                <p className="text-xs font-medium text-gray-400">
                  {format(new Date(entry.createdAt as string), 'PPp')}
                </p>
                <p className="mt-1 text-gray-700">{entry.notes as string}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <SectionEmptyState
              title="No journal notes yet"
              body="Add a first observation after watering, repotting, or spotting new growth."
            />
          </div>
        )}
      </ProfileSection>

      <ProfileSection
        id="diagnosis"
        eyebrow="Plant health"
        title="Diagnosis"
        description="Ask Dr. Plant about symptoms and review past diagnosis results."
      >
        <div className="space-y-5">
          <DrPlantChat plantId={id} />

          {diagnosisEntries.length ? (
            <div>
              <h3 className="font-semibold text-emerald-950">Past diagnoses</h3>
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
                      }}
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
