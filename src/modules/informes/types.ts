import type { CasoDetalle, EstadoCaso, TipoCaso } from '@/modules/casos/types';
import type { EstadoVigencia, Modalidad } from '@/modules/contratos/types';
import type { TipoItem } from '@/modules/inventario/types';

export interface InformeCasos {
  porEstado: { estado: EstadoCaso; cantidad: number }[];
  porTipo: { tipo: TipoCaso; cantidad: number }[];
  casos: (CasoDetalle & { horasAbierto: number })[];
  demorados: number;
  abiertos: number;
  promedioHorasSolucion: number | null;
}

export interface FilaPersonal {
  tecnicoId: string;
  nombre: string;
  zona: string;
  asignados: number;
  abiertos: number;
  cerrados: number;
  promedioHorasAtencion: number | null;
  costoEntregado: number;
}

export interface FilaInventario {
  itemId: string;
  codigo: string;
  nombre: string;
  tipo: TipoItem;
  existencias: number;
  minimo: number;
  bajoMinimo: boolean;
  salidas90: number;
  diasCobertura: number | null;
  valorExistencias: number;
}

export interface InformeInventario {
  filas: FilaInventario[];
  valorTotal: number;
  bajoMinimo: number;
}

export interface FilaContrato {
  contratoId: string;
  numero: string;
  clienteNombre: string;
  modalidad: Modalidad;
  vigencia: EstadoVigencia;
  equipos: number;
  casos: number;
  casosPorTipo: Record<TipoCaso, number>;
  costoEntregado: number;
  facturado: number;
  /** Costo de lo entregado / lo facturado (arriendo) o valor del contrato (posventa). */
  porcentajeConsumo: number | null;
}

export interface InformeCartera {
  facturado: number;
  recaudado: number;
  pendiente: number;
  vencido: number;
  porRango: { rango: string; valor: number }[];
  porCliente: { clienteId: string; clienteNombre: string; pendiente: number; vencido: number }[];
}

export interface Dashboard {
  contratosVigentes: number;
  contratosPorVencer: number;
  casosAbiertos: number;
  casosDemorados: number;
  itemsBajoMinimo: number;
  carteraVencida: number;
  costoEntregadoMes: number;
  casosPorEstado: { estado: EstadoCaso; cantidad: number }[];
  casosPorMes: { mes: string; registrados: number; cerrados: number }[];
}
