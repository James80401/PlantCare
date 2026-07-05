import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { recommendationsApi, type RecommendationItem } from '../../services/api';
import { trackEvent } from '../../utils/analytics';
import { taskTypeLabel } from '../../utils/tasks';

const priorityClasses: Record<string, string> = {
  HIGH: 'border-amber-200 bg-amber-50 text-amber-950',
  MEDIUM: 'border-emerald-100 bg-emerald-50 text-emerald-950',
  LOW: 'border-slate-200 bg-slate-50 text-slate-800',
};

const priorityLabels: Record<string, string> = {
  HIGH: 'Worth doing soon',
  MEDIUM: 'Helpful next step',
  LOW: 'Nice when you have time',
};

const sourceLabels: Record<string, string> = {
  DR_PLANT: 'Dr. Plant',
  PLANT_CHECK_IN: 'Plant Life',
  CARE_TIMING: 'Care timing',
  ENVIRONMENT: 'Environment',
  SEASONAL: 'Seasonal',
  SYSTEM: 'Dr. Plant',
};

export function RecommendationPanel({
  title = 'Recommendations',
  description = 'Helpful next steps that are useful, but not urgent care tasks.',
  recommendations,
  onChanged,
  emptyText = 'Dr. Plant will surface gentle suggestions here when there is a useful next step.',
}: {
  title?: string;
  description?: string;
  recommendations: RecommendationItem[];
  onChanged: () => Promise<void> | void;
  emptyText?: string;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [confirmingTaskId, setConfirmingTaskId] = useState<string | null>(null);
  const visibleRecommendationIds = useMemo(
    () => recommendations.map((recommendation) => recommendation.id).join('|'),
    [recommendations],
  );

  useEffect(() => {
    setConfirmingTaskId(null);
  }, [visibleRecommendationIds]);

  useEffect(() => {
    if (recommendations.length === 0) return;
    for (const recommendation of recommendations) {
      trackRecommendationEvent('recommendation_view', recommendation);
    }
  }, [visibleRecommendationIds]);

  const runAction = async (
    recommendation: RecommendationItem,
    action: 'done' | 'snooze' | 'dismiss' | 'task',
  ) => {
    setBusyId(recommendation.id);
    setMessage(null);
    try {
      if (action === 'done') await recommendationsApi.done(recommendation.id);
      if (action === 'snooze') await recommendationsApi.snooze(recommendation.id);
      if (action === 'dismiss') await recommendationsApi.dismiss(recommendation.id);
      if (action === 'task') await recommendationsApi.convertToTask(recommendation.id);
      trackRecommendationEvent(recommendationActionEvent(action), recommendation);
      setMessage({ tone: 'success', text: actionMessage(action) });
      setConfirmingTaskId(null);
      await onChanged();
    } catch {
      setMessage({ tone: 'error', text: 'Could not update that recommendation. Try again.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="min-w-0 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Gentle guidance
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
        <p
          className={`mt-3 rounded-2xl px-3 py-2 text-sm font-medium ${
            message.tone === 'error'
              ? 'bg-rose-50 text-rose-800'
              : 'bg-emerald-50 text-emerald-900'
          }`}
          role={message.tone === 'error' ? 'alert' : 'status'}
          aria-live={message.tone === 'error' ? 'assertive' : 'polite'}
        >
          {message.text}
        </p>
      ) : null}

      {recommendations.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-emerald-100 bg-emerald-50/40 px-4 py-4">
          <p className="text-sm font-semibold text-emerald-950">All quiet for now</p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">{emptyText}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              busy={busyId === recommendation.id}
              confirmingTask={confirmingTaskId === recommendation.id}
              onStartTaskConfirmation={() => setConfirmingTaskId(recommendation.id)}
              onCancelTaskConfirmation={() => setConfirmingTaskId(null)}
              onAction={runAction}
            />
          ))}
        </div>
      )}
    </section>
  );
}

type RecommendationAnalyticsEvent =
  | 'recommendation_view'
  | 'recommendation_done'
  | 'recommendation_snooze'
  | 'recommendation_dismiss'
  | 'recommendation_task_convert';

function trackRecommendationEvent(
  event: RecommendationAnalyticsEvent,
  recommendation: RecommendationItem,
) {
  trackEvent(event, {
    recommendationId: recommendation.id,
    source: recommendation.source,
    priority: recommendation.priority,
    plantId: recommendation.plantId ?? undefined,
    gardenId: recommendation.gardenId ?? undefined,
    hasTaskConversion: Boolean(recommendation.suggestedTaskType),
    suggestedTaskType: recommendation.suggestedTaskType ?? undefined,
  });
}

