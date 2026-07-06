import { describe, expect, it } from 'vitest';
import {
  completeReasonLabel,
  completeReasonsForTask,
  countSnoozeFeedback,
  pickTerminalFeedback,
  skipReasonsForTask,
  skipReasonLabel,
} from './taskFeedback';

describe('taskFeedback labels', () => {
  it('maps known skip and complete reasons to friendly labels', () => {
    expect(skipReasonLabel('SOIL_STILL_WET')).toBe('Soil still wet');
    expect(completeReasonLabel('SOIL_VERY_DRY')).toBe('Soil was very dry');
    expect(completeReasonLabel('ROUTINE_CARE_DONE')).toBe('Routine care done');
    expect(skipReasonLabel(undefined)).toBeNull();
  });

  it('uses task-specific feedback choices for water vs routine care', () => {
    expect(completeReasonsForTask('WATER').map((reason) => reason.value)).toContain(
      'SOIL_VERY_DRY',
    );
    expect(completeReasonsForTask('FERTILIZE').map((reason) => reason.value)).toContain(
      'ROUTINE_CARE_DONE',
    );
    expect(skipReasonsForTask('WATER').map((reason) => reason.value)).toContain(
      'SOIL_STILL_WET',
    );
    expect(skipReasonsForTask('PRUNE').map((reason) => reason.value)).not.toContain(
      'SOIL_STILL_WET',
    );
  });
});

describe('pickTerminalFeedback', () => {
  const snooze = { action: 'SNOOZE', reason: 'SNOOZE_3D', note: 'Snoozed until 2026-06-10' };
  const complete = { action: 'COMPLETE', reason: 'SOIL_VERY_DRY', note: 'Bone dry' };
  const skip = { action: 'SKIP', reason: 'SOIL_STILL_WET', note: 'Still damp' };

  it('returns the complete row for a done task, ignoring snoozes', () => {
    // Newest-first order, as the API returns it.
    expect(pickTerminalFeedback([complete, snooze], 'DONE')).toBe(complete);
  });

  it('returns the skip row for a skipped task', () => {
    expect(pickTerminalFeedback([skip, snooze], 'SKIPPED')).toBe(skip);
  });

  it('does NOT mislabel a snooze row as the terminal reason', () => {
    // Task completed without explicit feedback but previously snoozed: there is
    // no COMPLETE row, so terminal feedback is undefined (not the snooze).
    expect(pickTerminalFeedback([snooze], 'DONE')).toBeUndefined();
  });

  it('handles empty/undefined feedback', () => {
    expect(pickTerminalFeedback(undefined, 'DONE')).toBeUndefined();
    expect(pickTerminalFeedback([], 'SKIPPED')).toBeUndefined();
  });
});

describe('countSnoozeFeedback', () => {
  it('counts only snooze rows', () => {
    expect(
      countSnoozeFeedback([
        { action: 'SNOOZE' },
        { action: 'COMPLETE' },
        { action: 'SNOOZE' },
      ]),
    ).toBe(2);
    expect(countSnoozeFeedback([{ action: 'COMPLETE' }])).toBe(0);
    expect(countSnoozeFeedback(undefined)).toBe(0);
  });
});
