import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function StatusMessage({
  children,
  className,
  live = 'polite',
}: {
  children: ReactNode;
  className?: string;
  live?: 'polite' | 'assertive' | 'off';
}) {
  if (!children) return null;
  return (
    <p
      role="status"
      aria-live={live}
      className={cn('text-sm text-gray-500', className)}
    >
      {children}
    </p>
  );
}
