/**
 * Lógica de negocio del backend simulado (monolito modular, propuesta §8.1).
 *
 * Cada función representa un caso de uso del servidor y aplica las reglas que la
 * propuesta asigna a la comunicación entre módulos:
 *  - Al aprobar un caso, Servicios consulta a Contratos si lo solicitado está cubierto.
 *  - Al cerrarlo, informa a Equipos (hoja de vida) y a Inventario (descuenta lo entregado).
 *
 * Cuando exista el backend real, esta capa se reemplaza sin tocar el frontend: el
 * frontend solo conoce la API REST.
 */
import type { Usuario } from '@/modules/auth/types';
import type { Alerta } from '@/modules/alertas/types';
import { estadoFactura } from '@/modules/cartera/domain/cartera';
import type { Factura, FacturaResumen } from '@/modules/cartera/types';
import { estaDemorado, tiempoAtencionHoras } from '@/modules/casos/domain/demora';
import { formatearConsecutivo, siguienteEstado, type Accion } from '@/modules/casos/domain/flujo';
import type {
  Advertencia,
  Caso,
  CasoDetalle,
  NuevaSolicitud,
  TrabajoRealizado,
} from '@/modules/casos/types';
import { TIPO_CASO_LABEL } from '@/modules/casos/types';
import { verificarCobertura } from '@/modules/contratos/domain/cobertura';
import { estadoVigencia } from '@/modules/contratos/domain/vigencia';
import type { Contrato, ContratoResumen } from '@/modules/contratos/types';
import { contadorActual, estadoGarantia } from '@/modules/equipos/domain/equipo';
import type { Equipo, EquipoResumen } from '@/modules/equipos/types';
import { aplicarMovimiento, bajoMinimo } from '@/modules/inventario/domain/existencias';
import { analizarConsumo, esCompatible } from '@/modules/inventario/domain/validacion';
import type { Movimiento, MovimientoInput } from '@/modules/inventario/types';
import type { Labor, TecnicoDetalle } from '@/modules/personal/types';
import { formatCOP } from '@/shared/lib/format';
import { nextId, type Db } from './db';

