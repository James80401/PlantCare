import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { HelpButton } from './HelpButton';
import type { HelpTopicKey } from '../../content/helpTopics';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  help?: HelpTopicKey;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, action, help, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-3xl border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/55 to-amber-50/45 p-5 shadow-sm shadow-emerald-900/5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-lime-200/25 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-14 left-1/3 h-24 w-24 rounded-full bg-sky-200/20 blur-2xl" aria-hidden />
      {help ? (
        <div className="absolute right-4 top-4 z-10">
          <HelpButton topic={help} />
        </div>
      ) : null}
      <div className="relative">
        {eyebrow ? (
          <p className="inline-flex rounded-full bg-white/75 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-3xl font-bold text-emerald-950">{title}</h1>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      </div>
      {action ? <div className="relative shrink-0">{action}</div> : null}
    </div>
  );
}
