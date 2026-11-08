import { describe, expect, it } from 'vitest';
import type { Contrato } from '../types';
import { verificarCobertura } from './cobertura';
import { estadoVigencia } from './vigencia';

const now = new Date('2026-06-15T12:00:00Z');
const base: Contrato = {
  id: 'c1',
  numero: 'ARR-1',
  clienteId: 'x',
  modalidad: 'arriendo',
  fechaInicio: '2026-01-01',
  fechaFin: '2026-12-31',
  valor: 1,
  componentes: ['preventivo', 'correctivo', 'repuestos', 'suministros'],
};

describe('estadoVigencia', () => {
  it('clasifica vigente, por vencer, vencido y no iniciado', () => {
    expect(estadoVigencia(base, now).estado).toBe('vigente');
    expect(estadoVigencia({ ...base, fechaFin: '2026-07-01' }, now).estado).toBe('por_vencer');
    expect(estadoVigencia({ ...base, fechaFin: '2026-06-01' }, now).estado).toBe('vencido');
    expect(estadoVigencia({ ...base, fechaInicio: '2026-07-01' }, now).estado).toBe('no_iniciado');
  });
});

describe('verificarCobertura (criterio de aceptación 1)', () => {
  it('cubre lo incluido en un contrato vigente', () => {
    expect(verificarCobertura(base, 'repuesto', now)).toEqual({
      cubierto: true,
      componente: 'repuestos',
    });
  });
  it('advierte cuando el contrato no incluye repuestos', () => {
    const r = verificarCobertura(
      { ...base, componentes: ['preventivo', 'correctivo'] },
      'repuesto',
      now,
    );
    expect(r.cubierto).toBe(false);
    expect(r.motivo).toMatch(/no incluye repuestos/);
  });
  it('no cubre sin contrato, con contrato vencido o no iniciado', () => {
    expect(verificarCobertura(null, 'falla', now).cubierto).toBe(false);
    expect(verificarCobertura({ ...base, fechaFin: '2026-01-31' }, 'falla', now).motivo).toMatch(
      /vencido/,
    );
    expect(verificarCobertura({ ...base, fechaInicio: '2026-09-01' }, 'falla', now).motivo).toMatch(
      /no ha iniciado/,
    );
  });
  it('mapea cada tipo de caso a su componente', () => {
    expect(verificarCobertura(base, 'falla', now).componente).toBe('correctivo');
    expect(verificarCobertura(base, 'mantenimiento', now).componente).toBe('preventivo');
    expect(verificarCobertura(base, 'suministro', now).componente).toBe('suministros');
  });
});