export class HttpError extends Error {
  readonly status: number;
  readonly body?: Record<string, unknown>;
  constructor(status: number, message: string, body?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const iso = (d: Date) => d.toISOString();

export const nombreCliente = (db: Db, id: string | null | undefined) =>
  db.clientes.find((c) => c.id === id)?.razonSocial ?? '—';

export function buscar<T extends { id: string }>(lista: T[], id: string, entidad: string): T {
  const x = lista.find((e) => e.id === id);
  if (!x) throw new HttpError(404, `${entidad} no encontrado.`);
  return x;
}

/* ------------------------------ Contratos ------------------------------ */

export function resumenContrato(db: Db, c: Contrato, now: Date): ContratoResumen {
  const v = estadoVigencia(c, now);
  return {
    ...c,
    clienteNombre: nombreCliente(db, c.clienteId),
    equipos: db.equipos.filter((e) => e.contratoId === c.id).length,
    vigencia: v.estado,
    diasRestantes: v.diasRestantes,
  };
}

/* ------------------------------- Equipos ------------------------------- */

export function resumenEquipo(db: Db, e: Equipo): EquipoResumen {
  const contrato = db.contratos.find((c) => c.id === e.contratoId);
  return {
    ...e,
    clienteNombre: contrato ? nombreCliente(db, contrato.clienteId) : undefined,
    contratoNumero: contrato?.numero,
    contadorActual: contadorActual(e.lecturas),
    casosAbiertos: db.casos.filter(
      (c) => c.equipoId === e.id && !['cerrado', 'rechazado'].includes(c.estado),
    ).length,
  };
}

/** Asocia un equipo a un contrato; el cliente del equipo se deriva del contrato. */
export function sincronizarClienteEquipo(db: Db, e: Equipo) {
  e.clienteId = db.contratos.find((c) => c.id === e.contratoId)?.clienteId ?? null;
}

/* -------------------------------- Casos -------------------------------- */

export function detalleCaso(db: Db, c: Caso, now: Date): CasoDetalle {
  const equipo = db.equipos.find((e) => e.id === c.equipoId);
  return {
    ...c,
    clienteNombre: nombreCliente(db, c.clienteId),
    equipoSerial: equipo?.serial ?? '—',
    equipoModelo: equipo ? `${equipo.marca} ${equipo.modelo}` : '—',
    equipoUbicacion: equipo?.ubicacion ?? '—',
    contratoNumero: db.contratos.find((k) => k.id === c.contratoId)?.numero,
    tecnicoNombre: db.tecnicos.find((t) => t.id === c.tecnicoId)?.nombre,
    demorado: estaDemorado(c, now),
  };
}

/** Contador del equipo la última vez que se le entregó ese ítem (para medir consumo). */
export function contadorUltimaEntrega(
  db: Db,
  equipoId: string,
  itemId: string,
  excluirCasoId?: string,
) {
  const casos = db.casos
    .filter(
      (c) =>
        c.id !== excluirCasoId &&
        c.equipoId === equipoId &&
        c.estado === 'cerrado' &&
        c.trabajo?.itemsUsados.some((i) => i.itemId === itemId),
    )
    .sort((a, b) => (a.trabajo?.fin ?? '').localeCompare(b.trabajo?.fin ?? ''));
  return casos.at(-1)?.trabajo?.contador ?? null;
}

/**
 * Validación previa a la aprobación (criterio de aceptación 1): cobertura del
 * contrato, compatibilidad del ítem con el equipo, coherencia del consumo y existencias.
 */
export function validarCaso(
  db: Db,
  caso: Pick<Caso, 'id' | 'equipoId' | 'contratoId' | 'tipo' | 'itemsSolicitados'>,
  now: Date,
): Advertencia[] {
  const advertencias: Advertencia[] = [];
  const equipo = buscar(db.equipos, caso.equipoId, 'Equipo');
  const contrato = db.contratos.find((c) => c.id === caso.contratoId);

  const cobertura = verificarCobertura(contrato, caso.tipo, now);
  if (!cobertura.cubierto) {
    advertencias.push({ codigo: 'sin_cobertura', mensaje: cobertura.motivo ?? 'No cubierto.' });
  }

  if (caso.tipo === 'falla' && estadoGarantia(equipo, now) === 'vencida' && !contrato) {
    advertencias.push({
      codigo: 'garantia_vencida',
      mensaje: `La garantía del equipo ${equipo.serial} venció y no tiene contrato.`,
    });
  }

  for (const sol of caso.itemsSolicitados) {
    const item = db.items.find((i) => i.id === sol.itemId);
    if (!item) continue;
    if (!esCompatible(item, equipo.modelo)) {
      advertencias.push({
        codigo: 'incompatible',
        mensaje: `${item.nombre} no es compatible con el modelo ${equipo.modelo}.`,
      });
    }
    const consumo = analizarConsumo(
      item,
      equipo,
      sol.cantidad,
      contadorUltimaEntrega(db, equipo.id, item.id, caso.id),
    );
    if (consumo.anomalo && consumo.mensaje) {
      advertencias.push({ codigo: 'consumo_anomalo', mensaje: consumo.mensaje });
    }
    if (item.existencias < sol.cantidad) {
      advertencias.push({
        codigo: 'sin_existencias',
        mensaje: `Existencias insuficientes de ${item.nombre}: hay ${item.existencias}, se solicitan ${sol.cantidad}.`,
      });
    }
  }
  return advertencias;
}

function registrarEvento(c: Caso, usuario: Usuario, now: Date, nota?: string) {
  c.actualizadoEn = iso(now);
  c.bitacora.push({
    fecha: iso(now),
    estado: c.estado,
    usuarioId: usuario.id,
    usuarioNombre: usuario.nombre,
    nota,
  });
}

function transicionar(c: Caso, accion: Accion) {
  try {
    c.estado = siguienteEstado(c.estado, accion);
  } catch (e) {
    throw new HttpError(409, (e as Error).message);
  }
}

export function crearCaso(db: Db, input: NuevaSolicitud, usuario: Usuario, now: Date): Caso {
  const equipo = buscar(db.equipos, input.equipoId, 'Equipo');
  if (usuario.rol === 'cliente' && equipo.clienteId !== usuario.clienteId) {
    throw new HttpError(403, 'El equipo no pertenece a sus contratos.');
  }
  if (!input.descripcion?.trim()) throw new HttpError(400, 'La descripción es obligatoria.');
  if (
    (input.tipo === 'repuesto' || input.tipo === 'suministro') &&
    input.itemsSolicitados.length === 0
  ) {
    throw new HttpError(400, 'Indique los repuestos o suministros solicitados.');
  }
  const anio = now.getFullYear();
  db.secuencias.caso += 1;
  const caso: Caso = {
    id: nextId(db, 'caso'),
    consecutivo: formatearConsecutivo(anio, db.secuencias.caso),
    equipoId: equipo.id,
    contratoId: equipo.contratoId,
    clienteId: equipo.clienteId ?? '',
    tipo: input.tipo,
    descripcion: input.descripcion.trim(),
    estado: 'registrado',
    itemsSolicitados: input.itemsSolicitados.filter((i) => i.cantidad > 0),
    creadoEn: iso(now),
    actualizadoEn: iso(now),
    bitacora: [],
  };
  registrarEvento(caso, usuario, now, 'Solicitud registrada');
  db.casos.push(caso);
  return caso;
}

export function aprobarCaso(
  db: Db,
  id: string,
  usuario: Usuario,
  opts: { confirmarAdvertencias?: boolean; nota?: string },
  now: Date,
): Caso {
  const caso = buscar(db.casos, id, 'Caso');
  const advertencias = validarCaso(db, caso, now);
  if (advertencias.length > 0 && !opts.confirmarAdvertencias) {
    // El sistema advierte ANTES de aprobar; el gestor debe confirmar explícitamente.
    throw new HttpError(409, 'El caso tiene advertencias que deben confirmarse.', { advertencias });
  }
  transicionar(caso, 'aprobar');
  caso.advertenciasAceptadas = advertencias;
  registrarEvento(
    caso,
    usuario,
    now,
    [
      opts.nota,
      advertencias.length ? `Aprobado con ${advertencias.length} advertencia(s)` : undefined,
    ]
      .filter(Boolean)
      .join(' · ') || undefined,
  );
  return caso;
}

export function rechazarCaso(db: Db, id: string, usuario: Usuario, nota: string, now: Date) {
  const caso = buscar(db.casos, id, 'Caso');
  if (!nota?.trim()) throw new HttpError(400, 'Indique el motivo del rechazo.');
  transicionar(caso, 'rechazar');
  registrarEvento(caso, usuario, now, nota);
  return caso;
}

export function asignarCaso(
  db: Db,
  id: string,
  usuario: Usuario,
  datos: { tecnicoId: string; fechaProgramada?: string; nota?: string },
  now: Date,
) {
  const caso = buscar(db.casos, id, 'Caso');
  const tecnico = buscar(db.tecnicos, datos.tecnicoId, 'Técnico');
  if (!tecnico.activo) throw new HttpError(400, 'El técnico no está activo.');
  transicionar(caso, 'asignar');
  caso.tecnicoId = tecnico.id;
  caso.fechaProgramada = datos.fechaProgramada;
  registrarEvento(caso, usuario, now, datos.nota ?? `Asignado a ${tecnico.nombre}`);
  return caso;
}

function verificarTecnicoAsignado(caso: Caso, usuario: Usuario) {
  if (usuario.rol === 'tecnico' && caso.tecnicoId !== usuario.tecnicoId) {
    throw new HttpError(403, 'El caso no está asignado a usted.');
  }
}

export function iniciarCaso(db: Db, id: string, usuario: Usuario, now: Date) {
  const caso = buscar(db.casos, id, 'Caso');
  verificarTecnicoAsignado(caso, usuario);
  transicionar(caso, 'iniciar');
  caso.trabajo = { descripcion: '', itemsUsados: [], inicio: iso(now) };
  registrarEvento(caso, usuario, now, 'Inicio de la atención en sitio');
  return caso;
}

/**
 * Cierre del caso: deja registro en la hoja de vida del equipo y descuenta del
 * inventario lo entregado (criterio de aceptación 2).
 */
export function cerrarCaso(
  db: Db,
  id: string,
  usuario: Usuario,
  trabajo: TrabajoRealizado,
  now: Date,
) {
  const caso = buscar(db.casos, id, 'Caso');
  verificarTecnicoAsignado(caso, usuario);
  if (!trabajo.descripcion?.trim()) {
    throw new HttpError(400, 'Describa el trabajo realizado.');
  }
  if (caso.estado !== 'en_atencion') {
    throw new HttpError(409, `No se puede cerrar un caso en estado ${caso.estado}.`);
  }
  const equipo = buscar(db.equipos, caso.equipoId, 'Equipo');
  const actual = contadorActual(equipo.lecturas);
  if (trabajo.contador !== undefined && trabajo.contador < actual) {
    throw new HttpError(400, `El contador no puede ser menor al último registrado (${actual}).`);
  }
  const usados = trabajo.itemsUsados.filter((i) => i.cantidad > 0);
  // Validar todas las existencias antes de mover nada (operación atómica).
  for (const u of usados) {
    const item = buscar(db.items, u.itemId, 'Ítem');
    if (u.cantidad > item.existencias) {
      throw new HttpError(
        409,
        `Existencias insuficientes de ${item.nombre} (hay ${item.existencias}).`,
      );
    }
  }

  const itemsHistorial = usados.map((u) => {
    const item = buscar(db.items, u.itemId, 'Ítem');
    item.existencias = aplicarMovimiento(item.existencias, {
      tipo: 'salida',
      cantidad: u.cantidad,
    });
    db.movimientos.push({
      id: nextId(db, 'mov'),
      itemId: item.id,
      tipo: 'salida',
      cantidad: u.cantidad,
      costoUnitario: item.costoUnitario,
      fecha: iso(now),
      usuarioNombre: usuario.nombre,
      casoId: caso.id,
      equipoId: equipo.id,
      nota: `Entregado en ${caso.consecutivo}`,
    });
    return {
      itemId: item.id,
      nombre: item.nombre,
      cantidad: u.cantidad,
      costoUnitario: item.costoUnitario,
    };
  });

  if (trabajo.contador !== undefined) {
    equipo.lecturas.push({ fecha: iso(now), valor: trabajo.contador, fuente: 'tecnico' });
  }
  const costo = itemsHistorial.reduce((s, i) => s + i.cantidad * i.costoUnitario, 0);

  caso.trabajo = {
    ...trabajo,
    descripcion: trabajo.descripcion.trim(),
    itemsUsados: usados,
    inicio: caso.trabajo?.inicio,
    fin: iso(now),
  };
  caso.costoTotal = costo;
  transicionar(caso, 'cerrar');
  registrarEvento(caso, usuario, now, 'Caso cerrado');

  equipo.historial.push({
    id: nextId(db, 'hist'),
    fecha: iso(now),
    casoId: caso.id,
    consecutivo: caso.consecutivo,
    tipo: TIPO_CASO_LABEL[caso.tipo],
    descripcion: caso.trabajo.descripcion,
    tecnicoNombre: db.tecnicos.find((t) => t.id === caso.tecnicoId)?.nombre,
    items: itemsHistorial,
    costo,
  });
  return caso;
}

/* ------------------------------ Inventario ------------------------------ */

export function registrarMovimiento(
  db: Db,
  input: MovimientoInput,
  usuario: Usuario,
  now: Date,
): Movimiento {
  const item = buscar(db.items, input.itemId, 'Ítem');
  let nuevas: number;
  try {
    nuevas = aplicarMovimiento(item.existencias, input);
  } catch (e) {
    throw new HttpError(400, (e as Error).message);
  }
  const cantidad = input.tipo === 'ajuste' ? nuevas - item.existencias : input.cantidad;
  item.existencias = nuevas;
  if (input.tipo === 'entrada' && input.costoUnitario) item.costoUnitario = input.costoUnitario;
  const mov: Movimiento = {
    id: nextId(db, 'mov'),
    itemId: item.id,
    tipo: input.tipo,
    cantidad,
    costoUnitario: input.costoUnitario ?? item.costoUnitario,
    fecha: iso(now),
    usuarioNombre: usuario.nombre,
    nota: input.nota,
  };
  db.movimientos.push(mov);
  return mov;
}

/* ------------------------------- Personal ------------------------------- */

export function detalleTecnico(db: Db, tecnicoId: string, now: Date): TecnicoDetalle {
  const t = buscar(db.tecnicos, tecnicoId, 'Técnico');
  const casos = db.casos.filter((c) => c.tecnicoId === t.id);
  const labores: Labor[] = casos
    .map((c) => {
      const d = detalleCaso(db, c, now);
      return {
        casoId: c.id,
        consecutivo: c.consecutivo,
        tipo: TIPO_CASO_LABEL[c.tipo],
        estado: c.estado,
        clienteNombre: d.clienteNombre,
        ubicacion: d.equipoUbicacion,
        equipoSerial: d.equipoSerial,
        fechaProgramada: c.fechaProgramada,
        inicio: c.trabajo?.inicio,
        fin: c.trabajo?.fin,
        descripcion: c.trabajo?.descripcion,
        horasAtencion: tiempoAtencionHoras(c),
      };
    })
    .sort((a, b) => (b.fechaProgramada ?? '').localeCompare(a.fechaProgramada ?? ''));
  const tiempos = labores.map((l) => l.horasAtencion).filter((h): h is number => h !== null);
  return {
    ...t,
    labores,
    casosAbiertos: casos.filter((c) => !['cerrado', 'rechazado'].includes(c.estado)).length,
    casosCerrados: casos.filter((c) => c.estado === 'cerrado').length,
    promedioHorasAtencion: tiempos.length
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : null,
  };
}

/* -------------------------------- Cartera -------------------------------- */

export function resumenFactura(db: Db, f: Db['facturas'][number], now: Date): FacturaResumen {
  const e = estadoFactura(f, now);
  return {
    ...f,
    clienteNombre: nombreCliente(db, f.clienteId),
    contratoNumero: db.contratos.find((c) => c.id === f.contratoId)?.numero ?? '—',
    estadoActual: e.estado,
    diasMora: e.diasMora,
  };
}

/** Genera la facturación mensual de los contratos de arriendo vigentes para un periodo. */
export function generarFacturacion(db: Db, periodo: string, now: Date) {
  const creadas: Factura[] = [];
  const [anio, mes] = periodo.split('-').map(Number) as [number, number];
  const finPeriodo = new Date(Date.UTC(anio, mes, 0)).toISOString().slice(0, 10);
  const inicioPeriodo = `${periodo}-01`;
  for (const c of db.contratos) {
    if (c.modalidad !== 'arriendo') continue;
    if (c.fechaInicio > finPeriodo || c.fechaFin < inicioPeriodo) continue;
    if (db.facturas.some((f) => f.contratoId === c.id && f.periodo === periodo)) continue;
    const equipos = db.equipos.filter((e) => e.contratoId === c.id).length || 1;
    db.secuencias.factura += 1;
    const emision = now.toISOString().slice(0, 10);
    const vence = new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
    const f: Factura = {
      id: nextId(db, 'fac'),
      numero: `FV-${String(db.secuencias.factura).padStart(5, '0')}`,
      contratoId: c.id,
      clienteId: c.clienteId,
      periodo,
      valor: c.valor * equipos,
      fechaEmision: emision,
      fechaVencimiento: vence,
      estado: 'pendiente',
    };
    db.facturas.push(f);
    creadas.push(f);
  }
  return creadas;
}

/* -------------------------------- Alertas -------------------------------- */

export function calcularAlertas(db: Db, now: Date): Alerta[] {
  const alertas: Alerta[] = [];
  const fecha = iso(now);

  for (const i of db.items.filter(bajoMinimo)) {
    alertas.push({
      id: `inv-${i.id}`,
      tipo: 'inventario_minimo',
      severidad: i.existencias === 0 ? 'alta' : 'media',
      titulo: `${i.nombre} por debajo del mínimo`,
      detalle: `Existencias: ${i.existencias} · Mínimo: ${i.minimo}`,
      enlace: `/inventario/${i.id}`,
      fecha,
    });
  }
  for (const c of db.contratos) {
    const v = estadoVigencia(c, now);
    if (v.estado === 'por_vencer' || (v.estado === 'vencido' && v.diasRestantes > -60)) {
      alertas.push({
        id: `con-${c.id}`,
        tipo: v.estado === 'vencido' ? 'contrato_vencido' : 'contrato_por_vencer',
        severidad: v.estado === 'vencido' ? 'alta' : 'media',
        titulo: `Contrato ${c.numero} ${v.estado === 'vencido' ? 'vencido' : 'por vencer'}`,
        detalle: `${nombreCliente(db, c.clienteId)} · vence el ${c.fechaFin}`,
        enlace: `/contratos/${c.id}`,
        fecha,
      });
    }
  }
  for (const e of db.equipos) {
    if (estadoGarantia(e, now) === 'por_vencer') {
      alertas.push({
        id: `gar-${e.id}`,
        tipo: 'garantia_por_vencer',
        severidad: 'media',
        titulo: `Garantía del equipo ${e.serial} por vencer`,
        detalle: `${e.marca} ${e.modelo} · hasta ${e.garantiaHasta}`,
        enlace: `/equipos/${e.id}`,
        fecha,
      });
    }
  }
  for (const c of db.casos) {
    if (estaDemorado(c, now)) {
      alertas.push({
        id: `dem-${c.id}`,
        tipo: 'caso_demorado',
        severidad: 'alta',
        titulo: `Caso ${c.consecutivo} demorado`,
        detalle: `${TIPO_CASO_LABEL[c.tipo]} · ${nombreCliente(db, c.clienteId)}`,
        enlace: `/casos/${c.id}`,
        fecha,
      });
    }
    if (c.estado === 'registrado') {
      const anomalias = validarCaso(db, c, now).filter((a) => a.codigo === 'consumo_anomalo');
      for (const a of anomalias) {
        alertas.push({
          id: `cons-${c.id}`,
          tipo: 'consumo_anomalo',
          severidad: 'alta',
          titulo: `Consumo anómalo en ${c.consecutivo}`,
          detalle: a.mensaje,
          enlace: `/casos/${c.id}`,
          fecha,
        });
      }
    }
  }
  for (const f of db.facturas) {
    const e = estadoFactura(f, now);
    if (e.estado === 'vencida') {
      alertas.push({
        id: `fac-${f.id}`,
        tipo: 'factura_vencida',
        severidad: e.diasMora > 30 ? 'alta' : 'media',
        titulo: `Factura ${f.numero} vencida`,
        detalle: `${nombreCliente(db, f.clienteId)} · ${formatCOP(f.valor)} · ${e.diasMora} días de mora`,
        enlace: '/cartera',
        fecha,
      });
    }
  }
  return alertas.sort((a, b) =>
    a.severidad === b.severidad ? 0 : a.severidad === 'alta' ? -1 : 1,
  );
}
