/**
 * Contrato de la API REST (JSON) que consume el frontend, implementado sobre el
 * backend simulado. Documentado en docs/API.md.
 */
import { http, HttpResponse, type JsonBodyType } from 'msw';
import type { Rol, Usuario } from '@/modules/auth/types';
import type { NuevaSolicitud, TrabajoRealizado } from '@/modules/casos/types';
import type { ClienteInput } from '@/modules/clientes/types';
import type { ContratoInput } from '@/modules/contratos/types';
import type { EquipoInput } from '@/modules/equipos/types';
import type { ItemInput, MovimientoInput } from '@/modules/inventario/types';
import type { TecnicoInput } from '@/modules/personal/types';
import { API_URL } from '@/shared/api/http';
import {
  aprobarCaso,
  asignarCaso,
  buscar,
  calcularAlertas,
  cerrarCaso,
  crearCaso,
  detalleCaso,
  detalleTecnico,
  generarFacturacion,
  HttpError,
  iniciarCaso,
  rechazarCaso,
  registrarMovimiento,
  resumenContrato,
  resumenEquipo,
  resumenFactura,
  sincronizarClienteEquipo,
  validarCaso,
} from './backend';
import { getDb, nextId, persist, resetDb, type Db } from './db';
import {
  dashboard,
  informeCartera,
  informeCasos,
  informeContratos,
  informeInventario,
  informePersonal,
} from './informes';

/** Reloj inyectable para pruebas deterministas. */
let clock: () => Date = () => new Date();
export const setClock = (fn: () => Date) => {
  clock = fn;
};

const api = (path: string) => `${API_URL}${path}`;
const sinPassword = ({ password: _p, ...u }: Db['usuarios'][number]): Usuario => u;

function usuarioActual(request: Request): Usuario {
  const auth = request.headers.get('Authorization') ?? '';
  const id = auth.startsWith('Bearer mock-token-') ? auth.slice('Bearer mock-token-'.length) : null;
  const u = getDb().usuarios.find((x) => x.id === id && x.activo);
  if (!u) throw new HttpError(401, 'Sesión no válida. Inicie sesión de nuevo.');
  return sinPassword(u);
}

function exigir(u: Usuario, ...roles: Rol[]) {
  if (!roles.includes(u.rol)) throw new HttpError(403, 'No tiene permisos para esta operación.');
}

type Ctx = { request: Request; params: Record<string, string | readonly string[] | undefined> };
type Handler = (
  ctx: Ctx & { db: Db; user: Usuario; now: Date; p: (k: string) => string },
) => unknown | Promise<unknown>;

/** Envuelve cada endpoint: autenticación, manejo de errores y persistencia. */
function ruta(handler: Handler, { publica = false } = {}) {
  return async (ctx: Ctx) => {
    try {
      const db = getDb();
      const user = publica ? (undefined as unknown as Usuario) : usuarioActual(ctx.request);
      const p = (k: string) => String(ctx.params[k]);
      const result = await handler({ ...ctx, db, user, now: clock(), p });
      if (ctx.request.method !== 'GET') persist();
      if (result instanceof Response) return result;
      return HttpResponse.json((result ?? null) as JsonBodyType, {
        status: ctx.request.method === 'POST' ? 201 : 200,
      });
    } catch (e) {
      if (e instanceof HttpError) {
        return HttpResponse.json({ message: e.message, ...e.body }, { status: e.status });
      }
      console.error(e);
      return HttpResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
    }
  };
}

const body = async <T>(r: Request) => (await r.json()) as T;

/* ---- Filtros de visibilidad por rol (un cliente solo ve lo suyo) ---- */
const contratosVisibles = (db: Db, u: Usuario) =>
  u.rol === 'cliente' ? db.contratos.filter((c) => c.clienteId === u.clienteId) : db.contratos;
const equiposVisibles = (db: Db, u: Usuario) =>
  u.rol === 'cliente' ? db.equipos.filter((e) => e.clienteId === u.clienteId) : db.equipos;
