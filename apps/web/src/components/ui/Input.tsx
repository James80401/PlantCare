import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useId } from 'react';
import { cn } from '../../lib/cn';
import { FormError } from '../a11y/FormError';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id || `input-${autoId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100',
          error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      />
      {error ? (
        <FormError id={errorId} className="text-xs">
          {error}
        </FormError>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
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
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  const autoId = useId();
  const inputId = id || `textarea-${autoId}`;
  const errorId = error ? `${inputId}-error` : undefined;

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
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm',
          'focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100',
          error && 'border-rose-300 focus:border-rose-400 focus:ring-rose-100',
          className,
        )}
        {...props}
      />
      {error ? (
        <FormError id={errorId} className="text-xs">
          {error}
        </FormError>
      ) : null}
    </div>
  );
}
