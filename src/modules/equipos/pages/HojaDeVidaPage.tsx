import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Pencil, Send } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { useCasos } from '@/modules/casos/api';
import { CasosTable } from '@/modules/casos/components/CasosTable';
import { ESTADOS_ABIERTOS } from '@/modules/casos/domain/flujo';
import { useItems } from '@/modules/inventario/api';
import { formatDate, formatDateTime, formatNumber } from '@/shared/lib/format';
import { Alert, Badge, Button, Card, DescriptionList, ErrorState, Input, Loading, PageHeader, Table } from '@/shared/ui';
import { useEquipo, useRegistrarLectura } from '../api';
import { EquipoQR } from '../components/EquipoQR';
import { FotosEquipo } from '../components/FotosEquipo';
import { HistorialEquipo } from '../components/HistorialEquipo';
import { estadoGarantia } from '../domain/equipo';
import type { EquipoResumen } from '../types';

function LecturaForm({ equipo }: { equipo: EquipoResumen }) {
  const [valor, setValor] = useState('');
  const registrar = useRegistrarLectura(equipo.id);
  return (
    <form
      className="mt-3 flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        registrar.mutate(Number(valor), { onSuccess: () => setValor('') });
      }}
    >
      <Input label="Nueva lectura" type="number" min={equipo.contadorActual} value={valor} onChange={(e) => setValor(e.target.value)} className="flex-1" />
      <Button type="submit" size="sm" disabled={!valor || registrar.isPending}>
        Registrar
      </Button>
      {registrar.error && <Alert tone="danger">{registrar.error.message}</Alert>}
    </form>
  );
}

/** Hoja de vida del equipo: lo que ve el técnico al escanear el QR. */
export function HojaDeVida({ equipo }: { equipo: EquipoResumen }) {
  const { puede, usuario } = useAuth();
  const casos = useCasos({ equipoId: equipo.id });
  const compatibles = useItems(equipo.modelo);
  const garantia = estadoGarantia(equipo);
  const verCostos = usuario?.rol === 'gerente' || usuario?.rol === 'gestor';
  const pendientes = (casos.data ?? []).filter((c) => ESTADOS_ABIERTOS.includes(c.estado));
  const ultimoMant = [...equipo.historial].filter((h) => h.tipo === 'Mantenimiento').sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

  return (
    <>
      <PageHeader
        backTo={usuario?.rol === 'tecnico' ? '/tecnico' : '/equipos'}
        title={`${equipo.marca} ${equipo.modelo}`}
        subtitle={`Serial ${equipo.serial} · ${equipo.ubicacion}`}
        actions={
          <>
            {puede('casos:crear') && (
              <Link to={`${usuario?.rol === 'cliente' ? '/portal/solicitud' : '/casos/nuevo'}?equipoId=${equipo.id}`}>
                <Button variant="secondary">
                  <Send size={16} /> Solicitar servicio
                </Button>
              </Link>
            )}
            {puede('equipos:editar') && (
              <Link to={`/equipos/${equipo.id}/editar`}>
                <Button variant="secondary">
                  <Pencil size={16} /> Editar
                </Button>
              </Link>
            )}
          </>
        }
      />
      {/* Resumen rápido para el técnico en sitio */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <p className="text-xs uppercase text-slate-500">Último mantenimiento</p>
          <p className="mt-1 text-sm font-semibold">{ultimoMant ? formatDate(ultimoMant.fecha) : 'Sin registro'}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">Casos pendientes</p>
          <p className="mt-1 text-sm font-semibold">{pendientes.length}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">Contador</p>
          <p className="mt-1 text-sm font-semibold">{formatNumber(equipo.contadorActual)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">Garantía</p>
          <p className="mt-1">
            <Badge tone={garantia === 'vigente' ? 'green' : garantia === 'por_vencer' ? 'amber' : 'gray'}>
              {garantia === 'vigente' ? 'Vigente' : garantia === 'por_vencer' ? 'Por vencer' : 'Vencida'} · {formatDate(equipo.garantiaHasta)}
            </Badge>
          </p>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Características y capacidades">
            <DescriptionList
              items={[
                { label: 'Características', value: equipo.caracteristicas },
                {
                  label: 'Contrato asociado',
                  value: equipo.contratoId ? (
                    <Link className="text-brand-600 hover:underline" to={`/contratos/${equipo.contratoId}`}>
                      {equipo.contratoNumero}
                    </Link>
                  ) : (
                    'Sin contrato'
                  ),
                },
                { label: 'Cliente', value: equipo.clienteNombre ?? '—' },
                { label: 'Instalación', value: formatDate(equipo.fechaInstalacion) },
                { label: 'Velocidad', value: `${equipo.capacidades.ppm} ppm` },
                { label: 'Color', value: equipo.capacidades.color ? 'Sí' : 'No (monocromático)' },
                { label: 'Dúplex / escáner', value: `${equipo.capacidades.duplex ? 'Dúplex' : 'Simplex'} · ${equipo.capacidades.escaner ? 'Con escáner' : 'Sin escáner'}` },
                { label: 'Formatos', value: equipo.capacidades.formatos.join(', ') },
              ]}
            />
          </Card>
          <Card title="Historial de servicios y repuestos">
            <HistorialEquipo historial={equipo.historial} verCostos={verCostos} />
          </Card>
          <Card title="Casos del equipo">
            <CasosTable casos={casos.data ?? []} mostrarCliente={false} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Código QR">
            <EquipoQR serial={equipo.serial} modelo={equipo.modelo} />
          </Card>
          <Card title="Fotos">
            <FotosEquipo equipoId={equipo.id} fotos={equipo.fotos} editable={usuario?.rol !== 'cliente'} />
          </Card>
          <Card title="Repuestos y suministros que usa">
            <ul className="space-y-1 text-sm">
              {(compatibles.data ?? []).map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span>{i.nombre}</span>
                  <span className="text-xs text-slate-500">{i.codigo}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Lecturas del contador">
            <Table
              rows={[...equipo.lecturas].reverse().slice(0, 6)}
              rowKey={(l) => l.fecha + l.valor}
              columns={[
                { header: 'Fecha', cell: (l) => formatDateTime(l.fecha) },
                { header: 'Copias', cell: (l) => formatNumber(l.valor) },
                { header: 'Fuente', cell: (l) => l.fuente },
              ]}
            />
            <LecturaForm equipo={equipo} />
          </Card>
        </div>
      </div>
    </>
  );
}

export function HojaDeVidaPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useEquipo(id);
  if (isLoading) return <Loading />;
  if (error || !data) return <ErrorState error={error} />;
  return <HojaDeVida equipo={data} />;
}
