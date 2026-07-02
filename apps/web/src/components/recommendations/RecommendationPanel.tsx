import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsApi, type RecommendationItem } from '../../services/api';
import { taskTypeLabel } from '../../utils/tasks';

const priorityClasses: Record<string, string> = {
  HIGH: 'border-amber-200 bg-amber-50 text-amber-950',
  MEDIUM: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  LOW: 'border-slate-200 bg-slate-50 text-slate-800',
};

export function RecommendationPanel({
  title = 'Recommendations',
  description = 'Helpful next steps that are useful, but not urgent care tasks.',
  recommendations,
  onChanged,
  emptyText = 'No recommendations right now.',
}: {
  title?: string;
  description?: string;
  recommendations: RecommendationItem[];
  onChanged: () => Promise<void> | void;
  emptyText?: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const runAction = async (
    recommendation: RecommendationItem,
    action: 'done' | 'snooze' | 'dismiss' | 'task',
  ) => {
    setBusyId(recommendation.id);
    setMessage('');
    try {
      if (action === 'done') await recommendationsApi.done(recommendation.id);
      if (action === 'snooze') await recommendationsApi.snooze(recommendation.id);
      if (action === 'dismiss') await recommendationsApi.dismiss(recommendation.id);
      if (action === 'task') await recommendationsApi.convertToTask(recommendation.id);
      setMessage(action === 'task' ? 'Task added.' : 'Recommendation updated.');
      await onChanged();
    } catch {
      setMessage('Could not update that recommendation. Try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Guidance
          </p>
          <h2 className="mt-1 text-lg font-semibold text-emerald-950 font-display">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        {recommendations.length > 0 ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            {recommendations.length} open
          </span>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          {message}
        </p>
      ) : null}

      {recommendations.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
          {emptyText}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              busy={busyId === recommendation.id}
              onAction={runAction}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecommendationCard({
  recommendation,
  busy,
  onAction,
}: {
  recommendation: RecommendationItem;
  busy: boolean;
  onAction: (
    recommendation: RecommendationItem,
    action: 'done' | 'snooze' | 'dismiss' | 'task',
  ) => Promise<void>;
}) {
  const priorityClass = priorityClasses[recommendation.priority] ?? priorityClasses.MEDIUM;
  const plantName =
    recommendation.plant?.nickname ||
    recommendation.plant?.species.commonName ||
    recommendation.garden?.name ||
    'Garden';

  return (
    <article className={`rounded-2xl border p-3 ${priorityClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
            {plantName} / {recommendation.priority.toLowerCase()} priority
          </p>
          <h3 className="mt-1 font-semibold">{recommendation.title}</h3>
        </div>
        {recommendation.suggestedTaskType ? (
          <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">
            {taskTypeLabel(recommendation.suggestedTaskType)}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 opacity-90">{recommendation.body}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {recommendation.actionPath && recommendation.actionLabel ? (
          <Link
            to={recommendation.actionPath}
            className="inline-flex min-h-9 items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50"
          >
            {recommendation.actionLabel}
          </Link>
        ) : null}
        {recommendation.suggestedTaskType ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onAction(recommendation, 'task')}
            className="inline-flex min-h-9 items-center rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            Add task
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'done')}
          className="inline-flex min-h-9 items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
        >
          Done
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'snooze')}
          className="inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold opacity-80 ring-1 ring-current hover:opacity-100 disabled:opacity-50"
        >
          Tomorrow
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'dismiss')}
          className="inline-flex min-h-9 items-center rounded-full px-3 py-1.5 text-xs font-semibold opacity-70 hover:opacity-100 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}
