import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PLANT_LOCATIONS } from '../../constants/plantLocations';
import { useTasksInRange } from '../../hooks/useTasksInRange';
import { plantsApi, journalApi, diagnosisApi } from '../../services/api';
import { Skeleton } from '../../components/ui/Skeleton';
import type { TaskCompleteFeedback, TaskSkipFeedback } from '../../utils/taskFeedback';
import { mapTimelineFromApi } from '../../utils/plantTimeline';
import { appendJournalPrompt } from './shared';
import type { CareOverview, PlantRecord, TimelineEvent } from './types';

interface PlantProfileContextValue {
  id: string;
  plant: PlantRecord;
  plantLabel: string;
  species: PlantRecord;
  tasks: PlantRecord[];
  pending: PlantRecord[];
  journalEntries: PlantRecord[];
  diagnosisEntries: PlantRecord[];
  careOverview?: CareOverview;
  currentLocation: string;
  locationOptions: readonly string[];
  locationDraft: string;
  setLocationDraft: (value: string) => void;
  editingLocation: boolean;
  setEditingLocation: (value: boolean) => void;
  locationSaving: boolean;
  locationMessage: string;
  saveLocation: () => Promise<void>;
  nextTask?: PlantRecord;
  latestCompleted?: PlantRecord;
  plantPendingFromHook: ReturnType<typeof useTasksInRange>['tasks'];
  animating: ReturnType<typeof useTasksInRange>['animating'];
  taskActionError: ReturnType<typeof useTasksInRange>['actionError'];
  handleCompleteTask: (taskId: string, feedback?: TaskCompleteFeedback) => Promise<unknown> | unknown;
  handleSkipTask: (taskId: string, feedback?: TaskSkipFeedback) => Promise<unknown> | unknown;
  handleSnooze: ReturnType<typeof useTasksInRange>['handleSnooze'];
  journalNotes: string;
  setJournalNotes: (value: string) => void;
  journalPhoto: File | null;
  setJournalPhoto: (file: File | null) => void;
  journalPhotoInputKey: number;
  journalExistingPhotoUrl: string | null;
  journalPhotoPreview: string | null;
  journalRemovePhoto: boolean;
  clearJournalPhoto: () => void;
  journalError: string;
  hasJournalContent: boolean;
  journalHeightCm: string;
  setJournalHeightCm: (value: string) => void;
  journalWidthCm: string;
  setJournalWidthCm: (value: string) => void;
  journalLeafCount: string;
  setJournalLeafCount: (value: string) => void;
  editingJournalId: string | null;
  setEditingJournalId: (id: string | null) => void;
  busyJournalId: string | null;
  journalSaving: boolean;
  addJournal: (e: FormEvent) => Promise<void>;
  saveJournalEdit: (e: FormEvent) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;
  appendJournalPrompt: (prompt: string) => void;
  timelineEvents: TimelineEvent[];
  sectionCounts: { tasks: number; journal: number; diagnosis: number };
  activeDiagnosisCount: number;
  latestUnresolved?: PlantRecord;
  diagnosisHasFollowUp: (diagnosisId: string) => boolean;
  updatingDiagnosisId: string | null;
  followUpCreatingId: string | null;
  submitDiagnosis: (
    payload: {
      symptomsText?: string;
      symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
      recentCareChange?: 'NONE' | 'WATERING' | 'LIGHT' | 'REPOT' | 'FERTILIZER' | 'TEMPERATURE' | 'PEST_TREATMENT';
      pestsVisible?: boolean;
    },
    image?: File,
  ) => Promise<void>;
  createFollowUpTask: (diagnosisId: string, dueInDays: number, note?: string) => Promise<void>;
  updateDiagnosisStatus: (diagnosisId: string, resolved: boolean) => Promise<void>;
  sharingPlant: boolean;
  setSharingPlant: (value: boolean) => void;
  load: () => void;
  goToJournalTab: () => void;
  photoCompareUrls: { before: string; after: string } | null;
  setPhotoCompareUrls: (value: { before: string; after: string } | null) => void;
}

const PlantProfileContext = createContext<PlantProfileContextValue | null>(null);

