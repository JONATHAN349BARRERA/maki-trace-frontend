import { Link } from 'react-router';
import { Send } from 'lucide-react';
import { useUsuario } from '@/modules/auth/AuthContext';
import { useContratos } from '@/modules/contratos/api';
import { ComponentesList } from '@/modules/contratos/components/ComponentesList';
import { VigenciaBadge } from '@/modules/contratos/components/VigenciaBadge';
import { useEquipos } from '@/modules/equipos/api';
import { formatDate } from '@/shared/lib/format';
import { Button, Card, Loading, PageHeader, StatCard } from '@/shared/ui';
import { useCasos } from '../api';
import { CasosTable } from '../components/CasosTable';
import { ESTADOS_ABIERTOS } from '../domain/flujo';

/** Vista del cliente: sus contratos, equipos y el estado de sus solicitudes. */
export function PortalClientePage() {
  const usuario = useUsuario();
  const contratos = useContratos();
  const equipos = useEquipos();
  const casos = useCasos();
  if (contratos.isLoading || casos.isLoading) return <Loading />;
  const abiertos = (casos.data ?? []).filter((c) => ESTADOS_ABIERTOS.includes(c.estado));
  return (
    <>
      <PageHeader
        title={`Hola, ${usuario.nombre.split(' ')[0]}`}
        subtitle="Consulte sus contratos y el estado de sus solicitudes"
        actions={
          <Link to="/portal/solicitud">
            <Button>
              <Send size={16} /> Nueva solicitud
            </Button>
          </Link>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Contratos" value={contratos.data?.length ?? 0} />
        <StatCard label="Equipos" value={equipos.data?.length ?? 0} />
        <StatCard label="Solicitudes abiertas" value={abiertos.length} tone={abiertos.length ? 'warning' : 'default'} />
      </div>
      <Card title="Solicitudes en curso" className="mb-4">
        <CasosTable casos={abiertos} mostrarCliente={false} />
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {(contratos.data ?? []).map((c) => (
          <Card
            key={c.id}
            title={
              <Link to={`/contratos/${c.id}`} className="hover:underline">
                Contrato {c.numero}
              </Link>
            }
            actions={<VigenciaBadge estado={c.vigencia} dias={c.diasRestantes} />}
          >
            <p className="mb-3 text-sm text-slate-600">
              {c.modalidad === 'arriendo' ? 'Arriendo' : 'Posventa'} · {formatDate(c.fechaInicio)} – {formatDate(c.fechaFin)} · {c.equipos} equipo(s)
            </p>
            <ComponentesList componentes={c.componentes} />
          </Card>
        ))}
      </div>
    </>
  );
}
