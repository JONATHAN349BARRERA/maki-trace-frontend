import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { useAuth } from '@/modules/auth/AuthContext';
import { formatNumber } from '@/shared/lib/format';
import { Badge, Button, Card, ErrorState, Input, Loading, PageHeader, Table } from '@/shared/ui';
import { useEquipos } from '../api';
import { estadoGarantia } from '../domain/equipo';
import type { EquipoResumen } from '../types';

export function EquiposPage() {
  const { data, isLoading, error } = useEquipos();
  const { puede, usuario } = useAuth();
  const [texto, setTexto] = useState('');
  const filas = useMemo(
    () =>
      (data ?? []).filter((e) =>
        `${e.serial} ${e.modelo} ${e.clienteNombre ?? ''} ${e.ubicacion}`.toLowerCase().includes(texto.toLowerCase()),
      ),
    [data, texto],
  );
  return (
    <>
      <PageHeader
        title={usuario?.rol === 'cliente' ? 'Mis equipos' : 'Equipos'}
        subtitle="Hoja de vida de cada multifuncional"
        actions={
          puede('equipos:editar') && (
            <Link to="/equipos/nuevo">
              <Button>
                <Plus size={16} /> Nuevo equipo
              </Button>
            </Link>
          )
        }
      />
      <Card>
        <Input label="Buscar" placeholder="Serial, modelo, cliente o ubicación" value={texto} onChange={(e) => setTexto(e.target.value)} className="mb-4 sm:max-w-sm" />
        {isLoading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <Table<EquipoResumen>
            caption="Equipos"
            rows={filas}
            rowKey={(e) => e.id}
            columns={[
              {
                header: 'Serial',
                cell: (e) => (
                  <Link to={`/equipos/${e.id}`} className="font-medium text-brand-600 hover:underline">
                    {e.serial}
                  </Link>
                ),
              },
              { header: 'Modelo', cell: (e) => `${e.marca} ${e.modelo}` },
              { header: 'Cliente', cell: (e) => e.clienteNombre ?? <span className="text-slate-400">Sin asignar</span> },
              { header: 'Contrato', cell: (e) => e.contratoNumero ?? '—' },
              { header: 'Ubicación', cell: (e) => e.ubicacion, className: 'px-4 py-2 text-slate-700' },
              { header: 'Contador', cell: (e) => formatNumber(e.contadorActual) },
              {
                header: 'Garantía',
                cell: (e) => {
                  const g = estadoGarantia(e);
                  return <Badge tone={g === 'vigente' ? 'green' : g === 'por_vencer' ? 'amber' : 'gray'}>{g === 'vigente' ? 'Vigente' : g === 'por_vencer' ? 'Por vencer' : 'Vencida'}</Badge>;
                },
              },
              { header: 'Casos abiertos', cell: (e) => e.casosAbiertos },
            ]}
          />
        )}
      </Card>
    </>
  );
}
