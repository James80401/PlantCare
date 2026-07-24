import { AxiosError } from 'axios';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDashboard } from './useDashboard';
import { dashboardApi } from '../services/api';

vi.mock('../services/api', () => ({
  dashboardApi: { get: vi.fn() },
}));

const get = vi.mocked(dashboardApi.get);

describe('useDashboard', () => {
  beforeEach(() => {
    get.mockReset();
  });

  it('starts loading, then exposes data on success', async () => {
    const payload = { greeting: { name: 'Sam', dateLabel: 'Mon', statusLine: 'ok' } };
    get.mockResolvedValue({ data: payload } as never);

    const { result } = renderHook(() => useDashboard());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBe('');
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('surfaces a friendly error message on failure', async () => {
    get.mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Could not load your dashboard.');
    expect(result.current.data).toBeNull();
  });

  it('reload() refetches and clears a prior error', async () => {
    get.mockRejectedValueOnce(new Error('flaky'));
    get.mockResolvedValue({ data: { greeting: { name: 'Sam' } } } as never);

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.error).toBe('Could not load your dashboard.'));

    await act(async () => {
      await result.current.reload();
    });

    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe('');
    expect(result.current.data).not.toBeNull();
  });

  it('retries one transient server failure', async () => {
    get.mockRejectedValueOnce(
      new AxiosError('temporarily unavailable', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 503,
      } as never),
    );
    get.mockResolvedValueOnce({ data: { greeting: { name: 'Recovered' } } } as never);

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(get).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe('');
    expect(result.current.data?.greeting.name).toBe('Recovered');
  });

  it('ignores stale responses after a newer reload completes', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }) as never,
    );
    get.mockResolvedValueOnce({ data: { greeting: { name: 'Latest' } } } as never);

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.data?.greeting.name).toBe('Latest');

    await act(async () => {
      resolveFirst?.({ data: { greeting: { name: 'Stale' } } });
      await Promise.resolve();
    });
    expect(result.current.data?.greeting.name).toBe('Latest');
  });
});