function recommendationActionEvent(
  action: 'done' | 'snooze' | 'dismiss' | 'task',
): RecommendationAnalyticsEvent {
  if (action === 'task') return 'recommendation_task_convert';
  if (action === 'done') return 'recommendation_done';
  if (action === 'snooze') return 'recommendation_snooze';
  return 'recommendation_dismiss';
}

function actionMessage(action: 'done' | 'snooze' | 'dismiss' | 'task') {
  if (action === 'task') return 'Task created and added to your care list.';
  if (action === 'done') return 'Marked done for this recommendation cycle.';
  if (action === 'snooze') return 'Paused until tomorrow.';
  return 'Dismissed. Dr. Plant will not keep nudging this item.';
}

function RecommendationCard({
  recommendation,
  busy,
  confirmingTask,
  onStartTaskConfirmation,
  onCancelTaskConfirmation,
  onAction,
}: {
  recommendation: RecommendationItem;
  busy: boolean;
  confirmingTask: boolean;
  onStartTaskConfirmation: () => void;
  onCancelTaskConfirmation: () => void;
  onAction: (
    recommendation: RecommendationItem,
    action: 'done' | 'snooze' | 'dismiss' | 'task',
  ) => Promise<void>;
}) {
  const priorityClass = priorityClasses[recommendation.priority] ?? priorityClasses.MEDIUM;
  const sourceLabel = sourceLabels[recommendation.source] ?? titleCase(recommendation.source);
  const priorityLabel = priorityLabels[recommendation.priority] ?? 'Helpful next step';
  const plantName =
    recommendation.plant?.nickname ||
    recommendation.plant?.species.commonName ||
    recommendation.garden?.name ||
    'Garden';
  const confirmationId = `recommendation-task-confirm-${recommendation.id}`;

  return (
    <article className={`min-w-0 rounded-2xl border p-3 shadow-sm shadow-white/40 ${priorityClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold">
              {sourceLabel}
            </span>
            <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-semibold">
              {priorityLabel}
            </span>
          </div>
          <h3 className="mt-1 break-words font-semibold">{recommendation.title}</h3>
          <p className="mt-1 break-words text-xs font-medium opacity-75">{plantName}</p>
        </div>
        {recommendation.suggestedTaskType ? (
          <span className="max-w-full rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold">
            Can become {taskTypeLabel(recommendation.suggestedTaskType).toLowerCase()}
          </span>
        ) : null}
      </div>
      <p className="mt-2 break-words text-sm leading-6 opacity-90">{recommendation.body}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-current/10 pt-3 sm:flex sm:flex-wrap">
        {recommendation.actionPath && recommendation.actionLabel ? (
          <Link
            to={recommendation.actionPath}
            className="col-span-2 inline-flex min-h-10 min-w-0 items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50 sm:col-span-1 sm:justify-start"
          >
            <span className="truncate">{recommendation.actionLabel}</span>
          </Link>
        ) : null}
        {recommendation.suggestedTaskType ? (
          <button
            type="button"
            disabled={busy}
            onClick={onStartTaskConfirmation}
            aria-expanded={confirmingTask}
            aria-controls={confirmationId}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            Create task
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'done')}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
        >
          Mark done
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'snooze')}
          className="inline-flex min-h-10 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold opacity-80 ring-1 ring-current hover:opacity-100 disabled:opacity-50"
        >
          Remind tomorrow
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAction(recommendation, 'dismiss')}
          className="inline-flex min-h-10 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold opacity-70 hover:opacity-100 disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>

      {confirmingTask && recommendation.suggestedTaskType ? (
        <div
          id={confirmationId}
          className="mt-3 rounded-2xl border border-emerald-900/10 bg-white/80 p-3"
          role="group"
          aria-label="Confirm task creation"
        >
          <p className="text-sm font-semibold text-emerald-950">Create this as a care task?</p>
          <p className="mt-1 text-xs leading-5 text-emerald-900/80">
            Dr. Plant will add a {taskTypeLabel(recommendation.suggestedTaskType).toLowerCase()}{' '}
            task {dueLabel(recommendation.suggestedTaskDueInDays)} and mark this recommendation
            done.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAction(recommendation, 'task')}
              className="inline-flex min-h-10 items-center rounded-full bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              Confirm task
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onCancelTaskConfirmation}
              className="inline-flex min-h-10 items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
            >
              Keep as recommendation
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function dueLabel(days?: number | null) {
  if (days == null || days <= 1) return 'for tomorrow';
  return `in ${days} days`;
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
