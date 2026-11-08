import { describe, expect, it } from 'vitest';
import type { Movimiento } from '../types';
import { aplicarMovimiento, bajoMinimo, cruzaMinimo, diasCobertura, rotacion } from './existencias';
import { analizarConsumo, esCompatible } from './validacion';

describe('existencias', () => {
  it('aplica entradas, salidas y ajustes', () => {
    expect(aplicarMovimiento(5, { tipo: 'entrada', cantidad: 3 })).toBe(8);
    expect(aplicarMovimiento(5, { tipo: 'salida', cantidad: 2 })).toBe(3);
    expect(aplicarMovimiento(5, { tipo: 'ajuste', cantidad: 9 })).toBe(9);
  });
  it('impide salidas mayores a la existencia y cantidades inválidas', () => {
    expect(() => aplicarMovimiento(1, { tipo: 'salida', cantidad: 2 })).toThrow(/insuficientes/);
    expect(() => aplicarMovimiento(1, { tipo: 'entrada', cantidad: 0 })).toThrow();
    expect(() => aplicarMovimiento(1, { tipo: 'ajuste', cantidad: -1 })).toThrow();
  });
  it('detecta cuando una existencia baja del mínimo (criterio 3)', () => {
    expect(bajoMinimo({ existencias: 2, minimo: 3 })).toBe(true);
    expect(bajoMinimo({ existencias: 3, minimo: 3 })).toBe(false);
    expect(cruzaMinimo(3, 2, 3)).toBe(true);
    expect(cruzaMinimo(2, 1, 3)).toBe(false);
  });
  it('calcula rotación y días de cobertura', () => {
    const now = new Date('2026-06-30T00:00:00Z');
    const m = (
      fecha: string,
      cantidad: number,
      tipo: Movimiento['tipo'] = 'salida',
    ): Movimiento => ({
      id: fecha + cantidad,
      itemId: 'i',
      tipo,
      cantidad,
      costoUnitario: 1,
      fecha,
      usuarioNombre: '',
    });
    const movs = [
      m('2026-06-20', 3),
      m('2026-06-25', 2),
      m('2026-01-01', 10),
      m('2026-06-26', 5, 'entrada'),
    ];
    expect(rotacion(movs, 'i', 30, now)).toBe(5);
    expect(diasCobertura(10, 5, 30)).toBe(60);
    expect(diasCobertura(10, 0, 30)).toBe(Infinity);
  });
});

describe('validación de lo solicitado', () => {
  it('valida la compatibilidad con el modelo del equipo', () => {
    expect(esCompatible({ modelosCompatibles: ['A'] }, 'A')).toBe(true);
    expect(esCompatible({ modelosCompatibles: ['A'] }, 'B')).toBe(false);
  });
  it('detecta el consumo anómalo del ejemplo de la propuesta (1.000 copias, rinde 20.000, piden 3)', () => {
    const equipo = {
      lecturas: [
        { fecha: '', valor: 50_000, fuente: 'tecnico' as const },
        { fecha: '', valor: 51_000, fuente: 'cliente' as const },
      ],
    };
    const r = analizarConsumo({ nombre: 'Tóner', rendimientoCopias: 20_000 }, equipo, 3, 50_000);
    expect(r.anomalo).toBe(true);
    expect(r.copiasDesdeUltimaEntrega).toBe(1000);
    expect(r.mensaje).toMatch(/Consumo anómalo/);
    expect(
      analizarConsumo({ nombre: 'Tóner', rendimientoCopias: 20_000 }, equipo, 1, 50_000).anomalo,
    ).toBe(false);
  });
  it('sin entrega previa toma la primera lectura; sin rendimiento no evalúa', () => {
    const equipo = {
      lecturas: [
        { fecha: '', valor: 0, fuente: 'instalacion' as const },
        { fecha: '', valor: 100_000, fuente: 'cliente' as const },
      ],
    };
    expect(
      analizarConsumo({ nombre: 'T', rendimientoCopias: 20_000 }, equipo, 5, null).anomalo,
    ).toBe(false);
    expect(analizarConsumo({ nombre: 'Fusor' }, equipo, 9, null).anomalo).toBe(false);
  });
});
