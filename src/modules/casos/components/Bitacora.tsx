import { formatDateTime } from '@/shared/lib/format';
import { ESTADO_CASO_LABEL, type EventoBitacora } from '../types';

/** Registro de cada paso del caso (quién, cuándo y qué). */
export function Bitacora({ eventos }: { eventos: EventoBitacora[] }) {
  return (
    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
      {eventos.map((e, i) => (
        <li key={`${e.fecha}-${i}`}>
          <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-brand-500 ring-4 ring-white" />
          <p className="text-sm font-medium text-slate-800">{ESTADO_CASO_LABEL[e.estado]}</p>
          <p className="text-xs text-slate-500">
            {formatDateTime(e.fecha)} · {e.usuarioNombre}
          </p>
          {e.nota && <p className="mt-0.5 text-sm text-slate-600">{e.nota}</p>}
        </li>
      ))}
    </ol>
  );
}
