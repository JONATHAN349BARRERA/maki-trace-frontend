import { hoursBetween } from '@/shared/lib/dates';
import type { Caso, TipoCaso } from '../types';
import { ESTADOS_ABIERTOS } from './flujo';

/** Tiempo máximo de atención (horas) por tipo de solicitud antes de considerarse demorado. */
export const SLA_HORAS: Record<TipoCaso, number> = {
  falla: 24,
  repuesto: 48,
  suministro: 48,
  mantenimiento: 72,
};

export function horasAbierto(caso: Pick<Caso, 'creadoEn'>, now: Date = new Date()) {
  return hoursBetween(caso.creadoEn, now);
}

/** Criterio de aceptación 4: el informe de casos indica cuáles están demorados. */
export function estaDemorado(caso: Pick<Caso, 'estado' | 'tipo' | 'creadoEn'>, now: Date = new Date()) {
  if (!ESTADOS_ABIERTOS.includes(caso.estado)) return false;
  return horasAbierto(caso, now) > SLA_HORAS[caso.tipo];
}

/** Horas desde la asignación hasta el cierre (tiempo de atención del técnico). */
export function tiempoAtencionHoras(caso: Pick<Caso, 'bitacora'>): number | null {
  const asignado = caso.bitacora.find((e) => e.estado === 'asignado');
  const cerrado = caso.bitacora.find((e) => e.estado === 'cerrado');
  if (!asignado || !cerrado) return null;
  return hoursBetween(asignado.fecha, cerrado.fecha);
}

/** Horas desde el registro hasta el cierre (tiempo total de solución). */
export function tiempoSolucionHoras(caso: Pick<Caso, 'creadoEn' | 'bitacora'>): number | null {
  const cerrado = caso.bitacora.find((e) => e.estado === 'cerrado');
  return cerrado ? hoursBetween(caso.creadoEn, cerrado.fecha) : null;
}
