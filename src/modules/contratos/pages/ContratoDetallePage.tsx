import { Link, useParams } from 'react-router';
import { Pencil } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { useCasos } from '@/modules/casos/api';
import { CasosTable } from '@/modules/casos/components/CasosTable';
import { useEquipos } from '@/modules/equipos/api';
import { formatCOP, formatDate, formatNumber } from '@/shared/lib/format';
import { Button, Card, DescriptionList, ErrorState, Loading, PageHeader, Table } from '@/shared/ui';
import { useContrato } from '../api';
import { ComponentesList } from '../components/ComponentesList';
import { VigenciaBadge } from '../components/VigenciaBadge';
import { MODALIDAD_LABEL } from '../types';

export function ContratoDetallePage() {
  const { id = '' } = useParams();
  const { puede } = useAuth();
  const contrato = useContrato(id);
  const equipos = useEquipos(id);
  const casos = useCasos({ contratoId: id });

  if (contrato.isLoading) return <Loading />;
  if (contrato.error || !contrato.data) return <ErrorState error={contrato.error} />;
  const c = contrato.data;
  const costoEntregado = (casos.data ?? []).reduce((s, k) => s + (k.costoTotal ?? 0), 0);

  return (
    <>
      <PageHeader
        backTo="/contratos"
        title={`Contrato ${c.numero}`}
        subtitle={c.clienteNombre}
        actions={
          puede('contratos:editar') && (
            <Link to={`/contratos/${c.id}/editar`}>
              <Button variant="secondary">
                <Pencil size={16} /> Editar
              </Button>
            </Link>
          )
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Datos del contrato" className="lg:col-span-2">
          <DescriptionList
            items={[
              { label: 'Modalidad', value: MODALIDAD_LABEL[c.modalidad] },
              {
                label: 'Estado',
                value: <VigenciaBadge estado={c.vigencia} dias={c.diasRestantes} />,
              },
              { label: 'Inicio', value: formatDate(c.fechaInicio) },
              { label: 'Fin', value: formatDate(c.fechaFin) },
              {
                label:
                  c.modalidad === 'arriendo' ? 'Cuota mensual por equipo' : 'Valor del contrato',
                value: formatCOP(c.valor),
              },
              { label: 'Equipos asociados', value: c.equipos },
              ...(puede('informes:ver')
                ? [
                    {
                      label: 'Costo de repuestos y suministros entregados',
                      value: formatCOP(costoEntregado),
                    },
                  ]
                : []),
              { label: 'Observaciones', value: c.observaciones || '—' },
            ]}
          />
        </Card>
        <Card title="Componentes cubiertos">
          <p className="mb-3 text-xs text-slate-500">
            Define hasta dónde puede solicitar el cliente.
          </p>
          <ComponentesList componentes={c.componentes} />
        </Card>
      </div>
      <Card title="Equipos del contrato" className="mt-4">
        <Table
          rows={equipos.data ?? []}
          rowKey={(e) => e.id}
          empty="Este contrato no tiene equipos asociados."
          columns={[
            {
              header: 'Serial',
              cell: (e) => (
                <Link
                  to={`/equipos/${e.id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {e.serial}
                </Link>
              ),
            },
            { header: 'Modelo', cell: (e) => `${e.marca} ${e.modelo}` },
            { header: 'Ubicación', cell: (e) => e.ubicacion },
            { header: 'Contador', cell: (e) => formatNumber(e.contadorActual) },
            { header: 'Casos abiertos', cell: (e) => e.casosAbiertos },
          ]}
        />
      </Card>
      <Card title="Casos del contrato" className="mt-4">
        <CasosTable casos={casos.data ?? []} />
      </Card>
    </>
  );
}
