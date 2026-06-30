import { format } from 'date-fns';
import TaskRow from '../../components/tasks/TaskRow';
import TaskScheduleExplanationLink from '../../components/TaskScheduleExplanationLink';
import {
  completeReasonLabel,
  countSnoozeFeedback,
  pickTerminalFeedback,
  skipReasonLabel,
  type TaskFeedbackRecord,
} from '../../utils/taskFeedback';
import { taskTypeLabel } from '../../utils/tasks';
import { usePlantProfile } from './PlantProfileContext';
import { ProfileSection, SectionEmptyState } from './shared';
import type { PlantRecord } from './types';

export default function PlantTasksTab() {
  const ctx = usePlantProfile();
  const recentHistory = ctx.tasks
    .filter((task) => task.status !== 'PENDING' && task.completedAt)
    .sort(
      (a, b) =>
        new Date(b.completedAt as string).getTime() -
        new Date(a.completedAt as string).getTime(),
    )
    .slice(0, 6);

  return (
    <ProfileSection
      eyebrow="Schedule"
      title="Tasks"
      description="Upcoming care actions for this plant. Open care steps before completing unfamiliar tasks."
    >
      {ctx.plantPendingFromHook.length ? (
        <ul className="space-y-2">
          {ctx.plantPendingFromHook.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                animState={ctx.animating[task.id] ?? null}
                onComplete={ctx.handleCompleteTask}
                onSkip={ctx.handleSkipTask}
                onSnooze={ctx.handleSnooze}
                linkPlant={false}
              />
            </li>
          ))}
        </ul>
      ) : (
        <SectionEmptyState
          title="No pending tasks"
          body="This plant is caught up in the current schedule window."
        />
      )}

      <div className="mt-6 border-t border-emerald-100 pt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Recent history
            </p>
            <h3 className="mt-1 font-semibold text-emerald-950">
              Feedback and schedule context
            </h3>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
            {recentHistory.length} recent
          </span>
        </div>

        {recentHistory.length ? (
          <ol className="space-y-3">
            {recentHistory.map((task) => (
              <RecentTaskHistoryCard key={task.id as string} task={task} plantLabel={ctx.plantLabel} />
            ))}
          </ol>
        ) : (
          <SectionEmptyState
            title="No recent care history"
            body="Complete, skip, or snooze tasks to build feedback that helps Dr. Plant tune this schedule."
          />
        )}
      </div>
    </ProfileSection>
  );
}

function RecentTaskHistoryCard({
  task,
  plantLabel,
}: {
  task: PlantRecord;
  plantLabel: string;
}) {
  const taskId = String(task.id);
  const taskType = String(task.taskType);
  const status = String(task.status);
  const completedAt = String(task.completedAt);
  const dueDate = String(task.dueDate);
  const feedbackList = task.feedback as TaskFeedbackRecord[] | undefined;
  const feedback = pickTerminalFeedback(feedbackList, status);
  const snoozeCount = countSnoozeFeedback(feedbackList);
  const reason = feedbackReasonLabel(status, feedback?.reason);
  const note = typeof feedback?.note === 'string' ? feedback.note.trim() : '';
  const isSkipped = status === 'SKIPPED';

  return (
    <li className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-900/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {isSkipped ? 'Skipped' : 'Completed'}
          </p>
          <h4 className="mt-1 font-semibold text-emerald-950">
            {taskTypeLabel(taskType)}
          </h4>
        </div>
        <time className="text-xs font-medium text-gray-400" dateTime={completedAt}>
          {format(new Date(completedAt), 'MMM d, h:mm a')}
        </time>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
        <p className="rounded-xl bg-emerald-50/60 px-3 py-2">
          <span className="font-semibold text-emerald-900">
            {snoozeCount > 0 ? 'Final due: ' : 'Originally due: '}
          </span>
          {format(new Date(dueDate), 'MMM d')}
          {snoozeCount > 0 ? (
            <span className="text-gray-500"> · rescheduled {snoozeCount}×</span>
          ) : null}
        </p>
        <p className="rounded-xl bg-sky-50/70 px-3 py-2">
          <span className="font-semibold text-sky-900">Feedback: </span>
          {reason ?? (isSkipped ? 'Skipped without a reason' : 'Completed without a note')}
        </p>
      </div>

      {note ? (
        <p className="mt-3 rounded-xl bg-amber-50/70 px-3 py-2 text-sm leading-6 text-amber-950">
          <span className="font-semibold">Note: </span>
          {note}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <TaskScheduleExplanationLink
          taskId={taskId}
          taskType={taskType}
          plantLabel={plantLabel}
        />
      </div>
    </li>
  );
}

function feedbackReasonLabel(status: string, reason: string | undefined) {
  if (status === 'SKIPPED') return skipReasonLabel(reason);
  return completeReasonLabel(reason);
}
