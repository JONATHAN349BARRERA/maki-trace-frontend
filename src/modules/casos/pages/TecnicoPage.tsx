import { Link } from 'react-router';
import { MapPin, ScanLine } from 'lucide-react';
import { useUsuario } from '@/modules/auth/AuthContext';
import { formatDateTime } from '@/shared/lib/format';
import { Button, Card, Loading, PageHeader } from '@/shared/ui';
import { useCasos } from '../api';
import { EstadoCasoBadge } from '../components/EstadoCasoBadge';
import { ESTADOS_ABIERTOS } from '../domain/flujo';
import { TIPO_CASO_LABEL } from '../types';

/** Vista móvil del técnico: casos asignados y acceso al escáner QR. */
export function TecnicoPage() {
  const usuario = useUsuario();
  const { data, isLoading } = useCasos();
  if (isLoading) return <Loading />;
  const pendientes = (data ?? []).filter((c) => ESTADOS_ABIERTOS.includes(c.estado));
  const cerrados = (data ?? []).filter((c) => c.estado === 'cerrado').slice(0, 5);
  return (
    <>
      <PageHeader
        title="Mis casos"
        subtitle={usuario.nombre}
        actions={
          <Link to="/escanear">
            <Button>
              <ScanLine size={16} /> Escanear QR del equipo
            </Button>
          </Link>
        }
      />
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Pendientes ({pendientes.length})</h2>
      <div className="mb-6 space-y-3">
        {pendientes.length === 0 && <p className="text-sm text-slate-500">No tiene casos pendientes.</p>}
        {pendientes.map((c) => (
          <Link key={c.id} to={`/casos/${c.id}`} className="block">
            <Card className="transition hover:ring-brand-500">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.consecutivo}</p>
                  <p className="text-sm text-slate-600">
                    {TIPO_CASO_LABEL[c.tipo]} · {c.equipoModelo} ({c.equipoSerial})
                  </p>
                </div>
                <EstadoCasoBadge estado={c.estado} demorado={c.demorado} />
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                <MapPin size={14} /> {c.equipoUbicacion}
              </p>
              {c.fechaProgramada && <p className="text-xs text-slate-500">Programado: {formatDateTime(c.fechaProgramada)}</p>}
              <p className="mt-1 text-sm text-slate-700">{c.descripcion}</p>
            </Card>
          </Link>
        ))}
      </div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Últimos cerrados</h2>
      <ul className="space-y-1 text-sm">
        {cerrados.map((c) => (
          <li key={c.id}>
            <Link to={`/casos/${c.id}`} className="text-brand-600 hover:underline">
              {c.consecutivo}
            </Link>{' '}
            · {TIPO_CASO_LABEL[c.tipo]} · {c.clienteNombre}
          </li>
        ))}
      </ul>
    </>
  );
}
