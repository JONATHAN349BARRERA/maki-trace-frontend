import type { Equipo } from '@/modules/equipos/types';
import { contadorActual } from '@/modules/equipos/domain/equipo';
import type { Item } from '../types';

/** Valida que el repuesto/suministro pedido corresponde al modelo del equipo (propuesta §3.2 módulo 4). */
export const esCompatible = (item: Pick<Item, 'modelosCompatibles'>, modelo: string) =>
  item.modelosCompatibles.includes(modelo);

export interface AnalisisConsumo {
  anomalo: boolean;
  copiasDesdeUltimaEntrega: number;
  unidadesJustificadas: number;
  mensaje?: string;
}

/** Unidades adicionales de holgura que se permiten sobre lo justificado por el uso. */
export const HOLGURA_UNIDADES = 1;

/**
 * Consumo coherente con el uso (propuesta §4.3, tendencia 2): si en el periodo se
 * imprimieron 1.000 copias y el tóner rinde 20.000, pedir 3 tóneres es anómalo.
 *
 * Las copias se cuentan desde la última entrega de ese suministro al equipo (o
 * desde la instalación si nunca se ha entregado).
 */
export function analizarConsumo(
  item: Pick<Item, 'nombre' | 'rendimientoCopias'>,
  equipo: Pick<Equipo, 'lecturas'>,
  cantidadSolicitada: number,
  contadorUltimaEntrega: number | null,
): AnalisisConsumo {
  const actual = contadorActual(equipo.lecturas);
  const base = contadorUltimaEntrega ?? Math.min(...equipo.lecturas.map((l) => l.valor), actual);
  const copias = Math.max(0, actual - base);

  if (!item.rendimientoCopias) {
    return {
      anomalo: false,
      copiasDesdeUltimaEntrega: copias,
      unidadesJustificadas: cantidadSolicitada,
    };
  }
  const justificadas = Math.ceil(copias / item.rendimientoCopias) + HOLGURA_UNIDADES;
  const anomalo = cantidadSolicitada > justificadas;
  return {
    anomalo,
    copiasDesdeUltimaEntrega: copias,
    unidadesJustificadas: justificadas,
    mensaje: anomalo
      ? `Consumo anómalo de ${item.nombre}: se solicitan ${cantidadSolicitada} unidades, pero desde la última entrega solo se registran ${copias.toLocaleString('es-CO')} copias (rendimiento ${item.rendimientoCopias.toLocaleString('es-CO')} por unidad; justificadas: ${justificadas}).`
      : undefined,
  };
}
