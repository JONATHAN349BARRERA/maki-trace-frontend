import { useState } from 'react';
import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import { useAlertas } from '../api';

export function AlertasBell() {
  const { data = [] } = useAlertas();
  const [abierto, setAbierto] = useState(false);
  const altas = data.filter((a) => a.severidad === 'alta').length;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Alertas (${data.length})`}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
      >
        <Bell size={20} />
        {data.length > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 min-w-5 rounded-full px-1 text-center text-[11px] font-semibold text-white ${altas ? 'bg-red-600' : 'bg-amber-500'}`}
          >
            {data.length}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-800">Alertas</p>
            <Link
              to="/alertas"
              onClick={() => setAbierto(false)}
              className="text-xs text-brand-600 hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {data.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">Sin alertas.</li>
            )}
            {data.slice(0, 8).map((a) => (
              <li key={a.id}>
                <Link
                  to={a.enlace}
                  onClick={() => setAbierto(false)}
                  className="block px-4 py-2 hover:bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-800">
                    <span
                      className={`mr-1.5 inline-block h-2 w-2 rounded-full ${a.severidad === 'alta' ? 'bg-red-500' : 'bg-amber-400'}`}
                    />
                    {a.titulo}
                  </p>
                  <p className="text-xs text-slate-500">{a.detalle}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
