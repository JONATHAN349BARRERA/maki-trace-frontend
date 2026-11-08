export type TipoCaso = 'falla' | 'mantenimiento' | 'repuesto' | 'suministro';
export type EstadoCaso =
  'registrado' | 'aprobado' | 'asignado' | 'en_atencion' | 'cerrado' | 'rechazado';

export const TIPO_CASO_LABEL: Record<TipoCaso, string> = {
  falla: 'Falla',
  mantenimiento: 'Mantenimiento',
  repuesto: 'Repuestos',
  suministro: 'Suministros',
};

export const ESTADO_CASO_LABEL: Record<EstadoCaso, string> = {
  registrado: 'Registrado',
  aprobado: 'Aprobado',
  asignado: 'Asignado',
  en_atencion: 'En atención',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
};

export interface ItemCantidad {
  itemId: string;
  cantidad: number;
}

export interface EventoBitacora {
  fecha: string;
  estado: EstadoCaso;
  usuarioId: string;
  usuarioNombre: string;
  nota?: string;
}

export interface TrabajoRealizado {
  descripcion: string;
  contador?: number;
  itemsUsados: ItemCantidad[];
  inicio?: string;
  fin?: string;
}

export interface Advertencia {
  codigo:
    'sin_cobertura' | 'incompatible' | 'consumo_anomalo' | 'sin_existencias' | 'garantia_vencida';
  mensaje: string;
}

export interface Caso {
  id: string;
  consecutivo: string;
  equipoId: string;
  contratoId: string | null;
  clienteId: string;
  tipo: TipoCaso;
  descripcion: string;
  estado: EstadoCaso;
  itemsSolicitados: ItemCantidad[];
  tecnicoId?: string;
  fechaProgramada?: string;
  creadoEn: string;
  actualizadoEn: string;
  bitacora: EventoBitacora[];
  trabajo?: TrabajoRealizado;
  /** Advertencias que el gestor aceptó explícitamente al aprobar. */
  advertenciasAceptadas?: Advertencia[];
  costoTotal?: number;
}

export interface CasoDetalle extends Caso {
  clienteNombre: string;
  equipoSerial: string;
  equipoModelo: string;
  equipoUbicacion: string;
  contratoNumero?: string;
  tecnicoNombre?: string;
  demorado: boolean;
}

export interface NuevaSolicitud {
  equipoId: string;
  tipo: TipoCaso;
  descripcion: string;
  itemsSolicitados: ItemCantidad[];
}
