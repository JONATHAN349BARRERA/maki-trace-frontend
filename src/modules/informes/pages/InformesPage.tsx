import { Link, useSearchParams } from 'react-router';
import { Printer } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { VigenciaBadge } from '@/modules/contratos/components/VigenciaBadge';
import { EstadoCasoBadge } from '@/modules/casos/components/EstadoCasoBadge';
import { ESTADO_CASO_LABEL, TIPO_CASO_LABEL } from '@/modules/casos/types';
import { BarrasChart } from '@/shared/charts/charts';
import { cn } from '@/shared/lib/cn';
import { formatCOP, formatHours } from '@/shared/lib/format';
import { Badge, Button, Card, ErrorState, Loading, PageHeader, StatCard, Table } from '@/shared/ui';
import {
  useInformeCartera,
  useInformeCasos,
  useInformeContratos,
  useInformeInventario,
  useInformePersonal,
} from '../api';

/** Criterio de aceptación 4: estado de cada caso y cuáles están demorados. */
function InformeCasosView() {
  const { data, isLoading, error } = useInformeCasos();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Casos abiertos" value={data.abiertos} />
        <StatCard
          label="Demorados"
          value={data.demorados}
          tone={data.demorados ? 'danger' : 'success'}
        />
        <StatCard
          label="Tiempo promedio de solución"
          value={
            data.promedioHorasSolucion !== null ? formatHours(data.promedioHorasSolucion) : '—'
          }
        />
        <StatCard label="Total de casos" value={data.casos.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Por estado">
          <BarrasChart
            titulo="Casos por estado"
            data={data.porEstado.map((e) => ({
              estado: ESTADO_CASO_LABEL[e.estado],
              cantidad: e.cantidad,
            }))}
            x="estado"
            series={[{ key: 'cantidad', label: 'Casos' }]}
            alto={220}
          />
        </Card>
        <Card title="Por tipo de solicitud">
          <BarrasChart
            titulo="Casos por tipo"
            data={data.porTipo.map((e) => ({
              tipo: TIPO_CASO_LABEL[e.tipo],
              cantidad: e.cantidad,
            }))}
            x="tipo"
            series={[{ key: 'cantidad', label: 'Casos' }]}
            alto={220}
          />
        </Card>
      </div>
      <Card title="Estado de cada caso">
        <Table
          caption="Informe de casos"
          rows={data.casos}
          rowKey={(c) => c.id}
          columns={[
            {
              header: 'Caso',
              cell: (c) => (
                <Link to={`/casos/${c.id}`} className="font-medium text-brand-600 hover:underline">
                  {c.consecutivo}
                </Link>
              ),
            },
            { header: 'Tipo', cell: (c) => TIPO_CASO_LABEL[c.tipo] },
            { header: 'Cliente', cell: (c) => c.clienteNombre },
            {
              header: 'En qué punto va',
              cell: (c) => <EstadoCasoBadge estado={c.estado} demorado={c.demorado} />,
            },
            { header: 'Técnico', cell: (c) => c.tecnicoNombre ?? '—' },
            {
              header: 'Tiempo abierto',
              cell: (c) =>
                ['cerrado', 'rechazado'].includes(c.estado) ? '—' : formatHours(c.horasAbierto),
            },
          ]}
        />
      </Card>
    </div>
  );
}

