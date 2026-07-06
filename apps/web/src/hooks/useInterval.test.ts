import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInterval } from './useInterval';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
}

describe('useInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the callback on every interval tick', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    act(() => vi.advanceTimersByTime(3000));

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('does not tick when enabled is false', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000, false));

    act(() => vi.advanceTimersByTime(5000));

    expect(callback).not.toHaveBeenCalled();
  });

  it('does not tick when delayMs is null', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));

    act(() => vi.advanceTimersByTime(5000));

    expect(callback).not.toHaveBeenCalled();
  });

  it('stops ticking after unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 1000));

    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
    act(() => vi.advanceTimersByTime(5000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('skips a tick while the tab is hidden', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));

    setVisibility('hidden');
    act(() => vi.advanceTimersByTime(3000));
    expect(callback).not.toHaveBeenCalled();

    setVisibility('visible');
    act(() => vi.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('always invokes the latest callback without resetting the timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: first },
    });

    act(() => vi.advanceTimersByTime(500));
    rerender({ cb: second });
    act(() => vi.advanceTimersByTime(500));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
