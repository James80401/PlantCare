import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl font-bold text-emerald-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
