import { useState } from 'react';
import { useParams } from 'react-router';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { formatCOP, formatNumber } from '@/shared/lib/format';
import {
  Alert,
  Button,
  Card,
  DescriptionList,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
} from '@/shared/ui';
import { useItem, useItems, useMovimientos } from '../api';
import { ItemForm } from '../components/ItemForm';
import { MovimientoForm } from '../components/MovimientoForm';
import { bajoMinimo } from '../domain/existencias';
import { MovimientosTable } from './InventarioPage';

export function ItemDetallePage() {
  const { id = '' } = useParams();
  const { puede } = useAuth();
  const item = useItem(id);
  const items = useItems();
  const movs = useMovimientos(id);
  const [modal, setModal] = useState<'editar' | 'mov' | null>(null);
  if (item.isLoading) return <Loading />;
  if (item.error || !item.data) return <ErrorState error={item.error} />;
  const i = item.data;
  return (
    <>
      <PageHeader
        backTo="/inventario"
        title={i.nombre}
        subtitle={`${i.codigo} · ${i.tipo === 'repuesto' ? 'Repuesto' : 'Suministro'}`}
        actions={
          puede('inventario:editar') && (
            <>
              <Button variant="secondary" onClick={() => setModal('editar')}>
                <Pencil size={16} /> Editar
              </Button>
              <Button onClick={() => setModal('mov')}>Registrar movimiento</Button>
            </>
          )
        }
      />
      {bajoMinimo(i) && (
        <div className="mb-4">
          <Alert tone="danger" title="Existencia por debajo del mínimo">
            Hay {i.existencias} unidades y el mínimo es {i.minimo}. Gestione la reposición.
          </Alert>
        </div>
      )}
      <Card title="Datos" className="mb-4">
        <DescriptionList
          items={[
            { label: 'Existencias', value: i.existencias },
            { label: 'Mínimo', value: i.minimo },
            { label: 'Costo unitario', value: formatCOP(i.costoUnitario) },
            { label: 'Valor en existencia', value: formatCOP(i.costoUnitario * i.existencias) },
            {
              label: 'Rendimiento',
              value: i.rendimientoCopias
                ? `${formatNumber(i.rendimientoCopias)} copias por unidad`
                : '—',
            },
            { label: 'Modelos compatibles', value: i.modelosCompatibles.join(', ') },
          ]}
        />
      </Card>
      <Card title="Kárdex (movimientos)">
        <MovimientosTable movimientos={movs.data ?? []} />
      </Card>
      <Modal open={modal === 'editar'} title="Editar ítem" onClose={() => setModal(null)}>
        {modal === 'editar' && <ItemForm item={i} onDone={() => setModal(null)} />}
      </Modal>
      <Modal open={modal === 'mov'} title="Registrar movimiento" onClose={() => setModal(null)}>
        {modal === 'mov' && (
          <MovimientoForm items={items.data ?? []} itemId={i.id} onDone={() => setModal(null)} />
        )}
      </Modal>
    </>
  );
}
