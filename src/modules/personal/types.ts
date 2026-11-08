export interface Tecnico {
  id: string;
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  zona: string;
  especialidad: string;
  activo: boolean;
}

export type TecnicoInput = Omit<Tecnico, 'id'>;

export interface Labor {
  casoId: string;
  consecutivo: string;
  tipo: string;
  estado: string;
  clienteNombre: string;
  /** Dónde: ubicación del equipo atendido. */
  ubicacion: string;
  equipoSerial: string;
  /** Cuándo. */
  fechaProgramada?: string;
  inicio?: string;
  fin?: string;
  /** Qué hizo. */
  descripcion?: string;
  horasAtencion: number | null;
}

export interface TecnicoDetalle extends Tecnico {
  labores: Labor[];
  casosAbiertos: number;
  casosCerrados: number;
  promedioHorasAtencion: number | null;
}
