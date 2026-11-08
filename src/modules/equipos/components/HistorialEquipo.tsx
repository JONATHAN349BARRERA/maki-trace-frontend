import { Link } from 'react-router';
import { formatCOP, formatDate } from '@/shared/lib/format';
import type { EventoHistorial } from '../types';

/** Historial de servicios y repuestos: lo alimenta cada caso cerrado. */
export function HistorialEquipo({
  historial,
  verCostos,
}: {
  historial: EventoHistorial[];
  verCostos: boolean;
}) {
  if (historial.length === 0)
    return <p className="text-sm text-slate-500">Aún no hay servicios registrados.</p>;
  const orden = [...historial].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return (
    <ol className="space-y-3">
      {orden.map((h) => (
        <li key={h.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-slate-800">
              {h.tipo} ·{' '}
              <Link to={`/casos/${h.casoId}`} className="text-brand-600 hover:underline">
                {h.consecutivo}
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(h.fecha)}
              {h.tecnicoNombre && ` · ${h.tecnicoNombre}`}
            </p>
          </div>
          <p className="mt-1 text-sm text-slate-700">{h.descripcion}</p>
          {h.items.length > 0 && (
            <ul className="mt-2 text-xs text-slate-600">
              {h.items.map((i) => (
                <li key={i.itemId}>
                  {i.cantidad} × {i.nombre}
                  {verCostos && ` · ${formatCOP(i.cantidad * i.costoUnitario)}`}
                </li>
              ))}
            </ul>
          )}
          {verCostos && h.costo > 0 && (
            <p className="mt-1 text-xs font-medium text-slate-700">Costo: {formatCOP(h.costo)}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
