import { daysBetween } from '@/shared/lib/dates';
import type { Contrato, EstadoVigencia } from '../types';

/** Días de anticipación con que se alerta un vencimiento de contrato o garantía. */
export const DIAS_ALERTA_VENCIMIENTO = 30;

export function estadoVigencia(
  c: Pick<Contrato, 'fechaInicio' | 'fechaFin'>,
  now: Date = new Date(),
): { estado: EstadoVigencia; diasRestantes: number } {
  const diasRestantes = daysBetween(now.toISOString(), `${c.fechaFin}T23:59:59`);
  if (new Date(`${c.fechaInicio}T00:00:00`) > now) return { estado: 'no_iniciado', diasRestantes };
  if (diasRestantes < 0) return { estado: 'vencido', diasRestantes };
  if (diasRestantes <= DIAS_ALERTA_VENCIMIENTO) return { estado: 'por_vencer', diasRestantes };
  return { estado: 'vigente', diasRestantes };
}

export const VIGENCIA_LABEL: Record<EstadoVigencia, string> = {
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  no_iniciado: 'No iniciado',
};

export const VIGENCIA_TONE = {
  vigente: 'green',
  por_vencer: 'amber',
  vencido: 'red',
  no_iniciado: 'gray',
} as const;
