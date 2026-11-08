import { useMemo, useState } from 'react';
import { formatCOP, formatDate } from '@/shared/lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Loading,
  PageHeader,
  Select,
  StatCard,
  Table,
} from '@/shared/ui';
import { useFacturas, useGenerarFacturacion, useRegistrarPago } from '../api';
import type { FacturaResumen } from '../types';

export function CarteraPage() {
  const { data, isLoading, error } = useFacturas();
  const generar = useGenerarFacturacion();
  const pagar = useRegistrarPago();
  const [estado, setEstado] = useState('');
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [mensaje, setMensaje] = useState<string | null>(null);
  const filas = useMemo(
    () => (data ?? []).filter((f) => !estado || f.estadoActual === estado),
    [data, estado],
  );
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  const suma = (e: string) =>
    (data ?? []).filter((f) => f.estadoActual === e).reduce((s, f) => s + f.valor, 0);
  return (
    <>
      <PageHeader title="Cartera" subtitle="Facturación de arriendos, pagos y cartera vencida" />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Pendiente al día" value={formatCOP(suma('pendiente'))} />
        <StatCard label="Vencida" value={formatCOP(suma('vencida'))} tone="danger" />
        <StatCard label="Recaudado" value={formatCOP(suma('pagada'))} tone="success" />
      </div>
      <Card title="Generar facturación mensual de arriendos" className="mb-4">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            generar.mutate(periodo, {
              onSuccess: (r) =>
                setMensaje(
                  r.length
                    ? `Se generaron ${r.length} facturas.`
                    : 'No hay facturas nuevas para ese periodo.',
                ),
            });
          }}
        >
          <Input
            label="Periodo"
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
          <Button type="submit" disabled={generar.isPending}>
            Generar
          </Button>
        </form>
        {mensaje && (
          <div className="mt-3">
            <Alert tone="success">{mensaje}</Alert>
          </div>
        )}
        {generar.error && (
          <div className="mt-3">
            <Alert tone="danger">{generar.error.message}</Alert>
          </div>
        )}
      </Card>
      <Card title="Facturas">
        <Select
          label="Estado"
          placeholder="Todas"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="mb-4 sm:max-w-xs"
          options={[
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'vencida', label: 'Vencida' },
            { value: 'pagada', label: 'Pagada' },
          ]}
        />
        <Table<FacturaResumen>
          caption="Facturas"
          rows={filas}
          rowKey={(f) => f.id}
          columns={[
            { header: 'Factura', cell: (f) => <span className="font-medium">{f.numero}</span> },
            { header: 'Cliente', cell: (f) => f.clienteNombre },
            { header: 'Contrato', cell: (f) => f.contratoNumero },
            { header: 'Periodo', cell: (f) => f.periodo },
            { header: 'Valor', cell: (f) => formatCOP(f.valor) },
            { header: 'Vence', cell: (f) => formatDate(f.fechaVencimiento) },
            {
              header: 'Estado',
              cell: (f) => (
                <Badge
                  tone={
                    f.estadoActual === 'pagada'
                      ? 'green'
                      : f.estadoActual === 'vencida'
                        ? 'red'
                        : 'amber'
                  }
                >
                  {f.estadoActual === 'vencida'
                    ? `Vencida (${f.diasMora} d)`
                    : f.estadoActual === 'pagada'
                      ? `Pagada ${formatDate(f.fechaPago)}`
                      : 'Pendiente'}
                </Badge>
              ),
            },
            {
              header: '',
              cell: (f) =>
                f.estadoActual !== 'pagada' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={pagar.isPending}
                    onClick={() => pagar.mutate({ id: f.id })}
                  >
                    Registrar pago
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </>
  );
}
