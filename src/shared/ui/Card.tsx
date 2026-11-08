import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export function Card({
  title,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn('rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5', className)}
    >
      {(title || actions) && (
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold text-slate-800">{title}</h2>}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) {
  const tones = {
    default: 'text-slate-900',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    success: 'text-emerald-600',
  };
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