const casosVisibles = (db: Db, u: Usuario) => {
  if (u.rol === 'cliente') return db.casos.filter((c) => c.clienteId === u.clienteId);
  if (u.rol === 'tecnico') return db.casos.filter((c) => c.tecnicoId === u.tecnicoId);
  return db.casos;
};
function verificarVisible<T extends { id: string }>(lista: T[], id: string, entidad: string) {
  if (!lista.some((x) => x.id === id)) throw new HttpError(404, `${entidad} no encontrado.`);
}

const GESTION: Rol[] = ['gerente', 'gestor'];

export const handlers = [
  /* ------------------------------- Auth ------------------------------- */
  http.post(
    api('/auth/login'),
    ruta(
      async ({ request, db }) => {
        const { usuario, password } = await body<{ usuario: string; password: string }>(request);
        const u = db.usuarios.find((x) => x.usuario === usuario?.trim().toLowerCase() && x.activo);
        if (!u || u.password !== password)
          throw new HttpError(401, 'Usuario o contraseña incorrectos.');
        return HttpResponse.json({ token: `mock-token-${u.id}`, usuario: sinPassword(u) });
      },
      { publica: true },
    ),
  ),
  http.get(
    api('/auth/me'),
    ruta(({ user }) => user),
  ),

  /* ----------------------------- Usuarios ----------------------------- */
  http.get(
    api('/usuarios'),
    ruta(({ db, user }) => {
      exigir(user, 'gerente');
      return db.usuarios.map(sinPassword);
    }),
  ),
  http.post(
    api('/usuarios'),
    ruta(async ({ db, user, request }) => {
      exigir(user, 'gerente');
      const input = await body<Omit<Usuario, 'id'> & { password: string }>(request);
      if (db.usuarios.some((x) => x.usuario === input.usuario))
        throw new HttpError(409, 'El usuario ya existe.');
      if (!input.password || input.password.length < 8)
        throw new HttpError(400, 'La contraseña debe tener al menos 8 caracteres.');
      const nuevo = { ...input, usuario: input.usuario.toLowerCase(), id: nextId(db, 'usr') };
      db.usuarios.push(nuevo);
      return sinPassword(nuevo);
    }),
  ),
  http.put(
    api('/usuarios/:id'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, 'gerente');
      const u = buscar(db.usuarios, p('id'), 'Usuario');
      const { password, ...cambios } = await body<Partial<Usuario> & { password?: string }>(
        request,
      );
      if (
        u.id === user.id &&
        (cambios.activo === false || (cambios.rol && cambios.rol !== 'gerente'))
      ) {
        throw new HttpError(400, 'No puede desactivarse ni quitarse el rol de gerente a sí mismo.');
      }
      Object.assign(u, cambios, password ? { password } : {});
      return sinPassword(u);
    }),
  ),
  http.post(
    api('/admin/reset'),
    ruta(({ user }) => {
      exigir(user, 'gerente');
      resetDb();
      return { ok: true };
    }),
  ),

  /* ----------------------------- Clientes ----------------------------- */
  http.get(
    api('/clientes'),
    ruta(({ db, user }) => {
      exigir(user, ...GESTION);
      return db.clientes;
    }),
  ),
  http.get(
    api('/clientes/:id'),
    ruta(({ db, user, p }) => {
      if (user.rol === 'cliente' && user.clienteId !== p('id'))
        throw new HttpError(404, 'Cliente no encontrado.');
      return buscar(db.clientes, p('id'), 'Cliente');
    }),
  ),
  http.post(
    api('/clientes'),
    ruta(async ({ db, user, request }) => {
      exigir(user, 'gerente');
      const c = { ...(await body<ClienteInput>(request)), id: nextId(db, 'cli') };
      db.clientes.push(c);
      return c;
    }),
  ),
  http.put(
    api('/clientes/:id'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, 'gerente');
      return Object.assign(
        buscar(db.clientes, p('id'), 'Cliente'),
        await body<ClienteInput>(request),
      );
    }),
  ),

  /* ----------------------------- Contratos ----------------------------- */
  http.get(
    api('/contratos'),
    ruta(({ db, user, now }) =>
      contratosVisibles(db, user).map((c) => resumenContrato(db, c, now)),
    ),
  ),
  http.get(
    api('/contratos/:id'),
    ruta(({ db, user, now, p }) => {
      verificarVisible(contratosVisibles(db, user), p('id'), 'Contrato');
      return resumenContrato(db, buscar(db.contratos, p('id'), 'Contrato'), now);
    }),
  ),
  http.post(
    api('/contratos'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, 'gerente');
      const input = await body<ContratoInput>(request);
      if (db.contratos.some((c) => c.numero === input.numero))
        throw new HttpError(409, 'Ya existe un contrato con ese número.');
      if (input.fechaFin < input.fechaInicio)
        throw new HttpError(400, 'La fecha de fin debe ser posterior al inicio.');
      const c = { ...input, id: nextId(db, 'con') };
      db.contratos.push(c);
      return resumenContrato(db, c, now);
    }),
  ),
  http.put(
    api('/contratos/:id'),
    ruta(async ({ db, user, request, p, now }) => {
      exigir(user, 'gerente');
      const c = buscar(db.contratos, p('id'), 'Contrato');
      Object.assign(c, await body<ContratoInput>(request));
      db.equipos
        .filter((e) => e.contratoId === c.id)
        .forEach((e) => sincronizarClienteEquipo(db, e));
      return resumenContrato(db, c, now);
    }),
  ),

  /* ------------------------------ Equipos ------------------------------ */
  http.get(
    api('/equipos'),
    ruta(({ db, user, request }) => {
      const contratoId = new URL(request.url).searchParams.get('contratoId');
      return equiposVisibles(db, user)
        .filter((e) => !contratoId || e.contratoId === contratoId)
        .map((e) => resumenEquipo(db, e));
    }),
  ),
  http.get(
    api('/equipos/serial/:serial'),
    ruta(({ db, user, p }) => {
      const e = equiposVisibles(db, user).find((x) => x.serial === p('serial'));
      if (!e) throw new HttpError(404, `No hay un equipo con serial ${p('serial')}.`);
      return resumenEquipo(db, e);
    }),
  ),
  http.get(
    api('/equipos/:id'),
    ruta(({ db, user, p }) => {
      verificarVisible(equiposVisibles(db, user), p('id'), 'Equipo');
      return resumenEquipo(db, buscar(db.equipos, p('id'), 'Equipo'));
    }),
  ),
  http.post(
    api('/equipos'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, ...GESTION);
      const { contadorInicial, ...input } = await body<EquipoInput>(request);
      if (db.equipos.some((e) => e.serial === input.serial))
        throw new HttpError(409, 'Ya existe un equipo con ese serial.');
      const e = {
        ...input,
        id: nextId(db, 'eq'),
        fotos: [],
        historial: [],
        clienteId: null,
        lecturas: [
          { fecha: now.toISOString(), valor: contadorInicial ?? 0, fuente: 'instalacion' as const },
        ],
      };
      sincronizarClienteEquipo(db, e);
      db.equipos.push(e);
      return resumenEquipo(db, e);
    }),
  ),
  http.put(
    api('/equipos/:id'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, ...GESTION);
      const e = buscar(db.equipos, p('id'), 'Equipo');
      const { contadorInicial: _c, ...input } = await body<EquipoInput>(request);
      Object.assign(e, input);
      sincronizarClienteEquipo(db, e);
      return resumenEquipo(db, e);
    }),
  ),
  http.post(
    api('/equipos/:id/lecturas'),
    ruta(async ({ db, user, request, p, now }) => {
      verificarVisible(equiposVisibles(db, user), p('id'), 'Equipo');
      const e = buscar(db.equipos, p('id'), 'Equipo');
      const { valor } = await body<{ valor: number }>(request);
      const max = Math.max(...e.lecturas.map((l) => l.valor));
      if (!(valor >= max)) throw new HttpError(400, `La lectura debe ser mayor o igual a ${max}.`);
      e.lecturas.push({
        fecha: now.toISOString(),
        valor,
        fuente: user.rol === 'cliente' ? 'cliente' : 'tecnico',
      });
      return resumenEquipo(db, e);
    }),
  ),
  http.post(
    api('/equipos/:id/fotos'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, 'gerente', 'gestor', 'tecnico');
      const e = buscar(db.equipos, p('id'), 'Equipo');
      const form = await request.formData();
      const file = form.get('foto');
      if (!(file instanceof Blob)) throw new HttpError(400, 'Adjunte una imagen.');
      const buffer = new Uint8Array(await file.arrayBuffer());
      let bin = '';
      buffer.forEach((b) => (bin += String.fromCharCode(b)));
      const id = nextId(db, 'arc');
      // La base de datos solo guarda la referencia al archivo (propuesta §8.1).
      db.archivos[id] = { tipo: file.type || 'image/jpeg', data: btoa(bin) };
      e.fotos.push(`${API_URL}/archivos/${id}`);
      return resumenEquipo(db, e);
    }),
  ),
  http.delete(
    api('/equipos/:id/fotos/:archivoId'),
    ruta(({ db, user, p }) => {
      exigir(user, ...GESTION);
      const e = buscar(db.equipos, p('id'), 'Equipo');
      e.fotos = e.fotos.filter((f) => !f.endsWith(`/${p('archivoId')}`));
      delete db.archivos[p('archivoId')];
      return resumenEquipo(db, e);
    }),
  ),
  http.get(api('/archivos/:id'), ({ params }) => {
    const a = getDb().archivos[String(params.id)];
    if (!a) return new HttpResponse(null, { status: 404 });
    const bytes = Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
    return new HttpResponse(bytes, { headers: { 'Content-Type': a.tipo } });
  }),

  /* ------------------------------- Casos ------------------------------- */
  http.get(
    api('/casos'),
    ruta(({ db, user, now, request }) => {
      const q = new URL(request.url).searchParams;
      return casosVisibles(db, user)
        .filter((c) => !q.get('estado') || c.estado === q.get('estado'))
        .filter((c) => !q.get('equipoId') || c.equipoId === q.get('equipoId'))
        .filter((c) => !q.get('contratoId') || c.contratoId === q.get('contratoId'))
        .map((c) => detalleCaso(db, c, now))
        .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    }),
  ),
  http.get(
    api('/casos/:id'),
    ruta(({ db, user, now, p }) => {
      verificarVisible(casosVisibles(db, user), p('id'), 'Caso');
      return detalleCaso(db, buscar(db.casos, p('id'), 'Caso'), now);
    }),
  ),
  http.post(
    api('/casos/validar'),
    ruta(async ({ db, user, request, now }) => {
      const input = await body<NuevaSolicitud>(request);
      verificarVisible(equiposVisibles(db, user), input.equipoId, 'Equipo');
      const e = buscar(db.equipos, input.equipoId, 'Equipo');
      return validarCaso(
        db,
        {
          id: '',
          equipoId: e.id,
          contratoId: e.contratoId,
          tipo: input.tipo,
          itemsSolicitados: input.itemsSolicitados,
        },
        now,
      );
    }),
  ),
  http.get(
    api('/casos/:id/validacion'),
    ruta(({ db, user, now, p }) => {
      exigir(user, ...GESTION);
      return validarCaso(db, buscar(db.casos, p('id'), 'Caso'), now);
    }),
  ),
  http.post(
    api('/casos'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, 'cliente', 'gestor', 'gerente');
      return detalleCaso(db, crearCaso(db, await body<NuevaSolicitud>(request), user, now), now);
    }),
  ),
  http.post(
    api('/casos/:id/aprobar'),
    ruta(async ({ db, user, request, now, p }) => {
      exigir(user, ...GESTION);
      const opts = await body<{ confirmarAdvertencias?: boolean; nota?: string }>(request);
      return detalleCaso(db, aprobarCaso(db, p('id'), user, opts, now), now);
    }),
  ),
  http.post(
    api('/casos/:id/rechazar'),
    ruta(async ({ db, user, request, now, p }) => {
      exigir(user, ...GESTION);
      const { nota } = await body<{ nota: string }>(request);
      return detalleCaso(db, rechazarCaso(db, p('id'), user, nota, now), now);
    }),
  ),
  http.post(
    api('/casos/:id/asignar'),
    ruta(async ({ db, user, request, now, p }) => {
      exigir(user, ...GESTION);
      const datos = await body<{ tecnicoId: string; fechaProgramada?: string; nota?: string }>(
        request,
      );
      return detalleCaso(db, asignarCaso(db, p('id'), user, datos, now), now);
    }),
  ),
  http.post(
    api('/casos/:id/iniciar'),
    ruta(({ db, user, now, p }) => {
      exigir(user, 'tecnico', 'gestor');
      return detalleCaso(db, iniciarCaso(db, p('id'), user, now), now);
    }),
  ),
  http.post(
    api('/casos/:id/cerrar'),
    ruta(async ({ db, user, request, now, p }) => {
      exigir(user, 'tecnico', 'gestor');
      return detalleCaso(
        db,
        cerrarCaso(db, p('id'), user, await body<TrabajoRealizado>(request), now),
        now,
      );
    }),
  ),

  /* ---------------------------- Inventario ---------------------------- */
  http.get(
    api('/items'),
    ruta(({ db, user, request }) => {
      exigir(user, 'gerente', 'gestor', 'tecnico', 'cliente');
      const modelo = new URL(request.url).searchParams.get('modelo');
      const items = modelo
        ? db.items.filter((i) => i.modelosCompatibles.includes(modelo))
        : db.items;
      // El cliente solo necesita el catálogo, no costos ni existencias.
      return user.rol === 'cliente'
        ? items.map(({ id, codigo, nombre, tipo, modelosCompatibles }) => ({
            id,
            codigo,
            nombre,
            tipo,
            modelosCompatibles,
            costoUnitario: 0,
            existencias: 0,
            minimo: 0,
          }))
        : items;
    }),
  ),
  http.get(
    api('/items/:id'),
    ruta(({ db, user, p }) => {
      exigir(user, ...GESTION);
      return buscar(db.items, p('id'), 'Ítem');
    }),
  ),
  http.post(
    api('/items'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, ...GESTION);
      const { existencias = 0, ...input } = await body<ItemInput>(request);
      if (db.items.some((i) => i.codigo === input.codigo))
        throw new HttpError(409, 'Ya existe un ítem con ese código.');
      const item = { ...input, id: nextId(db, 'it'), existencias: 0 };
      db.items.push(item);
      if (existencias > 0)
        registrarMovimiento(
          db,
          { itemId: item.id, tipo: 'entrada', cantidad: existencias, nota: 'Existencia inicial' },
          user,
          now,
        );
      return item;
    }),
  ),
  http.put(
    api('/items/:id'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, ...GESTION);
      const { existencias: _e, ...input } = await body<ItemInput>(request);
      return Object.assign(buscar(db.items, p('id'), 'Ítem'), input);
    }),
  ),
  http.get(
    api('/movimientos'),
    ruta(({ db, user, request }) => {
      exigir(user, ...GESTION);
      const itemId = new URL(request.url).searchParams.get('itemId');
      return db.movimientos
        .filter((m) => !itemId || m.itemId === itemId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    }),
  ),
  http.post(
    api('/movimientos'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, ...GESTION);
      return registrarMovimiento(db, await body<MovimientoInput>(request), user, now);
    }),
  ),

  /* ----------------------------- Personal ----------------------------- */
  http.get(
    api('/tecnicos'),
    ruta(({ db, user }) => {
      exigir(user, 'gerente', 'gestor');
      return db.tecnicos;
    }),
  ),
  http.get(
    api('/tecnicos/:id'),
    ruta(({ db, user, now, p }) => {
      if (user.rol === 'tecnico' ? user.tecnicoId !== p('id') : !GESTION.includes(user.rol)) {
        throw new HttpError(403, 'No tiene permisos para esta operación.');
      }
      return detalleTecnico(db, p('id'), now);
    }),
  ),
  http.post(
    api('/tecnicos'),
    ruta(async ({ db, user, request }) => {
      exigir(user, 'gerente');
      const t = { ...(await body<TecnicoInput>(request)), id: nextId(db, 'tec') };
      db.tecnicos.push(t);
      return t;
    }),
  ),
  http.put(
    api('/tecnicos/:id'),
    ruta(async ({ db, user, request, p }) => {
      exigir(user, 'gerente');
      return Object.assign(
        buscar(db.tecnicos, p('id'), 'Técnico'),
        await body<TecnicoInput>(request),
      );
    }),
  ),

  /* ------------------------------ Cartera ------------------------------ */
  http.get(
    api('/facturas'),
    ruta(({ db, user, now }) => {
      exigir(user, 'gerente');
      return db.facturas
        .map((f) => resumenFactura(db, f, now))
        .sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));
    }),
  ),
  http.post(
    api('/facturas/generar'),
    ruta(async ({ db, user, request, now }) => {
      exigir(user, 'gerente');
      const { periodo } = await body<{ periodo: string }>(request);
      if (!/^\d{4}-\d{2}$/.test(periodo ?? ''))
        throw new HttpError(400, 'Periodo inválido (AAAA-MM).');
      return generarFacturacion(db, periodo, now).map((f) => resumenFactura(db, f, now));
    }),
  ),
  http.post(
    api('/facturas/:id/pago'),
    ruta(async ({ db, user, request, now, p }) => {
      exigir(user, 'gerente');
      const f = buscar(db.facturas, p('id'), 'Factura');
      if (f.estado === 'pagada') throw new HttpError(409, 'La factura ya está pagada.');
      const { fechaPago } = await body<{ fechaPago?: string }>(request);
      f.estado = 'pagada';
      f.fechaPago = fechaPago ?? now.toISOString().slice(0, 10);
      return resumenFactura(db, f, now);
    }),
  ),

  /* ------------------------- Alertas e informes ------------------------- */
  http.get(
    api('/alertas'),
    ruta(({ db, user, now }) => {
      exigir(user, ...GESTION);
      return calcularAlertas(db, now);
    }),
  ),
  http.get(
    api('/informes/dashboard'),
    ruta(({ db, user, now }) => {
      exigir(user, ...GESTION);
      return dashboard(db, now);
    }),
  ),
  http.get(
    api('/informes/casos'),
    ruta(({ db, user, now }) => {
      exigir(user, ...GESTION);
      return informeCasos(db, now);
    }),
  ),
  http.get(
    api('/informes/personal'),
    ruta(({ db, user, now }) => {
      exigir(user, 'gerente');
      return informePersonal(db, now);
    }),
  ),
  http.get(
    api('/informes/inventario'),
    ruta(({ db, user, now }) => {
      exigir(user, 'gerente');
      return informeInventario(db, now);
    }),
  ),
  http.get(
    api('/informes/contratos'),
    ruta(({ db, user, now }) => {
      exigir(user, 'gerente');
      return informeContratos(db, now);
    }),
  ),
  http.get(
    api('/informes/cartera'),
    ruta(({ db, user, now }) => {
      exigir(user, 'gerente');
      return informeCartera(db, now);
    }),
  ),
];
