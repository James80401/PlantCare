import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type BackgroundLock = {
  count: number;
  inert: boolean;
  ariaHidden: string | null;
};

const backgroundLocks = new Map<HTMLElement, BackgroundLock>();
const dialogStack: symbol[] = [];
let bodyLockCount = 0;
let bodyOverflowBeforeLock = '';

function lockElement(element: HTMLElement) {
  const lock = backgroundLocks.get(element);
  if (lock) {
    lock.count += 1;
    return;
  }
  backgroundLocks.set(element, {
    count: 1,
    inert: element.inert,
    ariaHidden: element.getAttribute('aria-hidden'),
  });
  element.inert = true;
  element.setAttribute('aria-hidden', 'true');
}

function unlockElement(element: HTMLElement) {
  const lock = backgroundLocks.get(element);
  if (!lock) return;
  lock.count -= 1;
  if (lock.count > 0) return;
  element.inert = lock.inert;
  if (lock.ariaHidden == null) element.removeAttribute('aria-hidden');
  else element.setAttribute('aria-hidden', lock.ariaHidden);
  backgroundLocks.delete(element);
}

function lockBackground(dialog: HTMLElement) {
  const locked: HTMLElement[] = [];
  let current: HTMLElement | null = dialog;
  while (current?.parentElement && current.parentElement !== document.body) {
    const parentElement: HTMLElement = current.parentElement;
    for (const sibling of Array.from(parentElement.children)) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        lockElement(sibling);
        locked.push(sibling);
      }
    }
    current = parentElement;
  }
  if (current?.parentElement === document.body) {
    for (const sibling of Array.from(document.body.children)) {
      if (sibling !== current && sibling instanceof HTMLElement) {
        lockElement(sibling);
        locked.push(sibling);
      }
    }
  }
  return () => locked.forEach(unlockElement);
}

function focusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.closest('[inert]') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export interface DialogA11yOptions {
  closeOnEscape?: boolean;
}

/** Traps focus, restores the trigger, locks background interaction, and supports nested dialogs. */
export function useDialogA11y(
  open: boolean,
  onClose: () => void,
  options: DialogA11yOptions = {},
) {
  const titleId = useId();
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closeOnEscape = options.closeOnEscape ?? true;

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const token = Symbol('dialog');
    dialogStack.push(token);
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const unlockBackground = lockBackground(dialog);

    if (bodyLockCount === 0) {
      bodyOverflowBeforeLock = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyLockCount += 1;

    const focusInitial = () => {
      const target =
        initialFocusRef.current ?? focusableElements(dialog)[0] ?? dialog;
      if (target === dialog && !dialog.hasAttribute('tabindex')) {
        dialog.setAttribute('tabindex', '-1');
      }
      target.focus();
    };
    focusInitial();

    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== token) return;
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !dialog.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !dialog.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const stackIndex = dialogStack.lastIndexOf(token);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      unlockBackground();
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) document.body.style.overflow = bodyOverflowBeforeLock;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [closeOnEscape, open]);

  return { titleId, initialFocusRef, dialogRef };
}
