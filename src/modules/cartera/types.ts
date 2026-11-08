export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida';

export interface Factura {
  id: string;
  numero: string;
  contratoId: string;
  clienteId: string;
  /** Periodo facturado AAAA-MM. */
  periodo: string;
  valor: number;
  fechaEmision: string;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: 'pendiente' | 'pagada';
}

export interface FacturaResumen extends Factura {
  clienteNombre: string;
  contratoNumero: string;
  estadoActual: EstadoFactura;
  diasMora: number;
}
