import { beforeEach, describe, expect, it } from 'vitest';
import type { Usuario } from '@/modules/auth/types';
import {
  aprobarCaso,
  asignarCaso,
  calcularAlertas,
  cerrarCaso,
  crearCaso,
  generarFacturacion,
  HttpError,
  iniciarCaso,
  rechazarCaso,
  registrarMovimiento,
  validarCaso,
} from './backend';
import type { Db } from './db';
import {
  dashboard,
  informeCartera,
  informeCasos,
  informeContratos,
  informeInventario,
  informePersonal,
} from './informes';
import { crearSeed } from './seed';

const NOW = new Date('2026-11-08T15:00:00.000Z');
let db: Db;
let gestor: Usuario;
let tecnico: Usuario;
let cliente2: Usuario;

beforeEach(() => {
  db = crearSeed(NOW);
  gestor = db.usuarios.find((u) => u.usuario === 'gestor')!;
  tecnico = db.usuarios.find((u) => u.usuario === 'tecnico')!;
  cliente2 = db.usuarios.find((u) => u.usuario === 'cliente2')!;
});

function flujoCompleto(equipoId: string, itemId: string) {
  const caso = crearCaso(
    db,
    {
      equipoId,
      tipo: 'repuesto',
      descripcion: 'Cambio de rodillos',
      itemsSolicitados: [{ itemId, cantidad: 1 }],
    },
    gestor,
    NOW,
  );
  aprobarCaso(db, caso.id, gestor, { confirmarAdvertencias: true }, NOW);
  asignarCaso(db, caso.id, gestor, { tecnicoId: 'tec-1' }, NOW);
  iniciarCaso(db, caso.id, tecnico, NOW);
  return caso;
}

describe('criterio 1: advertencia de cobertura antes de aprobar', () => {
  it('bloquea la aprobación hasta que se confirmen las advertencias', () => {
    // eq-3 está en POS-2025-002, que no incluye repuestos.
    const caso = crearCaso(
      db,
      {
        equipoId: 'eq-3',
        tipo: 'repuesto',
        descripcion: 'Rodillos',
        itemsSolicitados: [{ itemId: 'it-6', cantidad: 1 }],
      },
      cliente2,
      NOW,
    );
    expect(validarCaso(db, caso, NOW).map((a) => a.codigo)).toContain('sin_cobertura');
    try {
      aprobarCaso(db, caso.id, gestor, {}, NOW);
      expect.fail('debió advertir');
    } catch (e) {
      expect((e as HttpError).status).toBe(409);
      expect((e as HttpError).body?.advertencias).toBeDefined();
    }
    expect(caso.estado).toBe('registrado');
    aprobarCaso(db, caso.id, gestor, { confirmarAdvertencias: true }, NOW);
    expect(caso.estado).toBe('aprobado');
    expect(caso.advertenciasAceptadas?.[0]?.codigo).toBe('sin_cobertura');
  });
  it('aprueba directo si está cubierto y detecta ítems incompatibles', () => {
    const ok = crearCaso(
      db,
      { equipoId: 'eq-1', tipo: 'falla', descripcion: 'No enciende', itemsSolicitados: [] },
      gestor,
      NOW,
    );
    expect(aprobarCaso(db, ok.id, gestor, {}, NOW).estado).toBe('aprobado');
    const malo = crearCaso(
      db,
      {
        equipoId: 'eq-1',
        tipo: 'repuesto',
        descripcion: 'Banda',
        itemsSolicitados: [{ itemId: 'it-8', cantidad: 5 }],
      },
      gestor,
      NOW,
    );
    const codigos = validarCaso(db, malo, NOW).map((a) => a.codigo);
    expect(codigos).toEqual(expect.arrayContaining(['incompatible', 'sin_existencias']));
  });
});

describe('criterio 2: el cierre alimenta la hoja de vida y descuenta inventario', () => {
  it('registra servicio, repuestos, costo, contador y movimiento de salida', () => {
    const eq = db.equipos.find((e) => e.id === 'eq-1')!;
    const item = db.items.find((i) => i.id === 'it-6')!;
    const antes = item.existencias;
    const histAntes = eq.historial.length;
    const caso = flujoCompleto('eq-1', 'it-6');
    cerrarCaso(
      db,
      caso.id,
      tecnico,
      {
        descripcion: 'Rodillos cambiados',
        itemsUsados: [{ itemId: 'it-6', cantidad: 1 }],
        contador: 200_000,
      },
      NOW,
    );
    expect(caso.estado).toBe('cerrado');
    expect(item.existencias).toBe(antes - 1);
    expect(eq.historial).toHaveLength(histAntes + 1);
    const h = eq.historial.at(-1)!;
    expect(h.consecutivo).toBe(caso.consecutivo);
    expect(h.items[0]).toMatchObject({ itemId: 'it-6', cantidad: 1 });
    expect(h.costo).toBe(item.costoUnitario);
    expect(eq.lecturas.at(-1)?.valor).toBe(200_000);
    expect(db.movimientos.at(-1)).toMatchObject({ tipo: 'salida', casoId: caso.id });
  });
  it('valida descripción, contador, existencias y técnico asignado', () => {
    const caso = flujoCompleto('eq-1', 'it-6');
    expect(() =>
      cerrarCaso(db, caso.id, tecnico, { descripcion: '', itemsUsados: [] }, NOW),
    ).toThrow(/Describa/);
    expect(() =>
      cerrarCaso(db, caso.id, tecnico, { descripcion: 'x', itemsUsados: [], contador: 1 }, NOW),
    ).toThrow(/contador/);
    expect(() =>
      cerrarCaso(
        db,
        caso.id,
        tecnico,
        { descripcion: 'x', itemsUsados: [{ itemId: 'it-6', cantidad: 999 }] },
        NOW,
      ),
    ).toThrow(/insuficientes/);
    const otro = db.usuarios.find((u) => u.usuario === 'tecnico2')!;
    expect(() => cerrarCaso(db, caso.id, otro, { descripcion: 'x', itemsUsados: [] }, NOW)).toThrow(
      /no está asignado/,
    );
  });
  it('no permite saltarse estados ni rechazar sin motivo', () => {
    const caso = crearCaso(
      db,
      { equipoId: 'eq-1', tipo: 'falla', descripcion: 'x', itemsSolicitados: [] },
      gestor,
      NOW,
    );
    expect(() => iniciarCaso(db, caso.id, gestor, NOW)).toThrow();
    expect(() => rechazarCaso(db, caso.id, gestor, '', NOW)).toThrow(/motivo/);
    expect(rechazarCaso(db, caso.id, gestor, 'Duplicado', NOW).estado).toBe('rechazado');
  });
  it('un cliente no puede registrar casos de equipos ajenos', () => {
    expect(() =>
      crearCaso(
        db,
        { equipoId: 'eq-1', tipo: 'falla', descripcion: 'x', itemsSolicitados: [] },
        cliente2,
        NOW,
      ),
    ).toThrow(/no pertenece/);
    expect(() =>
      crearCaso(
        db,
        { equipoId: 'eq-3', tipo: 'suministro', descripcion: 'x', itemsSolicitados: [] },
        cliente2,
        NOW,
      ),
    ).toThrow(/Indique/);
  });
});

