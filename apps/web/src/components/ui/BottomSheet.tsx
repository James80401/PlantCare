import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useDialogA11y } from '../../hooks/useDialogA11y';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialogA11y(open, onClose);

  useEffect(() => {
    if (open) sheetRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-emerald-950/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto',
          'rounded-t-3xl border border-emerald-100 bg-white p-5 shadow-xl focus:outline-none',
        )}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-emerald-200" aria-hidden />
        {title ? (
          <h2 id={titleId} className="mb-4 font-display text-lg font-semibold text-emerald-950">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  );
}
