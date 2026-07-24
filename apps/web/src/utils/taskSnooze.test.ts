import { describe, expect, it, vi } from 'vitest';
import { snoozeTasksSequentially } from './taskSnooze';

describe('snoozeTasksSequentially', () => {
  it('deduplicates task IDs and waits for each write before starting the next', async () => {
    const order: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstPending = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const snooze = vi.fn(async (id: string) => {
      order.push(`start:${id}`);
      if (id === 'task-1') await firstPending;
      order.push(`finish:${id}`);
    });

    const pending = snoozeTasksSequentially(
      ['task-1', 'task-1', 'task-2'],
      3,
      snooze,
    );
    await Promise.resolve();

    expect(order).toEqual(['start:task-1']);
    releaseFirst?.();
    await pending;

    expect(order).toEqual([
      'start:task-1',
      'finish:task-1',
      'start:task-2',
      'finish:task-2',
    ]);
    expect(snooze).toHaveBeenCalledTimes(2);
  });
});
