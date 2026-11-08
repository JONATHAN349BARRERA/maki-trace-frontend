import type { TipoCaso } from '@/modules/casos/types';
import type { Componente, Contrato } from '../types';
import { estadoVigencia } from './vigencia';

/** Qué componente del contrato debe cubrir cada tipo de solicitud. */
export const COMPONENTE_POR_TIPO: Record<TipoCaso, Componente> = {
  falla: 'correctivo',
  mantenimiento: 'preventivo',
  repuesto: 'repuestos',
  suministro: 'suministros',
};

export interface ResultadoCobertura {
  cubierto: boolean;
  componente: Componente;
  motivo?: string;
}

/**
 * Verifica si el contrato cubre lo solicitado (propuesta §3.2 módulo 1: "esto
 * define hasta dónde puede solicitar el cliente").
 */
export function verificarCobertura(
  contrato: Contrato | undefined | null,
  tipo: TipoCaso,
  now: Date = new Date(),
): ResultadoCobertura {
  const componente = COMPONENTE_POR_TIPO[tipo];
  if (!contrato) {
    return { cubierto: false, componente, motivo: 'El equipo no tiene un contrato asociado.' };
  }
  const { estado } = estadoVigencia(contrato, now);
  if (estado === 'vencido') {
    return { cubierto: false, componente, motivo: `El contrato ${contrato.numero} está vencido.` };
  }
  if (estado === 'no_iniciado') {
    return {
      cubierto: false,
      componente,
      motivo: `El contrato ${contrato.numero} aún no ha iniciado.`,
    };
  }
  if (!contrato.componentes.includes(componente)) {
    return {
      cubierto: false,
      componente,
      motivo: `El contrato ${contrato.numero} no incluye ${componente}.`,
    };
  }
  return { cubierto: true, componente };
}
