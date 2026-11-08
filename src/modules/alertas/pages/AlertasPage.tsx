import { Link } from 'react-router';
import { Card, ErrorState, Loading, PageHeader, Badge } from '@/shared/ui';
import { useAlertas } from '../api';
import type { TipoAlerta } from '../types';

const ETIQUETA: Record<TipoAlerta, string> = {
  inventario_minimo: 'Inventario',
  contrato_por_vencer: 'Contrato',
  contrato_vencido: 'Contrato',
  garantia_por_vencer: 'Garantía',
  caso_demorado: 'Caso demorado',
  consumo_anomalo: 'Consumo anómalo',
  factura_vencida: 'Cartera',
};

/** Centro de alertas: faltantes, vencimientos de contratos y garantías, demoras y consumos anómalos. */
export function AlertasPage() {
  const { data, isLoading, error } = useAlertas();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  return (
    <>
      <PageHeader title="Alertas" subtitle="Situaciones que requieren atención" />
      <Card>
        <ul className="divide-y divide-slate-100">
          {(data ?? []).length === 0 && (
            <li className="py-3 text-sm text-slate-500">No hay alertas activas.</li>
          )}
          {(data ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.severidad === 'alta' ? 'red' : 'amber'}>
                    {a.severidad === 'alta' ? 'Alta' : 'Media'}
                  </Badge>
                  <Badge>{ETIQUETA[a.tipo]}</Badge>
                  <p className="font-medium text-slate-800">{a.titulo}</p>
                </div>
                <p className="mt-1 text-sm text-slate-600">{a.detalle}</p>
              </div>
              <Link to={a.enlace} className="text-sm text-brand-600 hover:underline">
                Ver
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
