import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: 'var(--color-page, #f7f6f2)' }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="font-display text-2xl font-bold text-emerald-950">
            Dr. Plant
          </Link>
          {subtitle ? <p className="mt-2 text-sm text-gray-600">{subtitle}</p> : null}
        </div>
        <Card padding="lg" className="space-y-4">
          <h1 className="font-display text-2xl font-bold text-emerald-950">{title}</h1>
          {children}
        </Card>
        {footer ? <div className="text-center text-sm text-gray-600">{footer}</div> : null}
      </div>
    </div>
  );
}
