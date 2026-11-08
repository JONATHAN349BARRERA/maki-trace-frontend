import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { EstadoCasoBadge } from '@/modules/casos/components/EstadoCasoBadge';
import type { EstadoCaso } from '@/modules/casos/types';
import { formatDateTime, formatHours } from '@/shared/lib/format';
import { Button, Card, DescriptionList, ErrorState, Loading, Modal, PageHeader, StatCard, Table } from '@/shared/ui';
import { useTecnico } from '../api';
import type { Labor } from '../types';
import { TecnicoForm } from './PersonalPage';

export function TecnicoDetallePage() {
  const { id = '' } = useParams();
  const { puede } = useAuth();
  const { data: t, isLoading, error } = useTecnico(id);
  const [editar, setEditar] = useState(false);
  if (isLoading) return <Loading />;
  if (error || !t) return <ErrorState error={error} />;
  return (
    <>
      <PageHeader
        backTo="/personal"
        title={t.nombre}
        subtitle={`${t.especialidad} · ${t.zona}`}
        actions={puede('personal:editar') && <Button variant="secondary" onClick={() => setEditar(true)}><Pencil size={16} /> Editar</Button>}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Casos abiertos" value={t.casosAbiertos} />
        <StatCard label="Casos cerrados" value={t.casosCerrados} />
        <StatCard label="Tiempo promedio de atención" value={t.promedioHorasAtencion !== null ? formatHours(t.promedioHorasAtencion) : '—'} hint="Desde la asignación hasta el cierre" />
        <StatCard label="Estado" value={t.activo ? 'Activo' : 'Inactivo'} tone={t.activo ? 'success' : 'default'} />
      </div>
      <Card title="Datos de contacto" className="mb-4">
        <DescriptionList items={[{ label: 'Documento', value: t.documento }, { label: 'Teléfono', value: t.telefono }, { label: 'Correo', value: t.email }, { label: 'Zona', value: t.zona }]} />
      </Card>
      <Card title="Labores realizadas y asignaciones">
        <Table<Labor>
          rows={t.labores}
          rowKey={(l) => l.casoId}
          empty="Sin asignaciones."
          columns={[
            { header: 'Caso', cell: (l) => <Link to={`/casos/${l.casoId}`} className="font-medium text-brand-600 hover:underline">{l.consecutivo}</Link> },
            { header: 'Estado', cell: (l) => <EstadoCasoBadge estado={l.estado as EstadoCaso} /> },
            { header: 'Dónde', className: 'px-4 py-2 text-slate-700', cell: (l) => `${l.clienteNombre} · ${l.ubicacion}` },
            { header: 'Cuándo', cell: (l) => (l.fin ? formatDateTime(l.fin) : l.fechaProgramada ? `Prog. ${formatDateTime(l.fechaProgramada)}` : '—') },
            { header: 'Qué hizo', className: 'px-4 py-2 text-slate-700 min-w-60', cell: (l) => l.descripcion || `${l.tipo} (pendiente)` },
            { header: 'Tiempo', cell: (l) => (l.horasAtencion !== null ? formatHours(l.horasAtencion) : '—') },
          ]}
        />
      </Card>
      <Modal open={editar} title="Editar técnico" onClose={() => setEditar(false)}>
        {editar && <TecnicoForm tecnico={t} onDone={() => setEditar(false)} />}
      </Modal>
    </>
  );
}
