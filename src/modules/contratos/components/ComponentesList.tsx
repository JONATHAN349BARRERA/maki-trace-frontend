import { CircleCheck, X } from 'lucide-react';
import { COMPONENTE_LABEL, COMPONENTES, type Componente } from '../types';

/** Muestra qué cubre y qué no cubre el contrato. */
export function ComponentesList({ componentes }: { componentes: Componente[] }) {
  return (
    <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {COMPONENTES.map((c) => {
        const incluido = componentes.includes(c);
        return (
          <li key={c} className={`flex items-center gap-2 text-sm ${incluido ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
            {incluido ? (
              <CircleCheck size={16} className="text-emerald-600" aria-label="Incluido" />
            ) : (
              <X size={16} className="text-slate-400" aria-label="No incluido" />
            )}
            {COMPONENTE_LABEL[c]}
          </li>
        );
      })}
    </ul>
  );
}
