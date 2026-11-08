import { Link } from 'react-router';
import { useAuth } from '@/modules/auth/AuthContext';
import { useAlertas } from '@/modules/alertas/api';
import { ESTADO_CASO_LABEL } from '@/modules/casos/types';
import { BarrasChart } from '@/shared/charts/charts';
import { formatCOP } from '@/shared/lib/format';
import { Card, ErrorState, Loading, PageHeader, StatCard } from '@/shared/ui';
import { useDashboard } from '../api';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const nombreMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`;

/** Tablero de administración: estado general de la operación. */
export function DashboardPage() {
  const { usuario } = useAuth();
  const { data, isLoading, error } = useDashboard();
  const alertas = useAlertas();
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  const esGerente = usuario?.rol === 'gerente';
  return (
    <>
      <PageHeader title="Tablero" subtitle={`Bienvenido, ${usuario?.nombre}`} />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link to="/contratos">
          <StatCard
            label="Contratos vigentes"
            value={data.contratosVigentes}
            hint={`${data.contratosPorVencer} por vencer en 30 días`}
            tone={data.contratosPorVencer ? 'warning' : 'default'}
          />
        </Link>
        <Link to="/casos">
          <StatCard label="Casos abiertos" value={data.casosAbiertos} />
        </Link>
        <Link to="/informes?tab=casos">
          <StatCard
            label="Casos demorados"
            value={data.casosDemorados}
            tone={data.casosDemorados ? 'danger' : 'success'}
          />
        </Link>
        <Link to="/inventario">
          <StatCard
            label="Ítems bajo mínimo"
            value={data.itemsBajoMinimo}
            tone={data.itemsBajoMinimo ? 'danger' : 'success'}
          />
        </Link>
        {esGerente && (
          <>
            <Link to="/cartera">
              <StatCard
                label="Cartera vencida"
                value={formatCOP(data.carteraVencida)}
                tone={data.carteraVencida ? 'danger' : 'success'}
              />
            </Link>
            <StatCard
              label="Repuestos y suministros entregados (mes)"
              value={formatCOP(data.costoEntregadoMes)}
            />
          </>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Casos registrados vs. cerrados (últimos 6 meses)">
          <BarrasChart
            titulo="Casos registrados y cerrados por mes"
            data={data.casosPorMes.map((m) => ({ ...m, mes: nombreMes(m.mes) }))}
            x="mes"
            series={[
              { key: 'registrados', label: 'Registrados' },
              { key: 'cerrados', label: 'Cerrados' },
            ]}
          />
        </Card>
        <Card title="Casos por estado">
          <BarrasChart
            titulo="Casos por estado"
            data={data.casosPorEstado.map((e) => ({
              estado: ESTADO_CASO_LABEL[e.estado],
              cantidad: e.cantidad,
            }))}
            x="estado"
            series={[{ key: 'cantidad', label: 'Casos' }]}
          />
        </Card>
      </div>
      <Card
        title="Alertas activas"
        className="mt-4"
        actions={
          <Link to="/alertas" className="text-sm text-brand-600 hover:underline">
            Ver todas
          </Link>
        }
      >
        <ul className="divide-y divide-slate-100">
          {(alertas.data ?? []).slice(0, 6).map((a) => (
            <li key={a.id} className="py-2">
              <Link to={a.enlace} className="block hover:underline">
                <span
                  className={`mr-2 inline-block rounded px-1.5 text-xs font-semibold ${a.severidad === 'alta' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                >
                  {a.severidad === 'alta' ? 'Alta' : 'Media'}
                </span>
                <span className="text-sm font-medium text-slate-800">{a.titulo}</span>
                <span className="ml-2 text-xs text-slate-500">{a.detalle}</span>
              </Link>
            </li>
          ))}
          {alertas.data?.length === 0 && (
            <li className="py-2 text-sm text-slate-500">Sin alertas.</li>
          )}
        </ul>
      </Card>
    </>
  );
}