export function PlantProfileProvider({ children }: { children: ReactNode }) {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<PlantRecord | null>(null);
  const [plantLoading, setPlantLoading] = useState(true);
  const [plantError, setPlantError] = useState('');
  const [journalNotes, setJournalNotes] = useState('');
  const [journalPhoto, setJournalPhoto] = useState<File | null>(null);
  const [journalPhotoInputKey, setJournalPhotoInputKey] = useState(0);
  const [journalExistingPhotoUrl, setJournalExistingPhotoUrl] = useState<string | null>(null);
  const [journalPhotoPreview, setJournalPhotoPreview] = useState<string | null>(null);
  const [journalRemovePhoto, setJournalRemovePhoto] = useState(false);
  const [journalError, setJournalError] = useState('');
  const [journalHeightCm, setJournalHeightCm] = useState('');
  const [journalWidthCm, setJournalWidthCm] = useState('');
  const [journalLeafCount, setJournalLeafCount] = useState('');
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [busyJournalId, setBusyJournalId] = useState<string | null>(null);
  const [journalSaving, setJournalSaving] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationDraft, setLocationDraft] = useState('');
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [updatingDiagnosisId, setUpdatingDiagnosisId] = useState<string | null>(null);
  const [followUpCreatingId, setFollowUpCreatingId] = useState<string | null>(null);
  const [sharingPlant, setSharingPlant] = useState(false);
  const [photoCompareUrls, setPhotoCompareUrls] = useState<{ before: string; after: string } | null>(
    null,
  );
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  const {
    tasks: rangeTasks,
    animating,
    actionError: taskActionError,
    handleComplete: completeFromHook,
    handleSkip: skipFromHook,
    handleSnooze,
  } = useTasksInRange({ pastDays: 0, futureDays: 120 });

  const load = useCallback(async () => {
    if (!id) return;
    setPlantError('');
    setPlantLoading(true);
    try {
      const [plantRes, timelineRes] = await Promise.all([
        plantsApi.get(id),
        plantsApi.timeline(id),
      ]);
      setPlant(plantRes.data);
      setTimelineEvents(mapTimelineFromApi(timelineRes.data.events));
    } catch {
      setPlant(null);
      setTimelineEvents([]);
      setPlantError('Could not load this plant profile.');
    } finally {
      setPlantLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (plant) {
      setLocationDraft((plant.location as string) || PLANT_LOCATIONS[0]);
    }
  }, [plant?.location]);

  const resetJournalForm = () => {
    setJournalNotes('');
    setJournalPhoto(null);
    if (journalPhotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(journalPhotoPreview);
    }
    setJournalPhotoPreview(null);
    setJournalExistingPhotoUrl(null);
    setJournalRemovePhoto(false);
    setJournalHeightCm('');
    setJournalWidthCm('');
    setJournalLeafCount('');
    setJournalPhotoInputKey((key) => key + 1);
    setEditingJournalId(null);
    setJournalError('');
  };

  const setJournalPhotoWithPreview = (file: File | null) => {
    setJournalPhoto(file);
    if (file) setJournalRemovePhoto(false);
    setJournalPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      if (file) return URL.createObjectURL(file);
      if (journalRemovePhoto) return null;
      return journalExistingPhotoUrl;
    });
  };

  const clearJournalPhoto = () => {
    setJournalPhoto(null);
    setJournalRemovePhoto(true);
    setJournalPhotoPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setJournalPhotoInputKey((key) => key + 1);
  };

  const journalPayload = () => ({
    notes: journalNotes.trim() || undefined,
    heightCm: journalHeightCm ? Number(journalHeightCm) : undefined,
    widthCm: journalWidthCm ? Number(journalWidthCm) : undefined,
    leafCount: journalLeafCount ? Number(journalLeafCount) : undefined,
  });

  const hasJournalMeasurements = Boolean(
    journalHeightCm.trim() || journalWidthCm.trim() || journalLeafCount.trim(),
  );

  const hasJournalContent = Boolean(
    journalNotes.trim() ||
      journalPhoto ||
      hasJournalMeasurements ||
      (editingJournalId && journalExistingPhotoUrl && !journalRemovePhoto),
  );

  const addJournal = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !hasJournalContent || journalSaving) return;
    setJournalError('');
    setJournalSaving(true);
    try {
      await journalApi.create(id, journalPayload(), journalPhoto ?? undefined);
      resetJournalForm();
      await load();
    } catch {
      setJournalError('Could not save journal entry.');
    } finally {
      setJournalSaving(false);
    }
  };

  const saveJournalEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !editingJournalId || journalSaving) return;
    setJournalError('');
    setJournalSaving(true);
    try {
      await journalApi.update(
        id,
        editingJournalId,
        journalPayload(),
        journalPhoto ?? undefined,
        journalRemovePhoto,
      );
      resetJournalForm();
      await load();
    } catch {
      setJournalError('Could not update journal entry.');
    } finally {
      setJournalSaving(false);
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (!id) return;
    if (!window.confirm('Delete this journal entry? This cannot be undone.')) return;
    setBusyJournalId(entryId);
    setJournalError('');
    try {
      await journalApi.remove(id, entryId);
      if (editingJournalId === entryId) resetJournalForm();
      await load();
    } catch {
      setJournalError('Could not delete journal entry. It is still in your timeline.');
    } finally {
      setBusyJournalId(null);
    }
  };

  const startEditJournal = useCallback(
    (entryId: string) => {
      const entry = ((plant?.journalEntries as PlantRecord[]) || []).find((e) => e.id === entryId);
      if (!entry) return;
      setEditingJournalId(entryId);
      setJournalNotes((entry.notes as string) || '');
      setJournalHeightCm(entry.heightCm != null ? String(entry.heightCm) : '');
      setJournalWidthCm(entry.widthCm != null ? String(entry.widthCm) : '');
      setJournalLeafCount(entry.leafCount != null ? String(entry.leafCount) : '');
      setJournalPhoto(null);
      setJournalPhotoInputKey((key) => key + 1);
      const photoUrl = (entry.photoUrl as string | null) ?? null;
      setJournalExistingPhotoUrl(photoUrl);
      setJournalPhotoPreview(photoUrl);
      setJournalRemovePhoto(false);
    },
    [plant],
  );

  const saveLocation = async () => {
    if (!id) return;
    setLocationSaving(true);
    setLocationMessage('');
    try {
      const { data } = await plantsApi.update(id, { location: locationDraft });
      setPlant(data);
      setEditingLocation(false);
      setLocationMessage(
        data.tasksRescheduled
          ? 'Location saved. Upcoming care tasks were updated for this spot.'
          : 'Location saved.',
      );
    } catch {
      setLocationMessage('Could not save location. Try again.');
    } finally {
      setLocationSaving(false);
    }
  };

  const submitDiagnosis = async (
    payload: {
      symptomsText?: string;
      symptomDuration?: 'TODAY' | 'DAYS_2_3' | 'DAYS_4_7' | 'WEEKS_2_PLUS';
      recentCareChange?: 'NONE' | 'WATERING' | 'LIGHT' | 'REPOT' | 'FERTILIZER' | 'TEMPERATURE' | 'PEST_TREATMENT';
      pestsVisible?: boolean;
    },
    image?: File,
  ) => {
    if (!id) return;
    const { data } = await diagnosisApi.submit(id, payload, image);
    setPlant((current) => {
      if (!current) return current;
      const currentDiagnoses = (current.diagnoses as PlantRecord[] | undefined) || [];
      return {
        ...current,
        diagnoses: [data, ...currentDiagnoses].slice(0, 5),
      };
    });
  };

  const createFollowUpTask = async (diagnosisId: string, dueInDays: number, note?: string) => {
    if (!id) return;
    setFollowUpCreatingId(diagnosisId);
    try {
      const { data: task } = await diagnosisApi.createFollowUpTask(
        id,
        diagnosisId,
        dueInDays,
        note,
      );
      setPlant((current) => {
        if (!current) return current;
        const currentTasks = (current.tasks as PlantRecord[] | undefined) || [];
        return {
          ...current,
          tasks: [...currentTasks, task].sort(
            (a, b) =>
              new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime(),
          ),
        };
      });
      if (note?.trim()) void load();
    } finally {
      setFollowUpCreatingId(null);
    }
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

  const handleCompleteTask = (taskId: string, feedback?: TaskCompleteFeedback) => {
    const result = completeFromHook(taskId, feedback);
    window.setTimeout(() => void load(), 700);
    return result;
  };

  const handleSkipTask = (taskId: string, feedback?: TaskSkipFeedback) => {
    const result = skipFromHook(taskId, feedback);
    window.setTimeout(() => void load(), 700);
    return result;
  };

  const plantPendingFromHook = useMemo(() => {
    if (!id) return [];
    return rangeTasks
      .filter((t) => t.plant?.id === id && t.status === 'PENDING')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [rangeTasks, id]);

  const value = useMemo((): PlantProfileContextValue | null => {
    if (!plant || !id) return null;

    const species = plant.species as PlantRecord;
    const tasks = ((plant.tasks as PlantRecord[]) || []).sort(
      (a, b) => new Date(a.dueDate as string).getTime() - new Date(b.dueDate as string).getTime(),
    );
    const journalEntries = (plant.journalEntries as PlantRecord[] | undefined) || [];
    const diagnosisEntries = (plant.diagnoses as PlantRecord[] | undefined) || [];
    const pending = tasks.filter((t) => t.status === 'PENDING');
    const completed = tasks.filter((t) => t.status === 'DONE');
    const nextTask = pending[0];
    const latestCompleted = completed
      .filter((t) => t.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt as string).getTime() -
          new Date(a.completedAt as string).getTime(),
      )[0];
    const careOverview = plant.careOverview as CareOverview | undefined;
    const currentLocation = (plant.location as string) || PLANT_LOCATIONS[0];
    const locationOptions = (PLANT_LOCATIONS as readonly string[]).includes(currentLocation)
      ? PLANT_LOCATIONS
      : ([...PLANT_LOCATIONS, currentLocation] as const);
    const plantLabel = (plant.nickname as string) || (species.commonName as string);
    const activeDiagnosisCount = diagnosisEntries.filter((d) => !d.resolved).length;
    const latestUnresolved = diagnosisEntries.find((d) => !d.resolved);
    const diagnosisHasFollowUp = (diagnosisId: string) =>
      tasks.some(
        (task) =>
          task.sourceDiagnosisId === diagnosisId &&
          task.taskType === 'HEALTH_CHECK' &&
          task.status === 'PENDING',
      );

    return {
      id,
      plant,
      plantLabel,
      species,
      tasks,
      pending,
      journalEntries,
      diagnosisEntries,
      careOverview,
      currentLocation,
      locationOptions,
      locationDraft,
      setLocationDraft,
      editingLocation,
      setEditingLocation,
      locationSaving,
      locationMessage,
      saveLocation,
      nextTask,
      latestCompleted,
      plantPendingFromHook,
      animating,
      taskActionError,
      handleCompleteTask,
      handleSkipTask,
      handleSnooze,
      journalNotes,
      setJournalNotes,
      journalPhoto,
      setJournalPhoto: setJournalPhotoWithPreview,
      journalPhotoInputKey,
      journalExistingPhotoUrl,
      journalPhotoPreview,
      journalRemovePhoto,
      clearJournalPhoto,
      journalError,
      hasJournalContent,
      journalHeightCm,
      setJournalHeightCm,
      journalWidthCm,
      setJournalWidthCm,
      journalLeafCount,
      setJournalLeafCount,
      editingJournalId,
      setEditingJournalId: (entryId) => {
        if (entryId) startEditJournal(entryId);
        else resetJournalForm();
      },
      busyJournalId,
      journalSaving,
      addJournal,
      saveJournalEdit,
      deleteJournalEntry,
      appendJournalPrompt: (prompt) => appendJournalPrompt(prompt, setJournalNotes),
      timelineEvents,
      sectionCounts: {
        tasks: pending.length,
        journal: timelineEvents.length,
        diagnosis: activeDiagnosisCount,
      },
      activeDiagnosisCount,
      latestUnresolved,
      diagnosisHasFollowUp,
      updatingDiagnosisId,
      followUpCreatingId,
      submitDiagnosis,
      createFollowUpTask,
      updateDiagnosisStatus,
      sharingPlant,
      setSharingPlant,
      load,
      goToJournalTab: () => navigate(`/garden/plants/${id}/journal`),
      photoCompareUrls,
      setPhotoCompareUrls,
    };
  }, [
    plant,
    id,
    locationDraft,
    editingLocation,
    locationSaving,
    locationMessage,
    journalNotes,
    journalPhoto,
    journalRemovePhoto,
    journalPhotoInputKey,
    journalExistingPhotoUrl,
    journalHeightCm,
    journalWidthCm,
    journalLeafCount,
    timelineEvents,
    editingJournalId,
    busyJournalId,
    journalSaving,
    updatingDiagnosisId,
    followUpCreatingId,
    sharingPlant,
    photoCompareUrls,
    plantPendingFromHook,
    animating,
    taskActionError,
    navigate,
    load,
    startEditJournal,
  ]);

  return (
    <PlantProfileContext.Provider value={value}>
      {value ? (
        children
      ) : (
        <PlantProfilePending error={plantError} loading={plantLoading} onRetry={load} />
      )}
    </PlantProfileContext.Provider>
  );
}

