import { useCallback, useEffect, useState } from 'react';
import { diagnosisApi } from '../services/api';
import { taskTypeLabel } from '../utils/tasks';

export type RecoverySuggestion = {
  key: string;
  label: string;
  taskType: string;
  dueInDays: number;
  alreadyScheduled: boolean;
};

interface RecoveryTasksPanelProps {
  plantId: string;
  diagnosisId: string;
  resolved?: boolean;
  onApplied?: (taskCount: number) => void;
}

function dueLabel(dueInDays: number): string {
  if (dueInDays <= 0) return 'Due today';
  if (dueInDays === 1) return 'Due tomorrow';
  return `Due in ${dueInDays} days`;
}

export default function RecoveryTasksPanel({
  plantId,
  diagnosisId,
  resolved = false,
  onApplied,
}: RecoveryTasksPanelProps) {
  const [suggestions, setSuggestions] = useState<RecoverySuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await diagnosisApi.getRecoverySuggestions(plantId, diagnosisId);
      setSuggestions(data);
      const defaults = new Set(
        data.filter((s) => !s.alreadyScheduled).map((s) => s.key),
      );
      setSelected(defaults);
    } catch {
      setError('Could not load recovery task suggestions.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [plantId, diagnosisId]);

  useEffect(() => {
    if (!resolved) load();
  }, [load, resolved]);

  const toggle = (key: string, disabled: boolean) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSuccess('');
  };

  const apply = async () => {
    const keys = [...selected];
    if (keys.length === 0) return;
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await diagnosisApi.applyRecoveryTasks(plantId, diagnosisId, keys);
      setSuccess(
        data.length === 1
          ? '1 recovery task added to your schedule.'
          : `${data.length} recovery tasks added to your schedule.`,
      );
      await load();
      onApplied?.(data.length);
    } catch {
      setError('Could not add recovery tasks. They may already be scheduled.');
    } finally {
      setApplying(false);
    }
  };

  if (resolved) return null;

  const selectable = suggestions.filter((s) => !s.alreadyScheduled);
  const allScheduled = suggestions.length > 0 && selectable.length === 0;

  return (
    <div className="border-t border-emerald-100 pt-3 space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
          Recovery tasks
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Turn &quot;Do now&quot; steps into scheduled care tasks. You choose what to add.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading suggestions…</p>
      ) : suggestions.length === 0 ? (
        <p className="text-sm text-gray-500">No recovery steps to schedule.</p>
      ) : allScheduled ? (
        <p className="text-sm text-emerald-800">
          Suggested recovery tasks are already on your care schedule.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => {
            const disabled = s.alreadyScheduled;
            const checked = disabled || selected.has(s.key);
            return (
              <li key={s.key}>
                <label
                  className={`flex gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    disabled
                      ? 'border-emerald-50 bg-emerald-50/50 opacity-70'
                      : 'border-emerald-100 bg-white cursor-pointer hover:bg-emerald-50/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-emerald-200 text-emerald-700"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(s.key, disabled)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-emerald-950">{s.label}</span>
                    <span className="mt-0.5 block text-xs text-emerald-700">
                      {taskTypeLabel(s.taskType)} · {dueLabel(s.dueInDays)}
                      {disabled ? ' · Already scheduled' : ''}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-800" role="status">
          {success}
        </p>
      ) : null}

      {selectable.length > 0 ? (
        <button
          type="button"
          disabled={applying || selected.size === 0}
          onClick={apply}
          className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {applying ? 'Adding tasks…' : `Add ${selected.size} task${selected.size === 1 ? '' : 's'} to schedule`}
        </button>
      ) : null}
    </div>
  );
}
