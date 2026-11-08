import { daysBetween } from '@/shared/lib/dates';
import { DIAS_ALERTA_VENCIMIENTO } from '@/modules/contratos/domain/vigencia';
import type { Equipo, LecturaContador } from '../types';

export const contadorActual = (lecturas: LecturaContador[]) =>
  lecturas.reduce((max, l) => (l.valor > max ? l.valor : max), 0);

export type EstadoGarantia = 'vigente' | 'por_vencer' | 'vencida';

export function estadoGarantia(e: Pick<Equipo, 'garantiaHasta'>, now: Date = new Date()): EstadoGarantia {
  const dias = daysBetween(now.toISOString(), `${e.garantiaHasta}T23:59:59`);
  if (dias < 0) return 'vencida';
  if (dias <= DIAS_ALERTA_VENCIMIENTO) return 'por_vencer';
  return 'vigente';
}

/** Ruta pública que codifica el QR pegado al equipo (asociado a su serial). */
export const rutaQR = (serial: string) => `/equipos/serial/${encodeURIComponent(serial)}`;

export const urlQR = (serial: string, origin: string = window.location.origin) => `${origin}${rutaQR(serial)}`;

/** Extrae el serial de lo leído por la cámara: acepta la URL del QR o el serial directo. */
export function serialDesdeQR(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  const m = limpio.match(/\/equipos\/serial\/([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);
  return /^[A-Za-z0-9-]{4,}$/.test(limpio) ? limpio : null;
}
