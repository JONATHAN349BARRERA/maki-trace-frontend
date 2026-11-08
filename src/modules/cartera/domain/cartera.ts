import { daysBetween } from '@/shared/lib/dates';
import type { EstadoFactura, Factura } from '../types';

export function estadoFactura(f: Pick<Factura, 'estado' | 'fechaVencimiento'>, now: Date = new Date()): {
  estado: EstadoFactura;
  diasMora: number;
} {
  if (f.estado === 'pagada') return { estado: 'pagada', diasMora: 0 };
  const dias = daysBetween(`${f.fechaVencimiento}T23:59:59`, now);
  return dias > 0 ? { estado: 'vencida', diasMora: dias } : { estado: 'pendiente', diasMora: 0 };
}

/** Rangos de antigüedad de cartera usados en el informe. */
export function rangoMora(dias: number) {
  if (dias <= 0) return 'Al día';
  if (dias <= 30) return '1–30 días';
  if (dias <= 60) return '31–60 días';
  if (dias <= 90) return '61–90 días';
  return 'Más de 90 días';
}

export const RANGOS_MORA = ['Al día', '1–30 días', '31–60 días', '61–90 días', 'Más de 90 días'];
