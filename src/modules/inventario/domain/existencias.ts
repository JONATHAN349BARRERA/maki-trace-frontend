import type { Item, Movimiento, MovimientoInput } from '../types';

/** Criterio de aceptación 3: cuando una existencia baja del mínimo, se genera una alerta. */
export const bajoMinimo = (item: Pick<Item, 'existencias' | 'minimo'>) =>
  item.existencias < item.minimo;

/** Cruce del umbral: la alerta se genera en el movimiento que hace bajar del mínimo. */
export const cruzaMinimo = (antes: number, despues: number, minimo: number) =>
  antes >= minimo && despues < minimo;

export function aplicarMovimiento(
  existencias: number,
  mov: Pick<MovimientoInput, 'tipo' | 'cantidad'>,
) {
  if (!Number.isFinite(mov.cantidad) || (mov.tipo !== 'ajuste' && mov.cantidad <= 0)) {
    throw new Error('La cantidad debe ser mayor que cero.');
  }
  switch (mov.tipo) {
    case 'entrada':
      return existencias + mov.cantidad;
    case 'salida':
      if (mov.cantidad > existencias) {
        throw new Error(
          `Existencias insuficientes: hay ${existencias} y se pidieron ${mov.cantidad}.`,
        );
      }
      return existencias - mov.cantidad;
    case 'ajuste':
      if (mov.cantidad < 0) throw new Error('El conteo físico no puede ser negativo.');
      return mov.cantidad;
  }
}

/** Rotación: unidades que salieron en la ventana de días indicada. */
export function rotacion(movs: Movimiento[], itemId: string, dias: number, now: Date = new Date()) {
  const desde = now.getTime() - dias * 86_400_000;
  return movs
    .filter(
      (m) => m.itemId === itemId && m.tipo === 'salida' && new Date(m.fecha).getTime() >= desde,
    )
    .reduce((s, m) => s + m.cantidad, 0);
}

/** Días estimados hasta agotarse según el ritmo de salidas de la ventana. */
export function diasCobertura(existencias: number, salidasVentana: number, dias: number) {
  if (salidasVentana === 0) return Infinity;
  return Math.floor(existencias / (salidasVentana / dias));
}
