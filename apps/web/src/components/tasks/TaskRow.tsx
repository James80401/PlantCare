import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { journalApi } from '../../services/api';
import TaskInstructionsLink from '../TaskInstructionsLink';
import TaskScheduleExplanationLink from '../TaskScheduleExplanationLink';
import {
  skipReasonsForTask,
  type TaskSkipFeedback,
  type TaskSkipReason,
  completeReasonsForTask,
  completeReasonLabel,
  type TaskCompleteFeedback,
  type TaskCompleteReason,
} from '../../utils/taskFeedback';
import { taskJournalPrompt, taskTypeLabel } from '../../utils/tasks';
import { SNOOZE_OPTIONS } from '../../utils/taskSnooze';
import { TASK_TYPE_ICONS, type TaskItem } from '../../utils/taskGroups';

type AnimState = 'completing' | 'skipping' | 'snoozing' | null;

interface TaskRowProps {
  task: TaskItem;
  animState: AnimState;
  onComplete: (id: string, feedback?: TaskCompleteFeedback) => Promise<unknown> | unknown;
  onSkip: (id: string, feedback?: TaskSkipFeedback) => Promise<unknown> | unknown;
  onSnooze?: (id: string, days: 1 | 3 | 7) => void;
  /** When true, type icon/label is omitted (parent section shows category). */
  groupedByType?: boolean;
  /** When true, plant name links to the plant profile. */
  linkPlant?: boolean;
}