describe('criterio 3: alerta cuando una existencia baja del mínimo', () => {
  it('genera alerta tras una salida que cruza el mínimo', () => {
    const item = db.items.find((i) => i.id === 'it-6')!; // existencias 12, mínimo 5 (menos lo consumido en la semilla)
    expect(calcularAlertas(db, NOW).some((a) => a.id === `inv-${item.id}`)).toBe(false);
    registrarMovimiento(
      db,
      { itemId: item.id, tipo: 'salida', cantidad: item.existencias - item.minimo + 1 },
      gestor,
      NOW,
    );
    expect(item.existencias).toBe(item.minimo - 1);
    const alerta = calcularAlertas(db, NOW).find((a) => a.id === `inv-${item.id}`);
    expect(alerta?.tipo).toBe('inventario_minimo');
  });
  it('ajustes y entradas actualizan existencias y costo', () => {
    const mov = registrarMovimiento(
      db,
      { itemId: 'it-1', tipo: 'ajuste', cantidad: 3 },
      gestor,
      NOW,
    );
    expect(db.items.find((i) => i.id === 'it-1')!.existencias).toBe(3);
    expect(mov.cantidad).toBeLessThan(0);
    registrarMovimiento(
      db,
      { itemId: 'it-1', tipo: 'entrada', cantidad: 10, costoUnitario: 200_000 },
      gestor,
      NOW,
    );
    expect(db.items.find((i) => i.id === 'it-1')!.costoUnitario).toBe(200_000);
    expect(() =>
      registrarMovimiento(db, { itemId: 'it-1', tipo: 'salida', cantidad: 999 }, gestor, NOW),
    ).toThrow(HttpError);
  });
});

describe('criterio 4 e informes', () => {
  it('el informe de casos muestra estado y demorados', () => {
    const inf = informeCasos(db, NOW);
    expect(inf.casos.length).toBe(db.casos.length);
    expect(inf.demorados).toBeGreaterThan(0);
    expect(inf.casos[0]!.demorado).toBe(true); // demorados primero
    expect(inf.porEstado.find((e) => e.estado === 'cerrado')!.cantidad).toBe(6);
  });
  it('calcula informes de personal, inventario, contratos, cartera y tablero', () => {
    expect(informePersonal(db, NOW).find((p) => p.tecnicoId === 'tec-1')!.cerrados).toBe(3);
    expect(informeInventario(db, NOW).bajoMinimo).toBeGreaterThan(0);
    const c = informeContratos(db, NOW).find((x) => x.numero === 'ARR-2025-003')!;
    expect(c.costoEntregado).toBeGreaterThan(0);
    const cartera = informeCartera(db, NOW);
    expect(cartera.vencido).toBeGreaterThan(0);
    expect(cartera.facturado).toBe(cartera.recaudado + cartera.pendiente + cartera.vencido);
    const d = dashboard(db, NOW);
    expect(d.casosPorMes).toHaveLength(6);
    expect(d.contratosPorVencer).toBe(1);
  });
  it('alertas incluyen vencimientos, garantías, demoras, consumo anómalo y cartera', () => {
    const tipos = new Set(calcularAlertas(db, NOW).map((a) => a.tipo));
    for (const t of [
      'contrato_por_vencer',
      'contrato_vencido',
      'garantia_por_vencer',
      'caso_demorado',
      'consumo_anomalo',
      'factura_vencida',
      'inventario_minimo',
    ]) {
      expect(tipos).toContain(t);
    }
  });
  it('la facturación mensual no duplica periodos', () => {
    const periodo = '2026-12';
    const primeras = generarFacturacion(db, periodo, NOW);
    expect(primeras.length).toBeGreaterThan(0);
    expect(generarFacturacion(db, periodo, NOW)).toHaveLength(0);
  });
});
