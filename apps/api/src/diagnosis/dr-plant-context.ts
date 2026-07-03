import { format } from 'date-fns';
import { taskTypeLabel } from '../notifications/task-reminder-copy';

/**
 * Normalized signals Dr. Plant considers when answering, surfaced to the user so
 * they understand why advice references recent events. This is the SAME data the
 * chat service feeds the model (see DiagnosisChatService.gatherContextSignals),
 * presented as readable chips instead of a prompt string.
 */
export interface DrPlantContextSignals {
  location: string | null;
  potSize: string | null;
  wateringFreqDays: number;
  sunlight: string | null;
  journal: Array<{ notes: string | null; createdAt: Date }>;
  pendingTasks: Array<{ taskType: string; dueDate: Date }>;
  feedback: Array<{
    action: string;
    reason: string | null;
    note: string | null;
    taskType?: string | null;
  }>;
  activeDiagnosis: { resultLabel: string; createdAt: Date } | null;
  weatherAlert: { label: string; location: string } | null;
}

export type DrPlantContextCategory =
  | 'care'
  | 'health'
  | 'tasks'
  | 'feedback'
  | 'journal'
  | 'weather';

export interface DrPlantContextItem {
  category: DrPlantContextCategory;
  label: string;
  detail?: string;
}

export interface DrPlantContextSummary {
  intro: string;
  items: DrPlantContextItem[];
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? '' : 's'}`;
}

/** Pure builder: normalized signals → user-facing context chips. */
export function buildDrPlantContextSummary(
  signals: DrPlantContextSignals,
): DrPlantContextSummary {
  const items: DrPlantContextItem[] = [];

  const careDetail = [
    signals.location,
    signals.potSize ? `${signals.potSize.toLowerCase()} pot` : null,
    `water ~every ${signals.wateringFreqDays} days`,
    signals.sunlight ? `light: ${signals.sunlight}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  items.push({ category: 'care', label: 'Care baseline', detail: careDetail });

  if (signals.activeDiagnosis) {
    items.push({
      category: 'health',
      label: `Open issue: ${signals.activeDiagnosis.resultLabel}`,
      detail: `Noted ${format(signals.activeDiagnosis.createdAt, 'MMM d')}`,
    });
  }

  if (signals.pendingTasks.length) {
    const next = signals.pendingTasks[0];
    items.push({
      category: 'tasks',
      label: plural(signals.pendingTasks.length, 'upcoming care task'),
      detail: `next: ${taskTypeLabel(next.taskType)} ${format(next.dueDate, 'MMM d')}`,
    });
  }

  const skips = signals.feedback.filter(
    (f) => f.action === 'SKIP' && (f.reason || f.note),
  );
  if (skips.length) {
    const first = skips[0];
    const skippedTask = first.taskType ? taskTypeLabel(first.taskType).toLowerCase() : 'care';
    items.push({
      category: 'feedback',
      label: plural(skips.length, 'recent skip'),
      detail: `${skippedTask}: ${(first.note || reasonLabel(first.reason) || '').slice(0, 100)}`,
    });
  }

  const completes = signals.feedback.filter(
    (f) => f.action === 'COMPLETE' && (f.reason || f.note),
  );
  if (completes.length) {
    const first = completes[0];
    const careTask = first.taskType ? taskTypeLabel(first.taskType) : 'Care';
    const readableReason = reasonLabel(first.reason);
    const detail = first.note
      ? `${careTask}: ${readableReason ? `${readableReason}: ` : ''}${first.note}`
      : `${careTask}: ${readableReason}`;
    items.push({
      category: 'feedback',
      label: plural(completes.length, 'recent care observation'),
      detail: detail.slice(0, 120) || undefined,
    });
  }

  if (signals.journal.length) {
    const latest = signals.journal[0];
    items.push({
      category: 'journal',
      label: plural(signals.journal.length, 'recent journal note'),
      detail: `latest ${format(latest.createdAt, 'MMM d')}`,
    });
  }

  if (signals.weatherAlert) {
    items.push({
      category: 'weather',
      label: `Weather: ${signals.weatherAlert.label}`,
      detail: signals.weatherAlert.location,
    });
  }

  return {
    intro: "Dr. Plant tailors answers using your plant's recent care and conditions:",
    items,
  };
}

function reasonLabel(reason: string | null | undefined) {
  if (!reason) return '';
  return reason.replace(/_/g, ' ').toLowerCase();
}
