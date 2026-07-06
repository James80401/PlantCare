import { useEffect, useId, useRef } from 'react';

/** Focus initial control and close on Escape for modal dialogs. */
export function useDialogA11y(open: boolean, onClose: () => void) {
  const titleId = useId();
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    initialFocusRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open, onClose]);

  return { titleId, initialFocusRef };
}
