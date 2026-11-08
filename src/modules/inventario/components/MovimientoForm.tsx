import { useState } from 'react';
import { Alert, Button, Input, Select } from '@/shared/ui';
import { useRegistrarMovimiento } from '../api';
import type { Item, TipoMovimiento } from '../types';

export function MovimientoForm({
  items,
  itemId,
  onDone,
}: {
  items: Item[];
  itemId?: string;
  onDone: () => void;
}) {
  const registrar = useRegistrarMovimiento();
  const [form, setForm] = useState({
    itemId: itemId ?? '',
    tipo: 'entrada' as TipoMovimiento,
    cantidad: '',
    costoUnitario: '',
    nota: '',
  });
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [k]: e.target.value });
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        registrar.mutate(
          {
            itemId: form.itemId,
            tipo: form.tipo,
            cantidad: Number(form.cantidad),
            costoUnitario: form.costoUnitario ? Number(form.costoUnitario) : undefined,
            nota: form.nota || undefined,
          },
          { onSuccess: onDone },
        );
      }}
    >
      {registrar.error && <Alert tone="danger">{registrar.error.message}</Alert>}
      <Select
        label="Ítem"
        placeholder="Seleccione…"
        value={form.itemId}
        onChange={set('itemId')}
        options={items.map((i) => ({
          value: i.id,
          label: `${i.codigo} · ${i.nombre} (${i.existencias})`,
        }))}
      />
      <Select
        label="Tipo de movimiento"
        value={form.tipo}
        onChange={set('tipo')}
        options={[
          { value: 'entrada', label: 'Entrada (compra / importación)' },
          { value: 'salida', label: 'Salida (consumo interno, baja)' },
          { value: 'ajuste', label: 'Ajuste por conteo físico' },
        ]}
      />
      <Input
        label={form.tipo === 'ajuste' ? 'Existencia contada' : 'Cantidad'}
        type="number"
        min={0}
        value={form.cantidad}
        onChange={set('cantidad')}
      />
      {form.tipo === 'entrada' && (
        <Input
          label="Costo unitario (opcional)"
          type="number"
          value={form.costoUnitario}
          onChange={set('costoUnitario')}
        />
      )}
      <Input label="Nota" value={form.nota} onChange={set('nota')} />
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!form.itemId || form.cantidad === '' || registrar.isPending}
        >
          Registrar movimiento
        </Button>
      </div>
    </form>
  );
}
