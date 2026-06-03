import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClass = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-emerald-100/90 bg-white/95 shadow-sm shadow-emerald-900/5 ring-1 ring-white/70 transition-shadow duration-200 hover:shadow-md hover:shadow-emerald-900/10',
        paddingClass[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
