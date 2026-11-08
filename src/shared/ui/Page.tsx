import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  actions,
  backTo,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backTo?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {backTo && (
          <Link to={backTo} className="mb-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
            <ArrowLeft size={14} /> Volver
          </Link>
        )}
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
      {error instanceof Error ? error.message : 'Ocurrió un error inesperado.'}
    </p>
  );
}

export function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{i.label}</dt>
          <dd className="mt-0.5 text-sm text-slate-800">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