export default function TaskRow({
  task,
  animState,
  onComplete,
  onSkip,
  onSnooze,
  groupedByType = false,
  linkPlant = true,
}: TaskRowProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<TaskSkipReason>('SOIL_STILL_WET');
  const [note, setNote] = useState('');
  const [completeFeedbackOpen, setCompleteFeedbackOpen] = useState(false);
  const [selectedCompleteReason, setSelectedCompleteReason] = useState<TaskCompleteReason>(
    'SOIL_VERY_DRY',
  );
  const [completeNote, setCompleteNote] = useState('');
  const [saveCompleteNoteToJournal, setSaveCompleteNoteToJournal] = useState(false);
  const [journalStatus, setJournalStatus] = useState('');
  const due = parseISO(task.dueDate);
  const isDone = task.status === 'DONE';
  const isSkipped = task.status === 'SKIPPED';
  const isPending = task.status === 'PENDING';
  const overdue = isPending && isPast(due) && !isToday(due);
  const plantLabel = task.plant.nickname || task.plant.species.commonName;
  const icon = TASK_TYPE_ICONS[task.taskType] ?? '🌿';
  const dueLabel = isToday(due) ? 'Due today' : `Due ${format(due, 'MMM d')}`;
  const skipPanelId = `skip-panel-${task.id}`;
  const snoozePanelId = `snooze-panel-${task.id}`;
  const completePanelId = `complete-panel-${task.id}`;
  const progressCheckInPath = `/garden/plants/${task.plant.id}/journal?progressTask=${encodeURIComponent(
    task.id,
  )}#progress-check-in`;
  const trimmedCompleteNote = completeNote.trim();
  const skipReasons = skipReasonsForTask(task.taskType);
  const effectiveSkipReason = skipReasons.some((reason) => reason.value === selectedReason)
    ? selectedReason
    : skipReasons[0].value;
  const completeReasons = completeReasonsForTask(task.taskType);
  const effectiveCompleteReason = completeReasons.some(
    (reason) => reason.value === selectedCompleteReason,
  )
    ? selectedCompleteReason
    : completeReasons[0].value;

  const rowClass = [
    'task-row group relative flex gap-3 rounded-2xl border px-3 py-3.5 transition-all duration-300 sm:px-4',
    animState === 'completing' && 'task-row--completing',
    animState === 'skipping' && 'task-row--skipping',
    animState === 'snoozing' && 'task-row--snoozing border-sky-200 bg-sky-50/70',
    isDone && 'task-row--done border-emerald-200/80 bg-emerald-50/50',
    isSkipped && 'task-row--skipped border-gray-200 bg-gray-50/80',
    isPending && !overdue && 'border-emerald-100/80 bg-white hover:border-emerald-200 hover:shadow-sm',
    overdue && 'border-red-200/90 bg-red-50/40',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={rowClass}>
      {animState === 'completing' && (
        <span className="task-row__burst pointer-events-none absolute inset-0 rounded-xl" aria-hidden />
      )}

      <div className="flex shrink-0 items-start pt-0.5">
        {isPending ? (
          <button
            type="button"
            onClick={() => void onComplete(task.id)}
            disabled={!!animState}
            className="task-check flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-400 bg-white text-transparent transition hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50"
            aria-label={`Mark ${taskTypeLabel(task.taskType)} for ${plantLabel} as done`}
          >
            <span className="text-xl font-bold text-emerald-700" aria-hidden>✓</span>
          </button>
        ) : (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              isDone
                ? 'bg-emerald-600 text-white task-check--filled'
                : 'bg-gray-300 text-gray-600'
            }`}
            aria-hidden
          >
            {isDone ? '✓' : '–'}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {groupedByType && linkPlant ? (
            <Link
              to={`/garden/plants/${task.plant.id}`}
              className={`text-base leading-snug hover:underline ${
                isDone || isSkipped
                  ? 'text-gray-500 line-through decoration-gray-400/80'
                  : 'font-medium text-emerald-950'
              } ${animState === 'completing' ? 'task-row__title--strike' : ''}`}
            >
              {plantLabel}
            </Link>
          ) : (
            <span
              className={`text-base leading-snug ${
                isDone || isSkipped
                  ? 'text-gray-500 line-through decoration-gray-400/80'
                  : 'font-medium text-emerald-950'
              } ${animState === 'completing' ? 'task-row__title--strike' : ''}`}
            >
              {!groupedByType && (
                <span className="mr-1.5" aria-hidden>
                  {icon}
                </span>
              )}
              {groupedByType ? plantLabel : taskTypeLabel(task.taskType)}
            </span>
          )}
          {!groupedByType &&
            (linkPlant ? (
              <Link
                to={`/garden/plants/${task.plant.id}`}
                className={`text-sm font-medium hover:underline ${
                  isDone || isSkipped ? 'text-gray-400' : 'text-emerald-700'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {plantLabel}
              </Link>
            ) : (
              <span className={`text-sm ${isDone || isSkipped ? 'text-gray-400' : 'text-gray-600'}`}>
                {plantLabel}
              </span>
            ))}
        </div>

        {isDone && task.completedAt && (
          <p className="mt-0.5 text-xs text-emerald-700/80">
            Completed {format(parseISO(task.completedAt), 'h:mm a')}
          </p>
        )}

        {isSkipped && <p className="mt-0.5 text-xs text-gray-500">Skipped</p>}

        {animState === 'snoozing' && (
          <p className="mt-0.5 text-xs font-semibold text-sky-700">Snoozing...</p>
        )}

        {overdue && isPending && (
          <p className="mt-0.5 text-xs font-semibold text-red-700">
            <span aria-hidden>⚠ </span>
            Overdue
          </p>
        )}

        {isPending && !overdue && (
          <p className="mt-0.5 text-xs font-medium text-emerald-700/80">{dueLabel}</p>
        )}

        {isPending && !animState && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <TaskInstructionsLink
                taskId={task.id}
                taskType={task.taskType}
                plantLabel={plantLabel}
              />
              <TaskScheduleExplanationLink
                taskId={task.id}
                taskType={task.taskType}
                plantLabel={plantLabel}
              />
              {task.taskType === 'HEALTH_CHECK' ? (
                <Link
                  to={progressCheckInPath}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-lime-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-lime-800"
                >
                  Record progress
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => setCompleteFeedbackOpen((open) => !open)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                aria-expanded={completeFeedbackOpen}
                aria-controls={completePanelId}
              >
                Add note
              </button>
              <button
                type="button"
                onClick={() => setFeedbackOpen((open) => !open)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                aria-expanded={feedbackOpen}
                aria-controls={skipPanelId}
              >
                Skip
              </button>
              {onSnooze ? (
                <button
                  type="button"
                  onClick={() => setSnoozeOpen((open) => !open)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                  aria-expanded={snoozeOpen}
                  aria-controls={snoozePanelId}
                >
                  Snooze
                </button>
              ) : null}
            </div>

            {snoozeOpen && onSnooze ? (
              <div
                id={snoozePanelId}
                role="region"
                aria-label="Snooze options"
                className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
                  Remind me
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SNOOZE_OPTIONS.map((option) => (
                    <button
                      key={option.days}
                      type="button"
                      onClick={() => {
                        onSnooze(task.id, option.days);
                        setSnoozeOpen(false);
                      }}
                      className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-sky-900 ring-1 ring-sky-100 hover:bg-sky-100"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {feedbackOpen ? (
              <div
                id={skipPanelId}
                role="region"
                aria-label="Skip task feedback"
                className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  Why skip this task?
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {skipReasons.map((reason) => (
                    <label
                      key={reason.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition ${
                        effectiveSkipReason === reason.value
                          ? 'border-amber-300 bg-white text-amber-950 shadow-sm'
                          : 'border-amber-100 bg-white/60 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`skip-reason-${task.id}`}
                        value={reason.value}
                        checked={effectiveSkipReason === reason.value}
                        onChange={() => setSelectedReason(reason.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{reason.label}</span>
                      <span className="mt-0.5 block leading-5 text-gray-500">{reason.helper}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-gray-600">Optional note</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={240}
                    placeholder="Example: soil was damp two inches down"
                    className="mt-1 w-full rounded-xl border border-amber-100 bg-white px-3 py-2 text-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onSkip(task.id, {
                        reason: effectiveSkipReason,
                        note: note.trim() || undefined,
                      })
                    }
                    className="rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
                  >
                    Save reason & skip
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackOpen(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => onSkip(task.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Skip without reason
                  </button>
                </div>
              </div>
            ) : null}

            {completeFeedbackOpen ? (
              <div
                id={completePanelId}
                role="region"
                aria-label="Complete task feedback"
                className="rounded-2xl border border-sky-100 bg-sky-50/60 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
                  Care result
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {completeReasons.map((r) => (
                    <label
                      key={r.value}
                      className={`cursor-pointer rounded-xl border px-3 py-2 text-xs transition ${
                        effectiveCompleteReason === r.value
                          ? 'border-sky-300 bg-white text-sky-950 shadow-sm'
                          : 'border-sky-100 bg-white/60 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`complete-reason-${task.id}`}
                        value={r.value}
                        checked={effectiveCompleteReason === r.value}
                        onChange={() => setSelectedCompleteReason(r.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{r.label}</span>
                      <span className="mt-0.5 block leading-5 text-gray-500">{r.helper}</span>
                    </label>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="text-xs font-medium text-gray-600">Optional note</span>
                  <input
                    value={completeNote}
                    onChange={(event) => setCompleteNote(event.target.value)}
                    maxLength={240}
                    placeholder={`Example: ${taskJournalPrompt(task.taskType)}`}
                    className="mt-1 w-full rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void completeWithObservation()}
                    className="rounded-full bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800"
                  >
                    Save result & complete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void onComplete(task.id);
                      setCompleteFeedbackOpen(false);
                      setCompleteNote('');
                      setSaveCompleteNoteToJournal(false);
                      setJournalStatus('');
                    }}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Complete without result
                  </button>
                </div>
                <label className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs leading-5 text-sky-950 ring-1 ring-sky-100">
                  <input
                    type="checkbox"
                    checked={saveCompleteNoteToJournal}
                    disabled={!trimmedCompleteNote}
                    onChange={(event) => setSaveCompleteNoteToJournal(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-semibold">Also save this note to journal</span>
                    <span className="block text-gray-600">
                      Useful for observations you want in the plant timeline, not just task
                      feedback.
                    </span>
                  </span>
                </label>
                {journalStatus ? (
                  <p className="mt-2 text-xs font-medium text-sky-900" role="status">
                    {journalStatus}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </li>
  );

  async function completeWithObservation() {
    const feedback: TaskCompleteFeedback = {
      reason: effectiveCompleteReason,
      note: trimmedCompleteNote || undefined,
    };
    const completed = await Promise.resolve(onComplete(task.id, feedback));
    if (completed === false) {
      setJournalStatus('Task could not be completed. Try again before saving to journal.');
      return;
    }

    if (saveCompleteNoteToJournal && trimmedCompleteNote) {
      try {
        await journalApi.create(task.plant.id, {
          notes: careObservationJournalNote(task, trimmedCompleteNote, effectiveCompleteReason),
        });
        setJournalStatus('Saved to journal.');
      } catch {
        setJournalStatus('Task completed, but the journal note could not be saved.');
        return;
      }
    }

    setCompleteFeedbackOpen(false);
    setCompleteNote('');
    setSaveCompleteNoteToJournal(false);
  }
}

function careObservationJournalNote(
  task: TaskItem,
  note: string,
  waterReason: TaskCompleteReason,
) {
  const prefix = `${taskTypeLabel(task.taskType)} observation`;
  if (task.taskType !== 'WATER') return `${prefix}: ${note}`;
  const reason = completeReasonLabel(waterReason);
  return `${prefix}${reason ? ` (${reason})` : ''}: ${note}`;
}

