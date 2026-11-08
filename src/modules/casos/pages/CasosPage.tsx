import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { Button, Card, Checkbox, ErrorState, Input, Loading, PageHeader, Select } from '@/shared/ui';
import { useCasos } from '../api';
import { CasosTable } from '../components/CasosTable';
import { ESTADO_CASO_LABEL, TIPO_CASO_LABEL, type EstadoCaso } from '../types';

export function CasosPage() {
  const { usuario, puede } = useAuth();
  const [estado, setEstado] = useState<EstadoCaso | ''>('');
  const [tipo, setTipo] = useState('');
  const [texto, setTexto] = useState('');
  const [soloDemorados, setSoloDemorados] = useState(false);
  const { data, isLoading, error } = useCasos(estado ? { estado } : {});

  const filas = useMemo(
    () =>
      (data ?? []).filter(
        (c) =>
          (!tipo || c.tipo === tipo) &&
          (!soloDemorados || c.demorado) &&
          `${c.consecutivo} ${c.clienteNombre} ${c.equipoSerial}`.toLowerCase().includes(texto.toLowerCase()),
      ),
    [data, tipo, soloDemorados, texto],
  );

  return (
    <>
      <PageHeader
        title={usuario?.rol === 'cliente' ? 'Mis solicitudes' : 'Casos de servicio'}
        subtitle="Cada solicitud es un caso con consecutivo y trazabilidad de cada paso"
        actions={
          puede('casos:crear') && (
            <Link to={usuario?.rol === 'cliente' ? '/portal/solicitud' : '/casos/nuevo'}>
              <Button>
                <Plus size={16} /> Nueva solicitud
              </Button>
            </Link>
          )
        }
      />
      <Card>
        <div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-4">
          <Input label="Buscar" placeholder="Consecutivo, cliente o serial" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <Select
            label="Estado"
            placeholder="Todos"
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoCaso | '')}
            options={Object.entries(ESTADO_CASO_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Tipo"
            placeholder="Todos"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            options={Object.entries(TIPO_CASO_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <Checkbox label="Solo demorados" checked={soloDemorados} onChange={(e) => setSoloDemorados(e.target.checked)} />
        </div>
        {isLoading ? <Loading /> : error ? <ErrorState error={error} /> : <CasosTable casos={filas} mostrarCliente={usuario?.rol !== 'cliente'} />}
      </Card>
    </>
  );
}
