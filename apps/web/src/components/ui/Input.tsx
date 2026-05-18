import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100',
          error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  id,
  rows = 4,
  ...props
}: InputHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined);
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(
          'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm',
          'focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100',
          className,
        )}
        {...props}
      />
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
