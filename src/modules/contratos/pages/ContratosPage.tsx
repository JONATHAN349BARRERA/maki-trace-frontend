import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { formatCOP, formatDate } from '@/shared/lib/format';
import { Button, Card, ErrorState, Input, Loading, PageHeader, Select, Table } from '@/shared/ui';
import { useContratos } from '../api';
import { VigenciaBadge } from '../components/VigenciaBadge';
import { VIGENCIA_LABEL } from '../domain/vigencia';
import { COMPONENTE_LABEL, type ContratoResumen } from '../types';

export function ContratosPage() {
  const { data, isLoading, error } = useContratos();
  const { puede } = useAuth();
  const [texto, setTexto] = useState('');
  const [vigencia, setVigencia] = useState('');
  const [modalidad, setModalidad] = useState('');

  const filas = useMemo(
    () =>
      (data ?? []).filter(
        (c) =>
          (!vigencia || c.vigencia === vigencia) &&
          (!modalidad || c.modalidad === modalidad) &&
          `${c.numero} ${c.clienteNombre}`.toLowerCase().includes(texto.toLowerCase()),
      ),
    [data, texto, vigencia, modalidad],
  );

  return (
    <>
      <PageHeader
        title="Contratos"
        subtitle="Vigencia, modalidad, valor y componentes cubiertos de cada contrato"
        actions={
          puede('contratos:editar') && (
            <Link to="/contratos/nuevo">
              <Button>
                <Plus size={16} /> Nuevo contrato
              </Button>
            </Link>
          )
        }
      />
      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Buscar"
            placeholder="Número o cliente"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Select
            label="Vigencia"
            placeholder="Todas"
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            options={Object.entries(VIGENCIA_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Modalidad"
            placeholder="Todas"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value)}
            options={[
              { value: 'arriendo', label: 'Arriendo' },
              { value: 'posventa', label: 'Posventa' },
            ]}
          />
        </div>
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <Table<ContratoResumen>
            caption="Contratos"
            rows={filas}
            rowKey={(c) => c.id}
            columns={[
              {
                header: 'Número',
                cell: (c) => (
                  <Link
                    to={`/contratos/${c.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {c.numero}
                  </Link>
                ),
              },
              { header: 'Cliente', cell: (c) => c.clienteNombre },
              {
                header: 'Modalidad',
                cell: (c) => (c.modalidad === 'arriendo' ? 'Arriendo' : 'Posventa'),
              },
              {
                header: 'Vigencia',
                cell: (c) => `${formatDate(c.fechaInicio)} – ${formatDate(c.fechaFin)}`,
              },
              {
                header: 'Estado',
                cell: (c) => <VigenciaBadge estado={c.vigencia} dias={c.diasRestantes} />,
              },
              {
                header: 'Valor',
                cell: (c) =>
                  `${formatCOP(c.valor)}${c.modalidad === 'arriendo' ? ' /mes por equipo' : ''}`,
              },
              { header: 'Equipos', cell: (c) => c.equipos },
              {
                header: 'Cubre',
                className: 'px-4 py-2 text-xs text-slate-600',
                cell: (c) => c.componentes.map((k) => COMPONENTE_LABEL[k]).join(', '),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
