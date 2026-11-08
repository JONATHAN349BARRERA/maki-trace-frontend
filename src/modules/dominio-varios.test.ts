import { describe, expect, it } from 'vitest';
import { permisosDe, puede, rutaInicial } from './auth/domain/permisos';
import { estadoFactura, rangoMora } from './cartera/domain/cartera';
import {
  contadorActual,
  estadoGarantia,
  rutaQR,
  serialDesdeQR,
  urlQR,
} from './equipos/domain/equipo';
import { formatCOP, formatDate, formatHours } from '@/shared/lib/format';
import { toQuery } from '@/shared/api/http';

describe('permisos por rol', () => {
  it('cada actor ve solo lo que le corresponde', () => {
    expect(puede('gerente', 'informes:ver')).toBe(true);
    expect(puede('cliente', 'inventario:ver')).toBe(false);
    expect(puede('tecnico', 'qr:escanear')).toBe(true);
    expect(puede(undefined, 'dashboard')).toBe(false);
    expect(permisosDe('cliente')).toContain('casos:crear');
    expect(rutaInicial('tecnico')).toBe('/tecnico');
    expect(rutaInicial('cliente')).toBe('/portal');
  });
});

describe('equipos', () => {
  it('lee el serial desde la URL del QR o desde el texto', () => {
    expect(serialDesdeQR('https://maki.co/equipos/serial/CNCJ71234')).toBe('CNCJ71234');
    expect(serialDesdeQR(' CNCJ71234 ')).toBe('CNCJ71234');
    expect(serialDesdeQR('')).toBeNull();
    expect(serialDesdeQR('hola mundo')).toBeNull();
    expect(rutaQR('A B')).toBe('/equipos/serial/A%20B');
    expect(urlQR('X1', 'https://a.co')).toBe('https://a.co/equipos/serial/X1');
  });
  it('calcula contador y garantía', () => {
    expect(
      contadorActual([
        { fecha: '', valor: 5, fuente: 'cliente' },
        { fecha: '', valor: 9, fuente: 'tecnico' },
      ]),
    ).toBe(9);
    const now = new Date('2026-06-01T00:00:00Z');
    expect(estadoGarantia({ garantiaHasta: '2027-01-01' }, now)).toBe('vigente');
    expect(estadoGarantia({ garantiaHasta: '2026-06-15' }, now)).toBe('por_vencer');
    expect(estadoGarantia({ garantiaHasta: '2026-01-01' }, now)).toBe('vencida');
  });
});

describe('cartera', () => {
  it('determina mora y rangos', () => {
    const now = new Date('2026-06-30T12:00:00Z');
    expect(estadoFactura({ estado: 'pagada', fechaVencimiento: '2026-01-01' }, now).estado).toBe(
      'pagada',
    );
    expect(estadoFactura({ estado: 'pendiente', fechaVencimiento: '2026-07-10' }, now).estado).toBe(
      'pendiente',
    );
    const v = estadoFactura({ estado: 'pendiente', fechaVencimiento: '2026-06-10' }, now);
    expect(v.estado).toBe('vencida');
    expect(v.diasMora).toBe(19);
    expect(rangoMora(0)).toBe('Al día');
    expect(rangoMora(45)).toBe('31–60 días');
    expect(rangoMora(75)).toBe('61–90 días');
    expect(rangoMora(200)).toBe('Más de 90 días');
  });
});

describe('utilidades', () => {
  it('formatea moneda, fechas y horas', () => {
    expect(formatCOP(1500000)).toMatch(/1\.500\.000/);
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
    expect(formatDate(undefined)).toBe('—');
    expect(formatHours(0.5)).toBe('30 min');
    expect(formatHours(5)).toBe('5.0 h');
    expect(formatHours(72)).toBe('3.0 días');
  });
  it('arma query strings omitiendo vacíos', () => {
    expect(toQuery({ a: 1, b: '', c: undefined })).toBe('?a=1');
    expect(toQuery({})).toBe('');
  });
});
