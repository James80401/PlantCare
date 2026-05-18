import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-emerald-100 bg-white px-6 py-10 text-center shadow-sm shadow-emerald-900/5',
        className,
      )}
    >
      {icon ? <div className="mb-3 flex justify-center text-4xl">{icon}</div> : null}
      <h3 className="font-display text-lg font-semibold text-emerald-950">{title}</h3>
      {description ? <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
