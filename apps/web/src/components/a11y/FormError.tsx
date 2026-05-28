import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function FormError({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn('text-sm text-rose-600', className)}
    >
      {children}
    </p>
  );
}
