import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTasksInRange } from './useTasksInRange';
import { tasksApi } from '../services/api';

vi.mock('../services/api', () => ({
  tasksApi: {
    list: vi.fn(),
    complete: vi.fn(),
    bulkComplete: vi.fn(),
    skip: vi.fn(),
    snooze: vi.fn(),
  },
}));

const list = vi.mocked(tasksApi.list);
const snooze = vi.mocked(tasksApi.snooze);
const bulkComplete = vi.mocked(tasksApi.bulkComplete);

function task(id: string, status: string, dueDate: string) {
  return {
    id,
    status,
    dueDate,
    taskType: 'WATER',
    plant: { id: `p-${id}`, nickname: null, species: { commonName: 'Monstera' } },
  };
}

describe('useTasksInRange', () => {
  beforeEach(() => {
    list.mockReset();
    snooze.mockReset();
    bulkComplete.mockReset();
  });

  it('marks a whole care round complete from one bulk request', async () => {
    list.mockResolvedValue({
      data: [
        task('t1', 'PENDING', '2026-05-01T00:00:00.000Z'),
        task('t2', 'PENDING', '2026-05-02T00:00:00.000Z'),
      ],
    } as never);
    bulkComplete.mockResolvedValue({
      data: {
        completed: 2,
        taskIds: ['t1', 't2'],
        completedAt: '2026-06-22T12:00:00.000Z',
      },
    } as never);

    const { result } = renderHook(() => useTasksInRange());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleBulkComplete(['t1', 't2']);
    });

    expect(bulkComplete).toHaveBeenCalledWith(['t1', 't2']);
    expect(result.current.tasks.every((item) => item.status === 'DONE')).toBe(true);
  });

  it('loads tasks and derives a pending/done/today summary', async () => {
    const todayIso = new Date().toISOString();
    list.mockResolvedValue({
      data: [
        task('t1', 'PENDING', todayIso),
        task('t2', 'DONE', '2026-01-01T00:00:00.000Z'),
        task('t3', 'PENDING', '2030-01-01T00:00:00.000Z'),
      ],
    } as never);

    const { result } = renderHook(() => useTasksInRange());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toHaveLength(3);
    expect(result.current.summary).toEqual({ pending: 2, done: 1, todayPending: 1 });
  });

  it('optimistically patches the due date when a task is snoozed', async () => {
    list.mockResolvedValue({
      data: [task('t1', 'PENDING', '2026-05-01T00:00:00.000Z')],
    } as never);
    snooze.mockResolvedValue({
      data: { id: 't1', dueDate: '2026-05-08T00:00:00.000Z' },
    } as never);

    const { result } = renderHook(() => useTasksInRange());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.handleSnooze('t1', 7);
    });

    expect(snooze).toHaveBeenCalledWith('t1', 7);
    expect(result.current.tasks[0].dueDate).toBe('2026-05-08T00:00:00.000Z');
  });

  it('reloads from the server if a snooze request fails', async () => {
    list.mockResolvedValue({
      data: [task('t1', 'PENDING', '2026-05-01T00:00:00.000Z')],
    } as never);
    snooze.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => useTasksInRange());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(list).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleSnooze('t1', 3);
    });

    // The failed optimistic update falls back to a fresh load.
    expect(list).toHaveBeenCalledTimes(2);
  });
});
