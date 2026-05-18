import { useEffect, useState } from 'react';
import { tasksApi } from '../services/api';
import { taskTypeLabel } from '../utils/tasks';

export interface TaskScheduleExplanationModalProps {
  taskId: string;
  taskType: string;
  plantLabel: string;
  onClose: () => void;
}

interface ScheduleExplanation {
  summary: string;
  factors: { label: string; impact: string }[];
}

export default function TaskScheduleExplanationModal({
  taskId,
  taskType,
  plantLabel,
  onClose,
}: TaskScheduleExplanationModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [explanation, setExplanation] = useState<ScheduleExplanation | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    tasksApi
      .explanation(taskId)
      .then((r) => setExplanation(r.data))
      .catch(() => setError('Could not load schedule explanation.'))
      .finally(() => setLoading(false));
  }, [taskId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Why this date?"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-lime-100 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-lime-700">
              {taskTypeLabel(taskType)} · {plantLabel}
            </p>
            <h2 id="schedule-explanation-title" className="font-display text-lg font-bold text-emerald-950">
              Why this date?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-4">
          {loading && (
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-2xl bg-lime-50" />
              <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          )}
          {error && (
            <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          )}
          {explanation && (
            <>
              <section className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
                <p className="text-sm leading-6 text-gray-800">{explanation.summary}</p>
              </section>
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  What shaped this date
                </h3>
                <ul className="mt-2 space-y-2">
                  {explanation.factors.map((factor) => (
                    <li
                      key={factor.label}
                      className="rounded-2xl border border-emerald-100/80 bg-white px-3 py-2.5"
                    >
                      <p className="text-xs font-semibold text-emerald-950">{factor.label}</p>
                      <p className="mt-0.5 text-sm leading-5 text-gray-600">{factor.impact}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
