export type TipoItem = 'repuesto' | 'suministro';
export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface Item {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoItem;
  costoUnitario: number;
  existencias: number;
  minimo: number;
  /** Modelos de equipo con los que es compatible. */
  modelosCompatibles: string[];
  /** Solo suministros: copias que rinde una unidad (p. ej. tóner). */
  rendimientoCopias?: number;
}

export type ItemInput = Omit<Item, 'id' | 'existencias'> & { existencias?: number };

export interface Movimiento {
  id: string;
  itemId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  costoUnitario: number;
  fecha: string;
  usuarioNombre: string;
  casoId?: string;
  equipoId?: string;
  nota?: string;
}

export interface MovimientoInput {
  itemId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  costoUnitario?: number;
  nota?: string;
}
