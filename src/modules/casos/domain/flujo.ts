import type { Rol } from '@/modules/auth/types';
import type { EstadoCaso } from '../types';

/**
 * Flujo de estados del caso (propuesta §8.1): registrado → aprobado → asignado →
 * en atención → cerrado. Un caso registrado también puede rechazarse.
 */
export type Accion = 'aprobar' | 'rechazar' | 'asignar' | 'iniciar' | 'cerrar';

const TRANSICIONES: Record<Accion, { desde: EstadoCaso[]; hacia: EstadoCaso; roles: Rol[] }> = {
  aprobar: { desde: ['registrado'], hacia: 'aprobado', roles: ['gestor', 'gerente'] },
  rechazar: { desde: ['registrado'], hacia: 'rechazado', roles: ['gestor', 'gerente'] },
  asignar: { desde: ['aprobado', 'asignado'], hacia: 'asignado', roles: ['gestor', 'gerente'] },
  iniciar: { desde: ['asignado'], hacia: 'en_atencion', roles: ['tecnico', 'gestor'] },
  cerrar: { desde: ['en_atencion'], hacia: 'cerrado', roles: ['tecnico', 'gestor'] },
};

export const puedeTransicionar = (estado: EstadoCaso, accion: Accion, rol?: Rol) => {
  const t = TRANSICIONES[accion];
  return t.desde.includes(estado) && (rol === undefined || t.roles.includes(rol));
};

export const siguienteEstado = (estado: EstadoCaso, accion: Accion): EstadoCaso => {
  if (!puedeTransicionar(estado, accion)) {
    throw new Error(`No se puede ${accion} un caso en estado ${estado}.`);
  }
  return TRANSICIONES[accion].hacia;
};

export const accionesDisponibles = (estado: EstadoCaso, rol: Rol): Accion[] =>
  (Object.keys(TRANSICIONES) as Accion[]).filter((a) => puedeTransicionar(estado, a, rol));

export const ESTADOS_ABIERTOS: EstadoCaso[] = ['registrado', 'aprobado', 'asignado', 'en_atencion'];
export const ORDEN_ESTADOS: EstadoCaso[] = [
  'registrado',
  'aprobado',
  'asignado',
  'en_atencion',
  'cerrado',
];

export const ESTADO_TONE = {
  registrado: 'gray',
  aprobado: 'blue',
  asignado: 'purple',
  en_atencion: 'amber',
  cerrado: 'green',
  rechazado: 'red',
} as const;

/** Consecutivo legible: CASO-2026-0007. */
export const formatearConsecutivo = (anio: number, n: number) =>
  `CASO-${anio}-${String(n).padStart(4, '0')}`;
