import { Plus, X } from 'lucide-react';
import type { Item } from '@/modules/inventario/types';
import type { ItemCantidad } from '../types';

/** Lista editable de repuestos/suministros con cantidad. */
export function ItemsSelector({
  items,
  value,
  onChange,
  label = 'Repuestos y suministros',
  mostrarExistencias = false,
}: {
  items: Item[];
  value: ItemCantidad[];
  onChange: (v: ItemCantidad[]) => void;
  label?: string;
  mostrarExistencias?: boolean;
}) {
  const disponibles = items.filter((i) => !value.some((v) => v.itemId === i.id));
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-slate-700">{label}</legend>
      <ul className="space-y-2">
        {value.map((v, idx) => {
          const item = items.find((i) => i.id === v.itemId);
          return (
            <li key={v.itemId} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-800">
                {item?.nombre ?? v.itemId}
                {mostrarExistencias && item && <span className="ml-1 text-xs text-slate-500">(existencias: {item.existencias})</span>}
              </span>
              <input
                type="number"
                min={1}
                aria-label={`Cantidad de ${item?.nombre ?? v.itemId}`}
                value={v.cantidad}
                onChange={(e) => {
                  const next = [...value];
                  next[idx] = { ...v, cantidad: Math.max(1, Number(e.target.value) || 1) };
                  onChange(next);
                }}
                className="w-20 rounded-lg px-2 py-1 text-sm ring-1 ring-slate-300"
              />
              <button
                type="button"
                aria-label={`Quitar ${item?.nombre ?? v.itemId}`}
                onClick={() => onChange(value.filter((x) => x.itemId !== v.itemId))}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </li>
          );
        })}
      </ul>
      {disponibles.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <Plus size={16} className="text-slate-400" aria-hidden />
          <select
            aria-label="Agregar ítem"
            className="flex-1 rounded-lg px-2 py-1.5 text-sm ring-1 ring-slate-300"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onChange([...value, { itemId: e.target.value, cantidad: 1 }]);
              e.target.value = '';
            }}
          >
            <option value="">Agregar…</option>
            {disponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.codigo} · {i.nombre}
              </option>
            ))}
          </select>
        </div>
      )}
    </fieldset>
  );
}
