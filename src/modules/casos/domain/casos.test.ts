import { describe, expect, it } from 'vitest';
import type { Caso } from '../types';
import { estaDemorado, SLA_HORAS, tiempoAtencionHoras, tiempoSolucionHoras } from './demora';
import {
  accionesDisponibles,
  formatearConsecutivo,
  puedeTransicionar,
  siguienteEstado,
} from './flujo';

describe('flujo de estados del caso', () => {
  it('sigue registrado → aprobado → asignado → en atención → cerrado', () => {
    let e = siguienteEstado('registrado', 'aprobar');
    expect(e).toBe('aprobado');
    e = siguienteEstado(e, 'asignar');
    expect(e).toBe('asignado');
    e = siguienteEstado(e, 'iniciar');
    expect(e).toBe('en_atencion');
    expect(siguienteEstado(e, 'cerrar')).toBe('cerrado');
  });
  it('rechaza transiciones inválidas', () => {
    expect(() => siguienteEstado('registrado', 'cerrar')).toThrow();
    expect(puedeTransicionar('cerrado', 'aprobar')).toBe(false);
  });
  it('limita las acciones por rol', () => {
    expect(accionesDisponibles('registrado', 'gestor')).toEqual(['aprobar', 'rechazar']);
    expect(accionesDisponibles('registrado', 'tecnico')).toEqual([]);
    expect(accionesDisponibles('asignado', 'tecnico')).toEqual(['iniciar']);
    expect(accionesDisponibles('en_atencion', 'cliente')).toEqual([]);
  });
  it('formatea el consecutivo', () => {
    expect(formatearConsecutivo(2026, 7)).toBe('CASO-2026-0007');
  });
});

describe('demora (criterio de aceptación 4)', () => {
  const now = new Date('2026-06-10T12:00:00Z');
  const caso = (
    horas: number,
    estado: Caso['estado'] = 'registrado',
  ): Pick<Caso, 'estado' | 'tipo' | 'creadoEn'> => ({
    estado,
    tipo: 'falla',
    creadoEn: new Date(now.getTime() - horas * 3_600_000).toISOString(),
  });
  it('marca demorado un caso abierto que supera su tiempo máximo', () => {
    expect(estaDemorado(caso(SLA_HORAS.falla + 1), now)).toBe(true);
    expect(estaDemorado(caso(SLA_HORAS.falla - 1), now)).toBe(false);
  });
  it('un caso cerrado nunca está demorado', () => {
    expect(estaDemorado(caso(500, 'cerrado'), now)).toBe(false);
  });
  it('calcula tiempos de atención y solución', () => {
    const c = {
      creadoEn: '2026-06-01T00:00:00Z',
      bitacora: [
        {
          fecha: '2026-06-01T02:00:00Z',
          estado: 'asignado' as const,
          usuarioId: '',
          usuarioNombre: '',
        },
        {
          fecha: '2026-06-01T06:00:00Z',
          estado: 'cerrado' as const,
          usuarioId: '',
          usuarioNombre: '',
        },
      ],
    };
    expect(tiempoAtencionHoras(c)).toBe(4);
    expect(tiempoSolucionHoras(c)).toBe(6);
    expect(tiempoAtencionHoras({ bitacora: [] })).toBeNull();
    expect(tiempoSolucionHoras({ creadoEn: c.creadoEn, bitacora: [] })).toBeNull();
  });
});
