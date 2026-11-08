import type { Rol } from '../types';

/**
 * Matriz de permisos por rol (propuesta §8.1: "cada actor solo ve y modifica la
 * información que le corresponde"). Es la fuente única para menús y rutas.
 */
export type Permiso =
  | 'dashboard'
  | 'contratos:ver'
  | 'contratos:editar'
  | 'clientes:ver'
  | 'clientes:editar'
  | 'casos:ver'
  | 'casos:gestionar'
  | 'casos:crear'
  | 'casos:atender'
  | 'equipos:ver'
  | 'equipos:editar'
  | 'inventario:ver'
  | 'inventario:editar'
  | 'personal:ver'
  | 'personal:editar'
  | 'informes:ver'
  | 'cartera:ver'
  | 'cartera:editar'
  | 'usuarios:administrar'
  | 'qr:escanear';

const MATRIZ: Record<Rol, Permiso[]> = {
  gerente: [
    'dashboard',
    'contratos:ver',
    'contratos:editar',
    'clientes:ver',
    'clientes:editar',
    'casos:ver',
    'casos:gestionar',
    'equipos:ver',
    'equipos:editar',
    'inventario:ver',
    'personal:ver',
    'personal:editar',
    'informes:ver',
    'cartera:ver',
    'cartera:editar',
    'usuarios:administrar',
  ],
  gestor: [
    'dashboard',
    'contratos:ver',
    'clientes:ver',
    'casos:ver',
    'casos:gestionar',
    'casos:crear',
    'equipos:ver',
    'equipos:editar',
    'inventario:ver',
    'inventario:editar',
    'personal:ver',
    'informes:ver',
    'qr:escanear',
  ],
  tecnico: ['casos:ver', 'casos:atender', 'equipos:ver', 'qr:escanear'],
  cliente: ['contratos:ver', 'casos:ver', 'casos:crear', 'equipos:ver'],
};

export const puede = (rol: Rol | undefined, permiso: Permiso) =>
  !!rol && MATRIZ[rol].includes(permiso);

export const permisosDe = (rol: Rol) => [...MATRIZ[rol]];

export const rutaInicial = (rol: Rol) =>
  ({ gerente: '/', gestor: '/', tecnico: '/tecnico', cliente: '/portal' })[rol];
