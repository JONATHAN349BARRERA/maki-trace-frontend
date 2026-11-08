export type Modalidad = 'arriendo' | 'posventa';
export type Componente = 'preventivo' | 'correctivo' | 'repuestos' | 'suministros';

export const MODALIDAD_LABEL: Record<Modalidad, string> = {
  arriendo: 'Arriendo con mantenimiento y repuestos',
  posventa: 'Posventa',
};

export const COMPONENTE_LABEL: Record<Componente, string> = {
  preventivo: 'Mantenimiento preventivo',
  correctivo: 'Mantenimiento correctivo',
  repuestos: 'Repuestos',
  suministros: 'Suministros',
};

export const COMPONENTES: Componente[] = ['preventivo', 'correctivo', 'repuestos', 'suministros'];

export interface Contrato {
  id: string;
  numero: string;
  clienteId: string;
  modalidad: Modalidad;
  fechaInicio: string;
  fechaFin: string;
  /** Arriendo: cuota mensual por equipo. Posventa: valor del contrato de servicio. */
  valor: number;
  componentes: Componente[];
  observaciones?: string;
}

export type ContratoInput = Omit<Contrato, 'id'>;

export type EstadoVigencia = 'vigente' | 'por_vencer' | 'vencido' | 'no_iniciado';

export interface ContratoResumen extends Contrato {
  clienteNombre: string;
  equipos: number;
  vigencia: EstadoVigencia;
  diasRestantes: number;
}
