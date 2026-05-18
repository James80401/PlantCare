import { useMemo, useState } from 'react';
import { addDays, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { plantsApi, tasksApi } from '../../services/api';
import { isRainExposedLocation } from '../../utils/plantLocation';
import type { TaskItem } from '../../utils/taskGroups';

interface RainSkipOutdoorWateringProps {
  hasRainAlert: boolean;
}

export function RainSkipOutdoorWatering({ hasRainAlert }: RainSkipOutdoorWateringProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [candidates, setCandidates] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const previewCount = useMemo(() => candidates.length, [candidates]);

  if (!hasRainAlert) return null;

  const loadCandidates = async () => {
    setLoading(true);
    setError('');
    try {
      const from = startOfDay(new Date());
      const to = addDays(from, 2);
      const [plantsRes, tasksRes] = await Promise.all([
        plantsApi.list(),
        tasksApi.list(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)),
      ]);
      const outdoorPlantIds = new Set(
        plantsRes.data
          .filter((plant: { location?: string | null }) => isRainExposedLocation(plant.location))
          .map((plant: { id: string }) => plant.id),
      );

      const matches = tasksRes.data.filter((task: TaskItem) => {
        if (task.status !== 'PENDING' || task.taskType !== 'WATER') return false;
        if (!outdoorPlantIds.has(task.plant.id)) return false;
        const due = parseISO(task.dueDate);
        return isToday(due) || isTomorrow(due);
      });

      setCandidates(matches);
      if (matches.length === 0) {
        setError('No outdoor watering tasks due today or tomorrow.');
      } else {
        setShowConfirm(true);
      }
    } catch {
      setError('Could not load tasks to skip.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSkip = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(
        candidates.map((task) =>
          tasksApi.skip(task.id, { reason: 'RAIN_HANDLED_WATERING', note: 'Skipped from weather advice' }),
        ),
      );
      setMessage(
        `Skipped ${candidates.length} outdoor watering task${candidates.length === 1 ? '' : 's'}.`,
      );
      setShowConfirm(false);
      setCandidates([]);
    } catch {
      setError('Could not skip all tasks. Refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-3 text-sm">
      <p className="font-semibold text-sky-950">Rain in the forecast</p>
      <p className="mt-1 leading-6 text-gray-600">
        You can skip outdoor watering tasks for today or tomorrow if rain will handle it.
      </p>
      {message ? <p className="mt-2 text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-2 text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={loading}
        onClick={() => void loadCandidates()}
        className="mt-3 rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
      >
        {loading ? 'Loading…' : 'Skip outdoor watering…'}
      </button>

      {showConfirm ? (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="rain-skip-title"
          >
            <h3 id="rain-skip-title" className="text-lg font-semibold text-emerald-950">
              Skip {previewCount} watering task{previewCount === 1 ? '' : 's'}?
            </h3>
            <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm text-gray-700">
              {candidates.map((task) => (
                <li key={task.id}>
                  {task.plant.nickname || task.plant.species.commonName} — water
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              Tasks are skipped with reason “Rain handled it”. You can undo by rescheduling from the
              plant profile if needed.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => void confirmSkip()}
                className="rounded-full bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {loading ? 'Skipping…' : 'Confirm skip'}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
}
