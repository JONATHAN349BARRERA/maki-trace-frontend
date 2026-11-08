import { useState } from 'react';
import { useUsuario } from '@/modules/auth/AuthContext';
import { useEquipo } from '@/modules/equipos/api';
import { useItems } from '@/modules/inventario/api';
import { useTecnicos } from '@/modules/personal/api';
import { formatNumber } from '@/shared/lib/format';
import { Alert, Button, Checkbox, Input, Loading, Modal, Select, Textarea } from '@/shared/ui';
import { casosApi, useAccionCaso, useValidacionCaso } from '../api';
import { accionesDisponibles } from '../domain/flujo';
import type { CasoDetalle, ItemCantidad } from '../types';
import { ItemsSelector } from './ItemsSelector';

type Dialogo = 'aprobar' | 'rechazar' | 'asignar' | 'cerrar' | null;

/**
 * Criterio de aceptación 1: antes de aprobar se consulta la cobertura del contrato
 * y demás validaciones; si hay advertencias, el gestor debe confirmarlas.
 */
function AprobarDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const validacion = useValidacionCaso(caso.id, true);
  const [confirmado, setConfirmado] = useState(false);
  const [nota, setNota] = useState('');
  const aprobar = useAccionCaso(() =>
    casosApi.aprobar(caso.id, { confirmarAdvertencias: confirmado, nota: nota || undefined }),
  );
  const advertencias = validacion.data ?? [];
  return (
    <Modal
      open
      title={`Aprobar ${caso.consecutivo}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={
              validacion.isLoading || (advertencias.length > 0 && !confirmado) || aprobar.isPending
            }
            onClick={() => aprobar.mutate(undefined, { onSuccess: onClose })}
          >
            Aprobar caso
          </Button>
        </>
      }
    >
      {validacion.isLoading ? (
        <Loading label="Verificando cobertura del contrato…" />
      ) : advertencias.length === 0 ? (
        <Alert tone="success" title="Sin observaciones">
          Lo solicitado está cubierto por el contrato y es coherente con el equipo.
        </Alert>
      ) : (
        <>
          <Alert tone="warning" title="Advertencias antes de aprobar">
            <ul className="list-disc space-y-1 pl-4">
              {advertencias.map((a) => (
                <li key={a.codigo + a.mensaje}>{a.mensaje}</li>
              ))}
            </ul>
          </Alert>
          <Checkbox
            label="Entiendo las advertencias y apruebo el caso de todas formas"
            checked={confirmado}
            onChange={(e) => setConfirmado(e.target.checked)}
          />
        </>
      )}
      <Textarea
        label="Observación (opcional)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />
      {aprobar.error && <Alert tone="danger">{aprobar.error.message}</Alert>}
    </Modal>
  );
}

function RechazarDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const [nota, setNota] = useState('');
  const rechazar = useAccionCaso(() => casosApi.rechazar(caso.id, nota));
  return (
    <Modal
      open
      title={`Rechazar ${caso.consecutivo}`}
      onClose={onClose}
      footer={
        <Button
          variant="danger"
          disabled={!nota.trim() || rechazar.isPending}
          onClick={() => rechazar.mutate(undefined, { onSuccess: onClose })}
        >
          Rechazar
        </Button>
      }
    >
      <Textarea label="Motivo del rechazo" value={nota} onChange={(e) => setNota(e.target.value)} />
      {rechazar.error && <Alert tone="danger">{rechazar.error.message}</Alert>}
    </Modal>
  );
}

function AsignarDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const tecnicos = useTecnicos();
  const [tecnicoId, setTecnicoId] = useState(caso.tecnicoId ?? '');
  const [fecha, setFecha] = useState(caso.fechaProgramada ?? '');
  const asignar = useAccionCaso(() =>
    casosApi.asignar(caso.id, { tecnicoId, fechaProgramada: fecha || undefined }),
  );
  return (
    <Modal
      open
      title={`Asignar técnico · ${caso.consecutivo}`}
      onClose={onClose}
      footer={
        <Button
          disabled={!tecnicoId || asignar.isPending}
          onClick={() => asignar.mutate(undefined, { onSuccess: onClose })}
        >
          Asignar
        </Button>
      }
    >
      <p className="text-sm text-slate-600">Ubicación del equipo: {caso.equipoUbicacion}</p>
      <Select
        label="Técnico"
        placeholder="Seleccione…"
        value={tecnicoId}
        onChange={(e) => setTecnicoId(e.target.value)}
        options={(tecnicos.data ?? [])
          .filter((t) => t.activo)
          .map((t) => ({ value: t.id, label: `${t.nombre} · ${t.zona}` }))}
      />
      <Input
        label="Fecha y hora programada"
        type="datetime-local"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      {asignar.error && <Alert tone="danger">{asignar.error.message}</Alert>}
    </Modal>
  );
}

/** Registro del trabajo realizado y de los repuestos usados, y cierre del caso. */
export function CerrarDialog({ caso, onClose }: { caso: CasoDetalle; onClose: () => void }) {
  const equipo = useEquipo(caso.equipoId);
  const items = useItems(equipo.data?.modelo);
  const contadorActual = equipo.data?.contadorActual;
  const [descripcion, setDescripcion] = useState('');
  const [contador, setContador] = useState<string>('');
  const [usados, setUsados] = useState<ItemCantidad[]>(caso.itemsSolicitados);
  const cerrar = useAccionCaso(() =>
    casosApi.cerrar(caso.id, {
      descripcion,
      contador: contador ? Number(contador) : undefined,
      itemsUsados: usados,
    }),
  );
  return (
    <Modal
      open
      title={`Registrar trabajo y cerrar · ${caso.consecutivo}`}
      onClose={onClose}
      footer={
        <Button
          disabled={!descripcion.trim() || cerrar.isPending}
          onClick={() => cerrar.mutate(undefined, { onSuccess: onClose })}
        >
          Cerrar caso
        </Button>
      }
    >
      <Textarea
        label="Trabajo realizado"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <Input
        label="Contador de copias actual"
        type="number"
        min={contadorActual ?? 0}
        hint={
          contadorActual !== undefined
            ? `Último registrado: ${formatNumber(contadorActual)}`
            : undefined
        }
        value={contador}
        onChange={(e) => setContador(e.target.value)}
      />
      <ItemsSelector
        label="Repuestos y suministros entregados"
        items={items.data ?? []}
        value={usados}
        onChange={setUsados}
        mostrarExistencias
      />
      <p className="text-xs text-slate-500">
        Al cerrar, el servicio y los ítems entregados quedan en la hoja de vida del equipo y se
        descuentan del inventario.
      </p>
      {cerrar.error && <Alert tone="danger">{cerrar.error.message}</Alert>}
    </Modal>
  );
}

export function AccionesCaso({ caso }: { caso: CasoDetalle }) {
  const usuario = useUsuario();
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const iniciar = useAccionCaso(() => casosApi.iniciar(caso.id));
  // Un técnico solo puede actuar sobre los casos asignados a él.
  const esSuyo = usuario.rol !== 'tecnico' || caso.tecnicoId === usuario.tecnicoId;
  const acciones = esSuyo ? accionesDisponibles(caso.estado, usuario.rol) : [];
  if (acciones.length === 0) return null;
  const cerrar = () => setDialogo(null);
  return (
    <div className="flex flex-wrap gap-2">
      {acciones.includes('aprobar') && (
        <Button onClick={() => setDialogo('aprobar')}>Aprobar</Button>
      )}
      {acciones.includes('rechazar') && (
        <Button variant="secondary" onClick={() => setDialogo('rechazar')}>
          Rechazar
        </Button>
      )}
      {acciones.includes('asignar') && (
        <Button
          variant={caso.estado === 'aprobado' ? 'primary' : 'secondary'}
          onClick={() => setDialogo('asignar')}
        >
          {caso.estado === 'asignado' ? 'Reasignar técnico' : 'Asignar técnico'}
        </Button>
      )}
      {acciones.includes('iniciar') && (
        <Button disabled={iniciar.isPending} onClick={() => iniciar.mutate(undefined)}>
          Iniciar atención
        </Button>
      )}
      {acciones.includes('cerrar') && (
        <Button onClick={() => setDialogo('cerrar')}>Registrar trabajo y cerrar</Button>
      )}
      {iniciar.error && <Alert tone="danger">{iniciar.error.message}</Alert>}
      {dialogo === 'aprobar' && <AprobarDialog caso={caso} onClose={cerrar} />}
      {dialogo === 'rechazar' && <RechazarDialog caso={caso} onClose={cerrar} />}
      {dialogo === 'asignar' && <AsignarDialog caso={caso} onClose={cerrar} />}
      {dialogo === 'cerrar' && <CerrarDialog caso={caso} onClose={cerrar} />}
    </div>
  );
}
