import type { Usuario } from '@/modules/auth/types';
import type { Caso } from '@/modules/casos/types';
import type { Cliente } from '@/modules/clientes/types';
import type { Contrato } from '@/modules/contratos/types';
import type { Equipo } from '@/modules/equipos/types';
import type { Factura } from '@/modules/cartera/types';
import type { Item, Movimiento } from '@/modules/inventario/types';
import type { Tecnico } from '@/modules/personal/types';

/**
 * Base de datos en memoria del backend simulado. Agrupa las "tablas" por módulo
 * igual que la base de datos relacional única de la propuesta (§8.1).
 */
export interface Db {
  usuarios: (Usuario & { password: string })[];
  clientes: Cliente[];
  contratos: Contrato[];
  equipos: Equipo[];
  items: Item[];
  movimientos: Movimiento[];
  casos: Caso[];
  tecnicos: Tecnico[];
  facturas: Factura[];
  /** Archivos (fotos de equipos); la entidad guarda solo la referencia /api/archivos/:id. */
  archivos: Record<string, { tipo: string; data: string }>;
  secuencias: { caso: number; factura: number; id: number };
}

const STORAGE_KEY = 'maki-trace.mock-db.v1';

let db: Db | null = null;
let seedFactory: (() => Db) | null = null;

export function configureSeed(factory: () => Db) {
  seedFactory = factory;
}

function load(): Db | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Db) : null;
  } catch {
    return null;
  }
}

export function getDb(): Db {
  if (!db) {
    db = load();
    if (!db) {
      if (!seedFactory) throw new Error('No hay datos semilla configurados.');
      db = seedFactory();
      persist();
    }
  }
  return db;
}

export function persist() {
  try {
    if (db) localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* sin almacenamiento: los datos viven solo en memoria */
  }
}

export function resetDb() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignorar */
  }
  db = null;
  return getDb();
}

export function nextId(d: Db, prefix: string) {
  d.secuencias.id += 1;
  return `${prefix}-${d.secuencias.id}`;
}
