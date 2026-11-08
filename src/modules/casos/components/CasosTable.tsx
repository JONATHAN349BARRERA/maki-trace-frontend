import { Link } from 'react-router';
import { formatDateTime } from '@/shared/lib/format';
import { Table } from '@/shared/ui';
import { TIPO_CASO_LABEL, type CasoDetalle } from '../types';
import { EstadoCasoBadge } from './EstadoCasoBadge';

export function CasosTable({
  casos,
  mostrarCliente = true,
}: {
  casos: CasoDetalle[];
  mostrarCliente?: boolean;
}) {
  return (
    <Table<CasoDetalle>
      caption="Casos"
      rows={casos}
      rowKey={(c) => c.id}
      empty="No hay casos."
      columns={[
        {
          header: 'Consecutivo',
          cell: (c) => (
            <Link to={`/casos/${c.id}`} className="font-medium text-brand-600 hover:underline">
              {c.consecutivo}
            </Link>
          ),
        },
        { header: 'Tipo', cell: (c) => TIPO_CASO_LABEL[c.tipo] },
        ...(mostrarCliente
          ? [{ header: 'Cliente', cell: (c: CasoDetalle) => c.clienteNombre }]
          : []),
        { header: 'Equipo', cell: (c) => `${c.equipoSerial} · ${c.equipoModelo}` },
        {
          header: 'Estado',
          cell: (c) => <EstadoCasoBadge estado={c.estado} demorado={c.demorado} />,
        },
        { header: 'Técnico', cell: (c) => c.tecnicoNombre ?? '—' },
        { header: 'Registrado', cell: (c) => formatDateTime(c.creadoEn) },
      ]}
    />
  );
}
