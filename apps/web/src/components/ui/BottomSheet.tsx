import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 sm:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-emerald-950/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto',
          'rounded-t-3xl border border-emerald-100 bg-white p-5 shadow-xl',
        )}
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-emerald-200" aria-hidden />
        {title ? <h2 className="mb-4 font-display text-lg font-semibold text-emerald-950">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}
