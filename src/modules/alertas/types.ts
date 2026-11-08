export type TipoAlerta =
  | 'inventario_minimo'
  | 'contrato_por_vencer'
  | 'contrato_vencido'
  | 'garantia_por_vencer'
  | 'caso_demorado'
  | 'consumo_anomalo'
  | 'factura_vencida';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  severidad: 'alta' | 'media';
  titulo: string;
  detalle: string;
  enlace: string;
  fecha: string;
}
