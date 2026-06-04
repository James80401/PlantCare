import { format } from 'date-fns';
import type { Diagnosis, JournalEntry, Task, TaskFeedback } from '@prisma/client';
import { taskTypeLabel } from '../notifications/task-reminder-copy';
import type { PlantTimelineEventDto, PlantTimelineResponseDto } from './plant-timeline.types';

type TaskWithFeedback = Task & { feedback: TaskFeedback[] };

const SKIP_REASON_LABELS: Record<string, string> = {
  SOIL_STILL_WET: 'Soil still wet',
  PLANT_LOOKS_HEALTHY: 'Plant looks healthy',
  RAIN_HANDLED_WATERING: 'Rain handled it',
  TOO_BUSY: 'Too busy',
  OTHER: 'Other reason',
};

const COMPLETE_REASON_LABELS: Record<string, string> = {
  SOIL_VERY_DRY: 'Soil was very dry',
  PLANT_LOOKS_STRESSED: 'Plant looked stressed',
  PLANT_LOOKS_HEALTHY: 'Plant looked healthy',
  OTHER: 'Other reason',
};

function skipReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return SKIP_REASON_LABELS[reason] ?? reason;
}

function completeReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return COMPLETE_REASON_LABELS[reason] ?? reason;
}

export function buildPlantTimeline(
  journalEntries: JournalEntry[],
  tasks: TaskWithFeedback[],
  diagnoses: Diagnosis[],
): PlantTimelineResponseDto {
  const journalEvents: PlantTimelineEventDto[] = journalEntries.map((entry) => {
    const parts: string[] = [];
    if (entry.heightCm != null) parts.push(`Height ${entry.heightCm} cm`);
    if (entry.widthCm != null) parts.push(`Width ${entry.widthCm} cm`);
    if (entry.leafCount != null) parts.push(`${entry.leafCount} leaves`);
    const measurementMeta = parts.length ? parts.join(' · ') : undefined;

    return {
      id: `journal-${entry.id}`,
      journalId: entry.id,
      date: entry.createdAt.toISOString(),
      type: 'journal',
      title: entry.photoUrl ? 'Photo journal entry' : 'Journal note',
      description: entry.notes?.trim() || 'Photo update',
      meta: measurementMeta,
      imageUrl: entry.photoUrl,
    };
  });

  const taskEvents: PlantTimelineEventDto[] = tasks
    .filter((task) => task.status !== 'PENDING' && task.completedAt)
    .map((task) => {
      // Only the feedback row whose action matches the terminal status is the
      // "why" for this event; SNOOZE rows are reschedules, not skip/complete
      // reasons, and must not be rendered as such.
      const terminalAction = task.status === 'SKIPPED' ? 'SKIP' : 'COMPLETE';
      const terminalFeedback = task.feedback.find((f) => f.action === terminalAction);
      const snoozeCount = task.feedback.filter((f) => f.action === 'SNOOZE').length;
      const note = terminalFeedback?.note?.trim();

      let description: string;
      if (task.status === 'SKIPPED') {
        const reasonLabel = skipReasonLabel(terminalFeedback?.reason);
        if (reasonLabel) {
          description = `Skipped: ${reasonLabel}.`;
          if (note) description += ` ${note}`;
        } else {
          description =
            'This care task was skipped. Add a skip reason next time to improve scheduling.';
        }
      } else {
        // Surface the post-care observation (reason and/or note) so completing a
        // task with feedback becomes a visible entry in the plant's history.
        const reasonLabel = completeReasonLabel(terminalFeedback?.reason);
        if (reasonLabel || note) {
          description = reasonLabel
            ? `Completed — ${reasonLabel.toLowerCase()}.`
            : 'This care task was marked complete.';
          if (note) description += ` ${note}`;
        } else {
          description = 'This care task was marked complete.';
        }
      }

      const dueLabel = `${snoozeCount > 0 ? 'Due' : 'Originally due'} ${format(
        task.dueDate,
        'MMM d',
      )}`;
      const meta = snoozeCount > 0 ? `${dueLabel} · rescheduled ${snoozeCount}×` : dueLabel;

      return {
        id: `task-${task.id}`,
        date: task.completedAt!.toISOString(),
        type: 'care',
        title: `${taskTypeLabel(task.taskType)} ${
          task.status === 'DONE' ? 'completed' : 'skipped'
        }`,
        description,
        meta,
      };
    });

  const diagnosisEvents: PlantTimelineEventDto[] = diagnoses.map((diagnosis) => ({
    id: `diagnosis-${diagnosis.id}`,
    date: diagnosis.createdAt.toISOString(),
    type: 'diagnosis',
    title: diagnosis.resultLabel || 'Diagnosis result',
    description: diagnosis.adviceText?.trim() || 'Diagnosis saved for this plant.',
    meta:
      diagnosis.confidence != null
        ? `${Math.round(diagnosis.confidence * 100)}% confidence`
        : undefined,
    imageUrl: diagnosis.imageUrl,
  }));

  const events = [...journalEvents, ...taskEvents, ...diagnosisEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    events,
    counts: {
      journal: journalEvents.length,
      care: taskEvents.length,
      diagnosis: diagnosisEvents.length,
      total: events.length,
    },
  };
}