function InformePersonalView() {
  const { data, isLoading, error } = useInformePersonal();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <div className="space-y-4">
      <Card title="Casos atendidos por técnico">
        <BarrasChart
          titulo="Casos por técnico"
          data={data}
          x="nombre"
          series={[
            { key: 'cerrados', label: 'Cerrados' },
            { key: 'abiertos', label: 'Abiertos' },
          ]}
          alto={240}
        />
      </Card>
      <Card>
        <Table
          caption="Informe de personal"
          rows={data}
          rowKey={(r) => r.tecnicoId}
          columns={[
            {
              header: 'Técnico',
              cell: (r) => (
                <Link
                  to={`/personal/${r.tecnicoId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {r.nombre}
                </Link>
              ),
            },
            { header: 'Zona', cell: (r) => r.zona },
            { header: 'Asignados', cell: (r) => r.asignados },
            { header: 'Cerrados', cell: (r) => r.cerrados },
            { header: 'Abiertos', cell: (r) => r.abiertos },
            {
              header: 'Promedio de atención',
              cell: (r) =>
                r.promedioHorasAtencion !== null ? formatHours(r.promedioHorasAtencion) : '—',
            },
            { header: 'Costo entregado', cell: (r) => formatCOP(r.costoEntregado) },
          ]}
        />
      </Card>
    </div>
  );
}

function InformeInventarioView() {
  const { data, isLoading, error } = useInformeInventario();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Valor del inventario" value={formatCOP(data.valorTotal)} />
        <StatCard
          label="Ítems que escasean"
          value={data.bajoMinimo}
          tone={data.bajoMinimo ? 'danger' : 'success'}
        />
      </div>
      <Card title="Qué rota: unidades entregadas en los últimos 90 días">
        <BarrasChart
          titulo="Rotación de inventario"
          data={data.filas.filter((f) => f.salidas90 > 0)}
          x="codigo"
          series={[{ key: 'salidas90', label: 'Unidades' }]}
          alto={220}
        />
      </Card>
      <Card>
        <Table
          caption="Informe de inventario"
          rows={data.filas}
          rowKey={(f) => f.itemId}
          columns={[
            {
              header: 'Ítem',
              cell: (f) => (
                <Link
                  to={`/inventario/${f.itemId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {f.codigo} · {f.nombre}
                </Link>
              ),
            },
            { header: 'Salidas 90 d', cell: (f) => f.salidas90 },
            { header: 'Existencias', cell: (f) => f.existencias },
            { header: 'Mínimo', cell: (f) => f.minimo },
            {
              header: 'Cobertura',
              cell: (f) => (f.diasCobertura === null ? 'Sin consumo' : `${f.diasCobertura} días`),
            },
            {
              header: 'Estado',
              cell: (f) =>
                f.bajoMinimo ? <Badge tone="red">Escasea</Badge> : <Badge tone="green">OK</Badge>,
            },
            { header: 'Valor', cell: (f) => formatCOP(f.valorExistencias) },
          ]}
        />
      </Card>
    </div>
  );
}

function InformeContratosView() {
  const { data, isLoading, error } = useInformeContratos();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <Card title="Uso de contratos">
      <p className="mb-3 text-sm text-slate-500">
        Casos y costo de lo entregado frente a lo facturado (arriendo) o al valor del contrato
        (posventa).
      </p>
      <Table
        caption="Uso de contratos"
        rows={data}
        rowKey={(r) => r.contratoId}
        columns={[
          {
            header: 'Contrato',
            cell: (r) => (
              <Link
                to={`/contratos/${r.contratoId}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {r.numero}
              </Link>
            ),
          },
          { header: 'Cliente', cell: (r) => r.clienteNombre },
          { header: 'Estado', cell: (r) => <VigenciaBadge estado={r.vigencia} /> },
          { header: 'Equipos', cell: (r) => r.equipos },
          {
            header: 'Casos (F/M/R/S)',
            cell: (r) =>
              `${r.casos} (${r.casosPorTipo.falla}/${r.casosPorTipo.mantenimiento}/${r.casosPorTipo.repuesto}/${r.casosPorTipo.suministro})`,
          },
          { header: 'Costo entregado', cell: (r) => formatCOP(r.costoEntregado) },
          {
            header: 'Facturado',
            cell: (r) => (r.modalidad === 'arriendo' ? formatCOP(r.facturado) : 'Posventa'),
          },
          {
            header: '% consumo',
            cell: (r) =>
              r.porcentajeConsumo === null ? (
                '—'
              ) : (
                <span className={cn(r.porcentajeConsumo > 40 && 'font-semibold text-red-600')}>
                  {r.porcentajeConsumo.toFixed(1)} %
                </span>
              ),
          },
        ]}
      />
    </Card>
  );
}

function InformeCarteraView() {
  const { data, isLoading, error } = useInformeCartera();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Facturado" value={formatCOP(data.facturado)} />
        <StatCard label="Recaudado" value={formatCOP(data.recaudado)} tone="success" />
        <StatCard label="Por cobrar (al día)" value={formatCOP(data.pendiente)} />
        <StatCard
          label="Vencido"
          value={formatCOP(data.vencido)}
          tone={data.vencido ? 'danger' : 'success'}
        />
      </div>
      <Card title="Antigüedad de la cartera">
        <BarrasChart
          titulo="Cartera por rango de mora"
          data={data.porRango}
          x="rango"
          series={[{ key: 'valor', label: 'Valor' }]}
          formato={formatCOP}
          alto={220}
        />
      </Card>
      <Card title="Cartera por cliente">
        <Table
          rows={data.porCliente}
          rowKey={(r) => r.clienteId}
          empty="No hay cartera pendiente."
          columns={[
            { header: 'Cliente', cell: (r) => r.clienteNombre },
            { header: 'Por cobrar', cell: (r) => formatCOP(r.pendiente) },
            {
              header: 'Vencido',
              cell: (r) => (
                <span className={cn(r.vencido > 0 && 'font-semibold text-red-600')}>
                  {formatCOP(r.vencido)}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}

const TABS = [
  { id: 'casos', label: 'Casos', view: InformeCasosView, soloGerente: false },
  { id: 'personal', label: 'Personal', view: InformePersonalView, soloGerente: true },
  { id: 'inventario', label: 'Inventario', view: InformeInventarioView, soloGerente: true },
  { id: 'contratos', label: 'Uso de contratos', view: InformeContratosView, soloGerente: true },
  { id: 'cartera', label: 'Cartera', view: InformeCarteraView, soloGerente: true },
];

export function InformesPage() {
  const { usuario } = useAuth();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.soloGerente || usuario?.rol === 'gerente');
  const activa = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0]!;
  const Vista = activa.view;
  return (
    <>
      <PageHeader
        title="Informes"
        subtitle="Información para controlar la operación y decidir con datos"
        actions={
          <Button variant="secondary" onClick={() => window.print()} className="no-print">
            <Printer size={16} /> Imprimir / PDF
          </Button>
        }
      />
      <div
        role="tablist"
        className="no-print mb-4 flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === activa.id}
            onClick={() => setParams({ tab: t.id })}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium',
              t.id === activa.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Vista />
    </>
  );
}
