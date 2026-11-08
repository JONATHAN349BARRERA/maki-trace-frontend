import { RANGOS_MORA, rangoMora } from '@/modules/cartera/domain/cartera';
import { horasAbierto, tiempoSolucionHoras } from '@/modules/casos/domain/demora';
import { ESTADOS_ABIERTOS, ORDEN_ESTADOS } from '@/modules/casos/domain/flujo';
import type { EstadoCaso, TipoCaso } from '@/modules/casos/types';
import { estadoVigencia } from '@/modules/contratos/domain/vigencia';
import { bajoMinimo, diasCobertura, rotacion } from '@/modules/inventario/domain/existencias';
import type {
  Dashboard,
  FilaContrato,
  FilaPersonal,
  InformeCartera,
  InformeCasos,
  InformeInventario,
} from '@/modules/informes/types';
import { detalleCaso, detalleTecnico, nombreCliente, resumenFactura } from './backend';
import type { Db } from './db';

const TIPOS: TipoCaso[] = ['falla', 'mantenimiento', 'repuesto', 'suministro'];
const ESTADOS: EstadoCaso[] = [...ORDEN_ESTADOS, 'rechazado'];

const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function informeCasos(db: Db, now: Date): InformeCasos {
  const casos = db.casos
    .map((c) => ({ ...detalleCaso(db, c, now), horasAbierto: horasAbierto(c, now) }))
    .sort(
      (a, b) => Number(b.demorado) - Number(a.demorado) || b.creadoEn.localeCompare(a.creadoEn),
    );
  return {
    porEstado: ESTADOS.map((estado) => ({
      estado,
      cantidad: db.casos.filter((c) => c.estado === estado).length,
    })),
    porTipo: TIPOS.map((tipo) => ({
      tipo,
      cantidad: db.casos.filter((c) => c.tipo === tipo).length,
    })),
    casos,
    demorados: casos.filter((c) => c.demorado).length,
    abiertos: db.casos.filter((c) => ESTADOS_ABIERTOS.includes(c.estado)).length,
    promedioHorasSolucion: promedio(
      db.casos.map((c) => tiempoSolucionHoras(c)).filter((h): h is number => h !== null),
    ),
  };
}

export function informePersonal(db: Db, now: Date): FilaPersonal[] {
  return db.tecnicos.map((t) => {
    const d = detalleTecnico(db, t.id, now);
    const casos = db.casos.filter((c) => c.tecnicoId === t.id);
    return {
      tecnicoId: t.id,
      nombre: t.nombre,
      zona: t.zona,
      asignados: casos.length,
      abiertos: d.casosAbiertos,
      cerrados: d.casosCerrados,
      promedioHorasAtencion: d.promedioHorasAtencion,
      costoEntregado: casos.reduce((s, c) => s + (c.costoTotal ?? 0), 0),
    };
  });
}

export function informeInventario(db: Db, now: Date): InformeInventario {
  const filas = db.items.map((i) => {
    const salidas90 = rotacion(db.movimientos, i.id, 90, now);
    const cobertura = diasCobertura(i.existencias, salidas90, 90);
    return {
      itemId: i.id,
      codigo: i.codigo,
      nombre: i.nombre,
      tipo: i.tipo,
      existencias: i.existencias,
      minimo: i.minimo,
      bajoMinimo: bajoMinimo(i),
      salidas90,
      diasCobertura: Number.isFinite(cobertura) ? cobertura : null,
      valorExistencias: i.existencias * i.costoUnitario,
    };
  });
  filas.sort((a, b) => b.salidas90 - a.salidas90);
  return {
    filas,
    valorTotal: filas.reduce((s, f) => s + f.valorExistencias, 0),
    bajoMinimo: filas.filter((f) => f.bajoMinimo).length,
  };
}

export function informeContratos(db: Db, now: Date): FilaContrato[] {
  return db.contratos.map((c) => {
    const casos = db.casos.filter((k) => k.contratoId === c.id);
    const costo = casos.reduce((s, k) => s + (k.costoTotal ?? 0), 0);
    const facturado = db.facturas
      .filter((f) => f.contratoId === c.id)
      .reduce((s, f) => s + f.valor, 0);
    const base = c.modalidad === 'arriendo' ? facturado : c.valor;
    const casosPorTipo = Object.fromEntries(
      TIPOS.map((t) => [t, casos.filter((k) => k.tipo === t).length]),
    ) as Record<TipoCaso, number>;
    return {
      contratoId: c.id,
      numero: c.numero,
      clienteNombre: nombreCliente(db, c.clienteId),
      modalidad: c.modalidad,
      vigencia: estadoVigencia(c, now).estado,
      equipos: db.equipos.filter((e) => e.contratoId === c.id).length,
      casos: casos.length,
      casosPorTipo,
      costoEntregado: costo,
      facturado,
      porcentajeConsumo: base > 0 ? (costo / base) * 100 : null,
    };
  });
}

export function informeCartera(db: Db, now: Date): InformeCartera {
  const facturas = db.facturas.map((f) => resumenFactura(db, f, now));
  const pendientes = facturas.filter((f) => f.estadoActual !== 'pagada');
  const porCliente = new Map<
    string,
    { clienteId: string; clienteNombre: string; pendiente: number; vencido: number }
  >();
  for (const f of pendientes) {
    const fila = porCliente.get(f.clienteId) ?? {
      clienteId: f.clienteId,
      clienteNombre: f.clienteNombre,
      pendiente: 0,
      vencido: 0,
    };
    if (f.estadoActual === 'vencida') fila.vencido += f.valor;
    else fila.pendiente += f.valor;
    porCliente.set(f.clienteId, fila);
  }
  return {
    facturado: facturas.reduce((s, f) => s + f.valor, 0),
    recaudado: facturas.filter((f) => f.estadoActual === 'pagada').reduce((s, f) => s + f.valor, 0),
    pendiente: pendientes
      .filter((f) => f.estadoActual === 'pendiente')
      .reduce((s, f) => s + f.valor, 0),
    vencido: pendientes
      .filter((f) => f.estadoActual === 'vencida')
      .reduce((s, f) => s + f.valor, 0),
    porRango: RANGOS_MORA.map((rango) => ({
      rango,
      valor: pendientes
        .filter((f) => rangoMora(f.diasMora) === rango)
        .reduce((s, f) => s + f.valor, 0),
    })),
    porCliente: [...porCliente.values()].sort((a, b) => b.vencido - a.vencido),
  };
}

export function dashboard(db: Db, now: Date): Dashboard {
  const vig = db.contratos.map((c) => estadoVigencia(c, now).estado);
  const casos = informeCasos(db, now);
  const mesActual = now.toISOString().slice(0, 7);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  return {
    contratosVigentes: vig.filter((v) => v === 'vigente' || v === 'por_vencer').length,
    contratosPorVencer: vig.filter((v) => v === 'por_vencer').length,
    casosAbiertos: casos.abiertos,
    casosDemorados: casos.demorados,
    itemsBajoMinimo: db.items.filter(bajoMinimo).length,
    carteraVencida: informeCartera(db, now).vencido,
    costoEntregadoMes: db.movimientos
      .filter((m) => m.tipo === 'salida' && m.fecha.startsWith(mesActual))
      .reduce((s, m) => s + m.cantidad * m.costoUnitario, 0),
    casosPorEstado: casos.porEstado,
    casosPorMes: meses.map((mes) => ({
      mes,
      registrados: db.casos.filter((c) => c.creadoEn.startsWith(mes)).length,
      cerrados: db.casos.filter((c) => c.trabajo?.fin?.startsWith(mes)).length,
    })),
  };
}
