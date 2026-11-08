import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { formatCOP, formatDateTime } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loading,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Table,
} from '@/shared/ui';
import { useItems, useMovimientos } from '../api';
import { ItemForm } from '../components/ItemForm';
import { MovimientoForm } from '../components/MovimientoForm';
import { bajoMinimo } from '../domain/existencias';
import type { Item, Movimiento } from '../types';

export function InventarioPage() {
  const { puede } = useAuth();
  const items = useItems();
  const movimientos = useMovimientos();
  const [texto, setTexto] = useState('');
  const [tipo, setTipo] = useState('');
  const [modal, setModal] = useState<'item' | 'movimiento' | null>(null);
  const editable = puede('inventario:editar');

  const filas = useMemo(
    () =>
      (items.data ?? []).filter(
        (i) =>
          (!tipo || i.tipo === tipo) &&
          `${i.codigo} ${i.nombre}`.toLowerCase().includes(texto.toLowerCase()),
      ),
    [items.data, texto, tipo],
  );
  if (items.isLoading) return <Loading />;
  if (items.error) return <ErrorState error={items.error} />;
  const alertas = (items.data ?? []).filter(bajoMinimo);
  const valor = (items.data ?? []).reduce((s, i) => s + i.existencias * i.costoUnitario, 0);
  const nombres = new Map((items.data ?? []).map((i) => [i.id, i.nombre]));

  return (
    <>
      <PageHeader
        title="Repuestos y suministros"
        subtitle="Entradas, salidas, existencias y alertas de faltantes"
        actions={
          editable && (
            <>
              <Button variant="secondary" onClick={() => setModal('movimiento')}>
                <ArrowLeft size={16} className="rotate-90" /> Registrar movimiento
              </Button>
              <Button onClick={() => setModal('item')}>
                <Plus size={16} /> Nuevo ítem
              </Button>
            </>
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Referencias" value={items.data?.length ?? 0} />
        <StatCard
          label="Bajo el mínimo"
          value={alertas.length}
          tone={alertas.length ? 'danger' : 'success'}
        />
        <StatCard label="Valor del inventario" value={formatCOP(valor)} />
      </div>
      {alertas.length > 0 && (
        <div className="mb-4">
          <Alert tone="danger" title="Alerta de faltantes">
            {alertas.map((i) => `${i.nombre} (${i.existencias} de mínimo ${i.minimo})`).join(' · ')}
          </Alert>
        </div>
      )}
      <Card className="mb-4">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Buscar"
            placeholder="Código o nombre"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Select
            label="Tipo"
            placeholder="Todos"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={[
              { value: 'repuesto', label: 'Repuestos' },
              { value: 'suministro', label: 'Suministros' },
            ]}
          />
        </div>
        <Table<Item>
          caption="Existencias"
          rows={filas}
          rowKey={(i) => i.id}
          columns={[
            {
              header: 'Código',
              cell: (i) => (
                <Link
                  to={`/inventario/${i.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {i.codigo}
                </Link>
              ),
            },
            { header: 'Nombre', cell: (i) => i.nombre },
            { header: 'Tipo', cell: (i) => (i.tipo === 'repuesto' ? 'Repuesto' : 'Suministro') },
            {
              header: 'Existencias',
              cell: (i) => (
                <span className={bajoMinimo(i) ? 'font-semibold text-red-600' : ''}>
                  {i.existencias}
                </span>
              ),
            },
            { header: 'Mínimo', cell: (i) => i.minimo },
            {
              header: 'Estado',
              cell: (i) =>
                bajoMinimo(i) ? (
                  <Badge tone="red">Bajo mínimo</Badge>
                ) : (
                  <Badge tone="green">OK</Badge>
                ),
            },
            { header: 'Costo unitario', cell: (i) => formatCOP(i.costoUnitario) },
            {
              header: 'Compatible con',
              className: 'px-4 py-2 text-xs text-slate-600',
              cell: (i) => i.modelosCompatibles.join(', '),
            },
          ]}
        />
      </Card>
      <Card title="Últimos movimientos">
        <MovimientosTable movimientos={(movimientos.data ?? []).slice(0, 15)} nombres={nombres} />
      </Card>
      <Modal open={modal === 'item'} title="Nuevo ítem" onClose={() => setModal(null)}>
        {modal === 'item' && <ItemForm onDone={() => setModal(null)} />}
      </Modal>
      <Modal
        open={modal === 'movimiento'}
        title="Registrar movimiento"
        onClose={() => setModal(null)}
      >
        {modal === 'movimiento' && (
          <MovimientoForm items={items.data ?? []} onDone={() => setModal(null)} />
        )}
      </Modal>
    </>
  );
}

export function MovimientosTable({
  movimientos,
  nombres,
}: {
  movimientos: Movimiento[];
  nombres?: Map<string, string>;
}) {
  return (
    <Table<Movimiento>
      caption="Movimientos"
      rows={movimientos}
      rowKey={(m) => m.id}
      columns={[
        { header: 'Fecha', cell: (m) => formatDateTime(m.fecha) },
        ...(nombres
          ? [{ header: 'Ítem', cell: (m: Movimiento) => nombres.get(m.itemId) ?? m.itemId }]
          : []),
        {
          header: 'Tipo',
          cell: (m) => (
            <Badge tone={m.tipo === 'entrada' ? 'green' : m.tipo === 'salida' ? 'amber' : 'gray'}>
              {m.tipo}
            </Badge>
          ),
        },
        { header: 'Cantidad', cell: (m) => m.cantidad },
        { header: 'Costo', cell: (m) => formatCOP(Math.abs(m.cantidad) * m.costoUnitario) },
        {
          header: 'Caso',
          cell: (m) =>
            m.casoId ? (
              <Link to={`/casos/${m.casoId}`} className="text-brand-600 hover:underline">
                Ver caso
              </Link>
            ) : (
              '—'
            ),
        },
        { header: 'Usuario', cell: (m) => m.usuarioNombre },
        {
          header: 'Nota',
          cell: (m) => m.nota ?? '',
          className: 'px-4 py-2 text-xs text-slate-600',
        },
      ]}
    />
  );
}
