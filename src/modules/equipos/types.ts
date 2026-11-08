export interface Capacidades {
  ppm: number;
  color: boolean;
  duplex: boolean;
  escaner: boolean;
  formatos: string[];
}

export interface LecturaContador {
  fecha: string;
  valor: number;
  fuente: 'tecnico' | 'cliente' | 'instalacion';
}

export interface ItemHistorial {
  itemId: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

/** Entrada de la hoja de vida generada al cerrar un caso (criterio de aceptación 2). */
export interface EventoHistorial {
  id: string;
  fecha: string;
  casoId: string;
  consecutivo: string;
  tipo: string;
  descripcion: string;
  tecnicoNombre?: string;
  items: ItemHistorial[];
  costo: number;
}

export interface Equipo {
  id: string;
  serial: string;
  marca: string;
  modelo: string;
  caracteristicas: string;
  capacidades: Capacidades;
  fotos: string[];
  contratoId: string | null;
  clienteId: string | null;
  ubicacion: string;
  fechaInstalacion: string;
  garantiaHasta: string;
  lecturas: LecturaContador[];
  historial: EventoHistorial[];
}

export type EquipoInput = Omit<Equipo, 'id' | 'fotos' | 'historial' | 'lecturas' | 'clienteId'> & {
  contadorInicial?: number;
};

export interface EquipoResumen extends Equipo {
  clienteNombre?: string;
  contratoNumero?: string;
  contadorActual: number;
  casosAbiertos: number;
}
