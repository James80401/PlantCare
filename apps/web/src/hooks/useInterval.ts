import { useEffect, useRef } from 'react';

/**
 * Runs `callback` every `delayMs` while `enabled` is true. Skips a tick while
 * the tab is hidden so background tabs don't spend network/CPU on polling
 * nobody can see — the next check simply happens once the tab is visible
 * again. Pass `null` for `delayMs` to disable without unmounting the effect.
 *
 * Uses a ref for the callback so the interval only needs to be torn down and
 * rebuilt when `delayMs`/`enabled` actually change, not on every render.
 */
export function useInterval(callback: () => void, delayMs: number | null, enabled = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled || delayMs == null) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      savedCallback.current();
    }, delayMs);
    return () => window.clearInterval(id);
  }, [delayMs, enabled]);
}
