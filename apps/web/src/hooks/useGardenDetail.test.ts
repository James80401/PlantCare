import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useGardenDetail } from './useGardenDetail';
import { gardensApi } from '../services/api';

vi.mock('../services/api', () => ({
  gardensApi: { detail: vi.fn() },
}));

const detail = vi.mocked(gardensApi.detail);

describe('useGardenDetail', () => {
  beforeEach(() => {
    detail.mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts loading, then exposes the garden on success', async () => {
    detail.mockResolvedValue({ data: { id: 'g1', name: 'Kitchen' } } as never);

    const { result } = renderHook(() => useGardenDetail('g1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.garden).toEqual({ id: 'g1', name: 'Kitchen' });
    expect(detail).toHaveBeenCalledTimes(1);
  });

  it('polls in the background without flipping loading back to true', async () => {
    detail.mockResolvedValue({ data: { id: 'g1', name: 'Kitchen' } } as never);

    const { result } = renderHook(() => useGardenDetail('g1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    detail.mockResolvedValue({ data: { id: 'g1', name: 'Kitchen (updated)' } } as never);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(detail).toHaveBeenCalledTimes(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.garden).toEqual({ id: 'g1', name: 'Kitchen (updated)' });
  });

  it('keeps showing stale data instead of an error when a background poll fails', async () => {
    detail.mockResolvedValue({ data: { id: 'g1', name: 'Kitchen' } } as never);

    const { result } = renderHook(() => useGardenDetail('g1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    detail.mockRejectedValue(new Error('flaky'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });

    expect(result.current.error).toBe('');
    expect(result.current.garden).toEqual({ id: 'g1', name: 'Kitchen' });
  });

  it('stops polling once unmounted', async () => {
    detail.mockResolvedValue({ data: { id: 'g1', name: 'Kitchen' } } as never);

    const { result, unmount } = renderHook(() => useGardenDetail('g1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    unmount();
    detail.mockClear();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(detail).not.toHaveBeenCalled();
  });
});