export function usePlantProfile() {
  const ctx = useContext(PlantProfileContext);
  if (!ctx) {
    throw new Error('Plant profile is still loading.');
  }
  return ctx;
}

export function usePlantProfileOptional() {
  return useContext(PlantProfileContext);
}

function PlantProfilePending({
  error,
  loading,
  onRetry,
}: {
  error: string;
  loading: boolean;
  onRetry: () => Promise<void>;
}) {
  if (error && !loading) {
    return (
      <section className="rounded-3xl border border-rose-100 bg-rose-50 p-5 shadow-sm shadow-emerald-900/5">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
          Plant profile
        </p>
        <h1 className="mt-1 text-xl font-semibold text-rose-950">{error}</h1>
        <p className="mt-2 text-sm leading-6 text-rose-800">
          The rest of the garden is still available. Retry this plant profile when the
          connection settles.
        </p>
        <button
          type="button"
          onClick={() => void onRetry()}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-900 ring-1 ring-rose-200 hover:bg-rose-50"
        >
          Retry profile
        </button>
      </section>
    );
  }

  return <PlantProfileSkeleton />;
}

function PlantProfileSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading plant profile">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-32" />
      </div>
      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm shadow-emerald-900/5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <Skeleton className="h-36 w-full rounded-3xl sm:w-36" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-56 max-w-full" />
            <Skeleton className="h-4 w-44" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-20 rounded-2xl" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </section>
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-56 rounded-3xl" />
    </div>
  );
}
