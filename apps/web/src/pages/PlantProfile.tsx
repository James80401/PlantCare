import { FormEvent, useEffect, useState } from 'react';
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

export default function PlantProfile() {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<Record<string, unknown> | null>(null);
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
    if (plant?.location) {
      setLocationDraft(plant.location as string);
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
    if (!id) return;
    await journalApi.create(id, journalNotes);
    setJournalNotes('');
    load();
  };

  if (!plant || !id) return <p className="text-gray-500">Loading…</p>;

  const species = plant.species as Record<string, unknown>;
  const tasks = (plant.tasks as Record<string, unknown>[]) || [];
  const journal = (plant.journalEntries as Record<string, unknown>[]) || [];
  const diagnoses = (plant.diagnoses as Record<string, unknown>[]) || [];
  const pending = tasks.filter((t) => t.status === 'PENDING');
  const careOverview = plant.careOverview as CareOverview | undefined;
  const currentLocation = (plant.location as string) || PLANT_LOCATIONS[0];
  const locationOptions = (PLANT_LOCATIONS as readonly string[]).includes(currentLocation)
    ? PLANT_LOCATIONS
    : ([...PLANT_LOCATIONS, currentLocation] as const);

  return (
    <div className="space-y-6 pb-20">
      <Link to="/garden" className="text-emerald-700 text-sm hover:underline">
        ← Back to garden
      </Link>

      <div className="bg-white rounded-xl border border-emerald-100 p-6 flex flex-col sm:flex-row gap-6">
        <div className="w-32 h-32 rounded-xl bg-emerald-100 flex-shrink-0 overflow-hidden">
          {(plant.imageUrl as string) ? (
            <img src={plant.imageUrl as string} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center h-full text-4xl">🌿</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 font-display">
            {(plant.nickname as string) || (species.commonName as string)}
          </h1>
          <p className="text-gray-500">{species.commonName as string}</p>
          <div className="text-sm mt-2 space-y-2">
            {editingLocation ? (
              <div className="space-y-2 max-w-xs">
                <label className="block font-medium text-gray-700">Where it grows</label>
                <select
                  value={locationDraft}
                  onChange={(e) => setLocationDraft(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  disabled={locationSaving}
                >
                  {locationOptions.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveLocation}
                    disabled={locationSaving || locationDraft === currentLocation}
                    className="text-sm bg-emerald-700 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    {locationSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationDraft(currentLocation);
                      setEditingLocation(false);
                      setLocationMessage('');
                    }}
                    disabled={locationSaving}
                    className="text-sm text-gray-600 px-3 py-1"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Saving a new location refreshes upcoming tasks (e.g. outdoor plants won’t get mist reminders).
                </p>
              </div>
            ) : (
              <p>
                📍 {plant.location as string}
                {careOverview?.environmentLabel ? (
                  <span className="text-gray-500"> · {careOverview.environmentLabel}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setEditingLocation(true)}
                  className="ml-2 text-emerald-700 hover:underline text-xs font-medium"
                >
                  Change
                </button>
              </p>
            )}
            {locationMessage ? (
              <p className="text-xs text-emerald-700">{locationMessage}</p>
            ) : null}
          </div>
          <div className="mt-3 text-sm space-y-1 text-gray-700">
            <p>☀️ {species.sunlight as string}</p>
            <p>💧 Water every {species.wateringFreqDays as number} days (base)</p>
            {species.toxicity ? <p>⚠️ {String(species.toxicity)}</p> : null}
          </div>
        </div>
      </div>

      {careOverview?.sections?.length ? (
        <section className="bg-white rounded-xl border border-emerald-100 p-6 space-y-5">
          <h2 className="font-semibold text-emerald-800 text-lg">Care guide</h2>
          {careOverview.sections.map((section) => (
            <article key={section.heading}>
              <h3 className="font-medium text-emerald-900 mb-2">{section.heading}</h3>
              <div
                className="text-sm text-gray-700 prose prose-sm max-w-none prose-p:my-2"
                dangerouslySetInnerHTML={{ __html: formatGuideBody(section.body) }}
              />
            </article>
          ))}
        </section>
      ) : null}

      <DrPlantChat plantId={id} />

      {diagnoses.length > 0 && (
        <section>
          <h2 className="font-semibold text-emerald-800 mb-2">Past diagnoses</h2>
          <ul className="space-y-3">
            {diagnoses.map((d) => (
              <li key={d.id as string}>
                <DiagnosisResult
                  diagnosis={{
                    resultLabel: d.resultLabel as string,
                    confidence: d.confidence as number | null,
                    adviceText: d.adviceText as string | null,
                    source: d.source as string | undefined,
                    detailJson: d.detailJson as string | null,
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-emerald-800 mb-2">Care tasks</h2>
        <ul className="space-y-2">
          {pending.slice(0, 10).map((t) => {
            const plantLabel =
              (plant.nickname as string) || (species.commonName as string);
            return (
              <li
                key={t.id as string}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-white border rounded-lg p-3"
              >
                <div>
                  <span className="font-medium">{taskTypeLabel(t.taskType as string)}</span>
                  <span className="text-gray-500 text-sm">
                    {' '}
                    — {format(new Date(t.dueDate as string), 'MMM d')}
                  </span>
                  <div className="mt-1">
                    <TaskInstructionsLink
                      taskId={t.id as string}
                      taskType={t.taskType as string}
                      plantLabel={plantLabel}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => completeTask(t.id as string)}
                  className="text-sm bg-emerald-700 text-white px-3 py-1 rounded self-start sm:self-center"
                >
                  Done
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-emerald-800 mb-2">Journal</h2>
        <form onSubmit={addJournal} className="flex gap-2 mb-3">
          <input
            value={journalNotes}
            onChange={(e) => setJournalNotes(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button type="submit" className="bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm">
            Save
          </button>
        </form>
        <ul className="space-y-2 text-sm">
          {journal.map((j) => (
            <li key={j.id as string} className="bg-white border rounded-lg p-3">
              <p className="text-gray-400 text-xs">{format(new Date(j.createdAt as string), 'PPp')}</p>
              <p>{j.notes as string}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
