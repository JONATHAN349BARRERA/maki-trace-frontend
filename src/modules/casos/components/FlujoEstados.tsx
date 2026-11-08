import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { ORDEN_ESTADOS } from '../domain/flujo';
import { ESTADO_CASO_LABEL, type EstadoCaso } from '../types';

/** Muestra en qué punto va el caso dentro del flujo. */
export function FlujoEstados({ estado }: { estado: EstadoCaso }) {
  if (estado === 'rechazado') {
    return <p className="text-sm font-medium text-red-700">Solicitud rechazada</p>;
  }
  const actual = ORDEN_ESTADOS.indexOf(estado);
  return (
    <ol className="flex flex-wrap items-center gap-y-2" aria-label="Flujo del caso">
      {ORDEN_ESTADOS.map((e, i) => (
        <li key={e} className="flex items-center" aria-current={i === actual ? 'step' : undefined}>
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
              i < actual && 'bg-emerald-600 text-white',
              i === actual && 'bg-brand-600 text-white ring-4 ring-brand-100',
              i > actual && 'bg-slate-200 text-slate-500',
            )}
          >
            {i < actual ? <Check size={14} /> : i + 1}
          </span>
          <span
            className={cn(
              'ml-2 text-xs sm:text-sm',
              i === actual ? 'font-semibold text-slate-900' : 'text-slate-500',
            )}
          >
            {ESTADO_CASO_LABEL[e]}
          </span>
          {i < ORDEN_ESTADOS.length - 1 && <span className="mx-2 h-px w-4 bg-slate-300 sm:w-8" />}
        </li>
      ))}
    </ol>
  );
}
