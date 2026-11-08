import { Link, useParams } from 'react-router';
import { useAuth } from '@/modules/auth/AuthContext';
import { useItems } from '@/modules/inventario/api';
import { formatCOP, formatDateTime, formatNumber } from '@/shared/lib/format';
import { Alert, Card, DescriptionList, ErrorState, Loading, PageHeader, Table } from '@/shared/ui';
import { useCaso } from '../api';
import { AccionesCaso } from '../components/AccionesCaso';
import { Bitacora } from '../components/Bitacora';
import { EstadoCasoBadge } from '../components/EstadoCasoBadge';
import { FlujoEstados } from '../components/FlujoEstados';
import { SLA_HORAS } from '../domain/demora';
import { TIPO_CASO_LABEL, type ItemCantidad } from '../types';

function ListaItems({ items, nombres }: { items: ItemCantidad[]; nombres: Map<string, string> }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">Ninguno.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {items.map((i) => (
        <li key={i.itemId}>
          {i.cantidad} × {nombres.get(i.itemId) ?? i.itemId}
        </li>
      ))}
    </ul>
  );
}

export function CasoDetallePage() {
  const { id = '' } = useParams();
  const { usuario } = useAuth();
  const { data: caso, isLoading, error } = useCaso(id);
  const items = useItems();
  if (isLoading) return <Loading />;
  if (error || !caso) return <ErrorState error={error} />;
  const nombres = new Map((items.data ?? []).map((i) => [i.id, i.nombre]));
  const verCostos = usuario?.rol === 'gerente' || usuario?.rol === 'gestor';
  const volver = usuario?.rol === 'tecnico' ? '/tecnico' : '/casos';

  return (
    <>
      <PageHeader
        backTo={volver}
        title={`Caso ${caso.consecutivo}`}
        subtitle={`${TIPO_CASO_LABEL[caso.tipo]} · ${caso.clienteNombre}`}
        actions={<EstadoCasoBadge estado={caso.estado} demorado={caso.demorado} />}
      />
      <Card className="mb-4">
        <FlujoEstados estado={caso.estado} />
        {caso.demorado && (
          <div className="mt-3">
            <Alert tone="danger" title="Caso demorado">
              Supera el tiempo máximo de atención de {SLA_HORAS[caso.tipo]} h para solicitudes de
              tipo {TIPO_CASO_LABEL[caso.tipo].toLowerCase()}.
            </Alert>
          </div>
        )}
        <div className="mt-4">
          <AccionesCaso caso={caso} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Solicitud">
            <DescriptionList
              items={[
                { label: 'Descripción', value: caso.descripcion },
                {
                  label: 'Equipo',
                  value:
                    usuario?.rol === 'cliente' ? (
                      `${caso.equipoSerial} · ${caso.equipoModelo}`
                    ) : (
                      <Link
                        className="text-brand-600 hover:underline"
                        to={`/equipos/${caso.equipoId}`}
                      >
                        {caso.equipoSerial} · {caso.equipoModelo}
                      </Link>
                    ),
                },
                { label: 'Ubicación', value: caso.equipoUbicacion },
                {
                  label: 'Contrato',
                  value: caso.contratoId ? (
                    <Link
                      className="text-brand-600 hover:underline"
                      to={`/contratos/${caso.contratoId}`}
                    >
                      {caso.contratoNumero}
                    </Link>
                  ) : (
                    'Sin contrato'
                  ),
                },
                { label: 'Registrado', value: formatDateTime(caso.creadoEn) },
                { label: 'Técnico asignado', value: caso.tecnicoNombre ?? '—' },
                {
                  label: 'Fecha programada',
                  value: caso.fechaProgramada ? formatDateTime(caso.fechaProgramada) : '—',
                },
              ]}
            />
            {caso.itemsSolicitados.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ítems solicitados
                </p>
                <ListaItems items={caso.itemsSolicitados} nombres={nombres} />
              </div>
            )}
          </Card>
          {caso.advertenciasAceptadas &&
            caso.advertenciasAceptadas.length > 0 &&
            usuario?.rol !== 'cliente' && (
              <Alert tone="warning" title="Aprobado con advertencias">
                <ul className="list-disc pl-4">
                  {caso.advertenciasAceptadas.map((a) => (
                    <li key={a.mensaje}>{a.mensaje}</li>
                  ))}
                </ul>
              </Alert>
            )}
          {caso.trabajo && caso.estado === 'cerrado' && (
            <Card title="Trabajo realizado">
              <DescriptionList
                items={[
                  { label: 'Descripción', value: caso.trabajo.descripcion },
                  { label: 'Inicio', value: formatDateTime(caso.trabajo.inicio) },
                  { label: 'Fin', value: formatDateTime(caso.trabajo.fin) },
                  {
                    label: 'Contador registrado',
                    value: caso.trabajo.contador ? formatNumber(caso.trabajo.contador) : '—',
                  },
                  ...(verCostos
                    ? [{ label: 'Costo de lo entregado', value: formatCOP(caso.costoTotal ?? 0) }]
                    : []),
                ]}
              />
              {caso.trabajo.itemsUsados.length > 0 && (
                <div className="mt-4">
                  <Table
                    rows={caso.trabajo.itemsUsados}
                    rowKey={(i) => i.itemId}
                    columns={[
                      { header: 'Ítem entregado', cell: (i) => nombres.get(i.itemId) ?? i.itemId },
                      { header: 'Cantidad', cell: (i) => i.cantidad },
                    ]}
                  />
                </div>
              )}
            </Card>
          )}
        </div>
        <Card title="Bitácora">
          <Bitacora eventos={caso.bitacora} />
        </Card>
      </div>
    </>
  );
}
