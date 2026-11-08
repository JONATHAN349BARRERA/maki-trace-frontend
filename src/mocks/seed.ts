/**
 * Datos de demostración. Las fechas se calculan relativas a "ahora" para que la
 * demo siempre muestre contratos por vencer, casos demorados, cartera vencida, etc.
 *
 * Los casos se generan ejecutando los mismos casos de uso del backend (crear,
 * aprobar, asignar, iniciar, cerrar), así la hoja de vida, el inventario y los
 * movimientos quedan coherentes entre sí.
 */
import type { Usuario } from '@/modules/auth/types';
import type { TipoCaso } from '@/modules/casos/types';
import type { Componente, Contrato } from '@/modules/contratos/types';
import type { Equipo } from '@/modules/equipos/types';
import { aprobarCaso, asignarCaso, cerrarCaso, crearCaso, generarFacturacion, iniciarCaso } from './backend';
import type { Db } from './db';

const DAY = 86_400_000;
const HOUR = 3_600_000;
const fecha = (now: Date, deltaDias: number) => new Date(now.getTime() + deltaDias * DAY).toISOString().slice(0, 10);

/** Contraseñas de demostración (documentadas en el README). Solo existen en el backend simulado. */
export const DEMO_PASSWORD = 'maki2026';

export function crearSeed(now: Date = new Date()): Db {
  const db: Db = {
    usuarios: [],
    clientes: [],
    contratos: [],
    equipos: [],
    items: [],
    movimientos: [],
    casos: [],
    tecnicos: [],
    facturas: [],
    archivos: {},
    secuencias: { caso: 0, factura: 0, id: 1000 },
  };

  db.clientes = [
    { id: 'cli-1', nit: '900123456-1', razonSocial: 'Colegio San Ángel', tipo: 'educativa', contacto: 'María Rodríguez', telefono: '3104567890', email: 'compras@colegiosanangel.edu.co', direccion: 'Cra 15 # 85-20', ciudad: 'Bogotá' },
    { id: 'cli-2', nit: '901987654-3', razonSocial: 'Papelería El Estudiante', tipo: 'papeleria', contacto: 'Luis Gómez', telefono: '3201112233', email: 'papeleriaestudiante@gmail.com', direccion: 'Cl 45 # 13-08', ciudad: 'Bogotá' },
    { id: 'cli-3', nit: '860555777-9', razonSocial: 'Logística Andina S.A.S.', tipo: 'empresa', contacto: 'Andrea Pardo', telefono: '3157778899', email: 'admin@logandina.com', direccion: 'Av. El Dorado # 68C-61', ciudad: 'Bogotá' },
    { id: 'cli-4', nit: '890444222-5', razonSocial: 'Universidad del Norte Andino', tipo: 'educativa', contacto: 'Jaime Ospina', telefono: '3005553322', email: 'recursos@unandino.edu.co', direccion: 'Cl 100 # 7-33', ciudad: 'Medellín' },
    { id: 'cli-5', nit: '901222333-0', razonSocial: 'Copias Express Chapinero', tipo: 'papeleria', contacto: 'Paola Ríos', telefono: '3176665544', email: 'copiasexpress@gmail.com', direccion: 'Cra 13 # 60-12', ciudad: 'Bogotá' },
  ];

  const todos: Componente[] = ['preventivo', 'correctivo', 'repuestos', 'suministros'];
  const contrato = (id: string, numero: string, clienteId: string, modalidad: Contrato['modalidad'], ini: number, fin: number, valor: number, componentes: Componente[], observaciones?: string): Contrato => ({
    id, numero, clienteId, modalidad, fechaInicio: fecha(now, ini), fechaFin: fecha(now, fin), valor, componentes, observaciones,
  });
  db.contratos = [
    contrato('con-1', 'ARR-2025-001', 'cli-1', 'arriendo', -300, 430, 450_000, todos, 'Incluye 3.000 copias mensuales por equipo.'),
    // Posventa SIN repuestos ni suministros: sirve para el criterio de aceptación 1.
    contrato('con-2', 'POS-2025-002', 'cli-2', 'posventa', -200, 165, 1_800_000, ['preventivo', 'correctivo'], 'Equipo vendido. Solo mantenimiento.'),
    contrato('con-3', 'ARR-2025-003', 'cli-3', 'arriendo', -340, 20, 620_000, todos, 'Renovación en negociación.'),
    contrato('con-4', 'ARR-2024-004', 'cli-4', 'arriendo', -720, -25, 380_000, ['preventivo', 'correctivo', 'repuestos']),
    contrato('con-5', 'POS-2026-005', 'cli-5', 'posventa', -60, 305, 2_400_000, ['preventivo', 'correctivo', 'repuestos']),
    contrato('con-6', 'ARR-2026-006', 'cli-1', 'arriendo', -90, 640, 520_000, todos),
  ];

  const equipo = (id: string, serial: string, modelo: string, contratoId: string | null, ubicacion: string, instDias: number, garantiaDias: number, contador: number, color: boolean, ppm: number): Equipo => ({
    id,
    serial,
    marca: 'Toshiba',
    modelo,
    caracteristicas: `Multifuncional ${color ? 'a color' : 'monocromático'} ${modelo}: impresión, copia y escaneo en red.`,
    capacidades: { ppm, color, duplex: true, escaner: true, formatos: ['Carta', 'Oficio', 'A4', 'A3'] },
    fotos: [],
    contratoId,
    clienteId: db.contratos.find((c) => c.id === contratoId)?.clienteId ?? null,
    ubicacion,
    fechaInstalacion: fecha(now, instDias),
    garantiaHasta: fecha(now, garantiaDias),
    lecturas: [{ fecha: new Date(now.getTime() + instDias * DAY).toISOString(), valor: contador, fuente: 'instalacion' }],
    historial: [],
  });
  db.equipos = [
    equipo('eq-1', 'CNCJ71234', 'e-STUDIO 3018A', 'con-1', 'Colegio San Ángel · Rectoría, piso 2', -300, 65, 120_000, false, 30),
    equipo('eq-2', 'CNCJ71235', 'e-STUDIO 3018A', 'con-1', 'Colegio San Ángel · Sala de profesores', -300, 65, 98_500, false, 30),
    equipo('eq-3', 'CNEK45001', 'e-STUDIO 2525AC', 'con-2', 'Papelería El Estudiante · Mostrador', -200, 165, 54_000, true, 25),
    equipo('eq-4', 'CNFM88010', 'e-STUDIO 5018A', 'con-3', 'Logística Andina · Bodega 1, despachos', -340, 25, 410_000, false, 50),
    equipo('eq-5', 'CNFM88011', 'e-STUDIO 4518A', 'con-3', 'Logística Andina · Contabilidad', -340, 25, 230_000, false, 45),
    equipo('eq-6', 'CNGB20330', 'e-STUDIO 3525AC', 'con-4', 'Universidad Norte Andino · Biblioteca', -720, -360, 650_000, true, 35),
    equipo('eq-7', 'CNHA90777', 'e-STUDIO 3525AC', 'con-5', 'Copias Express · Local principal', -60, 305, 18_000, true, 35),
    equipo('eq-8', 'CNCJ71301', 'e-STUDIO 3018A', 'con-6', 'Colegio San Ángel · Coordinación académica', -90, 640, 15_200, false, 30),
    equipo('eq-9', 'CNEK45100', 'e-STUDIO 2525AC', null, 'Bodega Maki Import · Disponible', -10, 355, 0, true, 25),
  ];
  // Lecturas de contador recientes reportadas por el cliente (base para medir consumo).
  db.equipos.find((e) => e.id === 'eq-3')!.lecturas.push({ fecha: new Date(now.getTime() - 7 * DAY).toISOString(), valor: 54_900, fuente: 'cliente' });

  db.items = [
    { id: 'it-1', codigo: 'T-3018', nombre: 'Tóner T-3018 negro', tipo: 'suministro', costoUnitario: 185_000, existencias: 14, minimo: 6, modelosCompatibles: ['e-STUDIO 3018A', 'e-STUDIO 4518A', 'e-STUDIO 5018A'], rendimientoCopias: 43_900 },
    { id: 'it-2', codigo: 'T-FC330K', nombre: 'Tóner T-FC330 negro', tipo: 'suministro', costoUnitario: 210_000, existencias: 5, minimo: 4, modelosCompatibles: ['e-STUDIO 2525AC', 'e-STUDIO 3525AC'], rendimientoCopias: 38_400 },
    { id: 'it-3', codigo: 'T-FC330C', nombre: 'Tóner T-FC330 cian', tipo: 'suministro', costoUnitario: 260_000, existencias: 2, minimo: 3, modelosCompatibles: ['e-STUDIO 2525AC', 'e-STUDIO 3525AC'], rendimientoCopias: 33_600 },
    { id: 'it-4', codigo: 'OD-3018', nombre: 'Tambor OD-3018', tipo: 'repuesto', costoUnitario: 320_000, existencias: 4, minimo: 2, modelosCompatibles: ['e-STUDIO 3018A', 'e-STUDIO 4518A', 'e-STUDIO 5018A'] },
    { id: 'it-5', codigo: 'FUS-5018', nombre: 'Unidad de fusor 5018', tipo: 'repuesto', costoUnitario: 890_000, existencias: 1, minimo: 1, modelosCompatibles: ['e-STUDIO 4518A', 'e-STUDIO 5018A'] },
    { id: 'it-6', codigo: 'RDL-PU', nombre: 'Kit rodillos de recogida', tipo: 'repuesto', costoUnitario: 95_000, existencias: 12, minimo: 5, modelosCompatibles: ['e-STUDIO 3018A', 'e-STUDIO 4518A', 'e-STUDIO 5018A', 'e-STUDIO 2525AC', 'e-STUDIO 3525AC'] },
    { id: 'it-7', codigo: 'BLD-CL', nombre: 'Cuchilla de limpieza de tambor', tipo: 'repuesto', costoUnitario: 68_000, existencias: 9, minimo: 4, modelosCompatibles: ['e-STUDIO 3018A', 'e-STUDIO 4518A', 'e-STUDIO 5018A'] },
    { id: 'it-8', codigo: 'TRB-2525', nombre: 'Banda de transferencia 2525/3525', tipo: 'repuesto', costoUnitario: 740_000, existencias: 2, minimo: 1, modelosCompatibles: ['e-STUDIO 2525AC', 'e-STUDIO 3525AC'] },
  ];

  db.tecnicos = [
    { id: 'tec-1', nombre: 'Carlos Ramírez', documento: '1020304050', telefono: '3001234567', email: 'carlos.ramirez@makiimport.co', zona: 'Bogotá norte', especialidad: 'Equipos monocromáticos alto volumen', activo: true },
    { id: 'tec-2', nombre: 'Diana Torres', documento: '1030405060', telefono: '3019876543', email: 'diana.torres@makiimport.co', zona: 'Bogotá centro y sur', especialidad: 'Equipos a color', activo: true },
    { id: 'tec-3', nombre: 'Hernán Velásquez', documento: '71234567', telefono: '3125554433', email: 'hernan.velasquez@makiimport.co', zona: 'Medellín', especialidad: 'Mantenimiento general', activo: true },
  ];

  const u = (id: string, nombre: string, usuario: string, email: string, rol: Usuario['rol'], extra: Partial<Usuario> = {}) => ({
    id, nombre, usuario, email, rol, activo: true, password: DEMO_PASSWORD, ...extra,
  });
  db.usuarios = [
    u('usr-1', 'Jorge Ballesteros', 'gerente', 'makiimportgroup@gmail.com', 'gerente'),
    u('usr-2', 'Sandra Moreno', 'gestor', 'servicios@makiimport.co', 'gestor'),
    u('usr-3', 'Carlos Ramírez', 'tecnico', 'carlos.ramirez@makiimport.co', 'tecnico', { tecnicoId: 'tec-1' }),
    u('usr-4', 'Diana Torres', 'tecnico2', 'diana.torres@makiimport.co', 'tecnico', { tecnicoId: 'tec-2' }),
    u('usr-5', 'Hernán Velásquez', 'tecnico3', 'hernan.velasquez@makiimport.co', 'tecnico', { tecnicoId: 'tec-3' }),
    u('usr-6', 'María Rodríguez', 'cliente', 'compras@colegiosanangel.edu.co', 'cliente', { clienteId: 'cli-1' }),
    u('usr-7', 'Luis Gómez', 'cliente2', 'papeleriaestudiante@gmail.com', 'cliente', { clienteId: 'cli-2' }),
  ];

  const [gerente, gestor, tec1, tec2, tec3, cliente1, cliente2] = db.usuarios as unknown as [Usuario, Usuario, Usuario, Usuario, Usuario, Usuario, Usuario];
  const tecUsuario: Record<string, Usuario> = { 'tec-1': tec1, 'tec-2': tec2, 'tec-3': tec3 };
  const t = (horasAtras: number) => new Date(now.getTime() - horasAtras * HOUR);

  /** Entrada inicial de inventario registrada hace 120 días. */
  for (const it of db.items) {
    db.movimientos.push({ id: `mov-ini-${it.id}`, itemId: it.id, tipo: 'entrada', cantidad: it.existencias, costoUnitario: it.costoUnitario, fecha: t(120 * 24).toISOString(), usuarioNombre: gerente.nombre, nota: 'Inventario inicial' });
  }

  interface Plan {
    equipoId: string;
    tipo: TipoCaso;
    descripcion: string;
    solicitados?: { itemId: string; cantidad: number }[];
    por: Usuario;
    hace: number; // horas desde el registro
    hasta: 'registrado' | 'aprobado' | 'asignado' | 'en_atencion' | 'cerrado';
    tecnicoId?: string;
    trabajo?: string;
    usados?: { itemId: string; cantidad: number }[];
    contadorSuma?: number;
  }
  const planes: Plan[] = [
    { equipoId: 'eq-1', tipo: 'mantenimiento', descripcion: 'Mantenimiento preventivo trimestral.', por: gestor, hace: 24 * 80, hasta: 'cerrado', tecnicoId: 'tec-1', trabajo: 'Limpieza general, cambio de rodillos de recogida y calibración.', usados: [{ itemId: 'it-6', cantidad: 1 }], contadorSuma: 9_000 },
    { equipoId: 'eq-4', tipo: 'suministro', descripcion: 'Solicitan tóner negro.', solicitados: [{ itemId: 'it-1', cantidad: 2 }], por: gestor, hace: 24 * 60, hasta: 'cerrado', tecnicoId: 'tec-1', trabajo: 'Entrega de 2 tóneres T-3018 en bodega.', usados: [{ itemId: 'it-1', cantidad: 2 }], contadorSuma: 30_000 },
    { equipoId: 'eq-6', tipo: 'falla', descripcion: 'Atasco de papel recurrente en bandeja 2.', por: gestor, hace: 24 * 45, hasta: 'cerrado', tecnicoId: 'tec-3', trabajo: 'Se reemplazó kit de rodillos y se ajustó la guía de la bandeja 2.', usados: [{ itemId: 'it-6', cantidad: 1 }], contadorSuma: 12_000 },
    { equipoId: 'eq-3', tipo: 'falla', descripcion: 'Las copias salen con manchas de color.', por: cliente2, hace: 24 * 30, hasta: 'cerrado', tecnicoId: 'tec-2', trabajo: 'Limpieza de banda de transferencia y calibración de color.', usados: [], contadorSuma: 500 },
    { equipoId: 'eq-5', tipo: 'repuesto', descripcion: 'Requiere cambio de tambor, imprime con rayas.', solicitados: [{ itemId: 'it-4', cantidad: 1 }], por: gestor, hace: 24 * 20, hasta: 'cerrado', tecnicoId: 'tec-1', trabajo: 'Cambio de tambor OD-3018 y cuchilla de limpieza.', usados: [{ itemId: 'it-4', cantidad: 1 }, { itemId: 'it-7', cantidad: 1 }], contadorSuma: 25_000 },
    { equipoId: 'eq-7', tipo: 'suministro', descripcion: 'Tóner negro y cian.', solicitados: [{ itemId: 'it-2', cantidad: 1 }, { itemId: 'it-3', cantidad: 1 }], por: gestor, hace: 24 * 12, hasta: 'cerrado', tecnicoId: 'tec-2', trabajo: 'Entrega de tóner negro y cian.', usados: [{ itemId: 'it-2', cantidad: 1 }, { itemId: 'it-3', cantidad: 1 }], contadorSuma: 8_000 },
    { equipoId: 'eq-2', tipo: 'falla', descripcion: 'El equipo muestra código de error C449.', por: cliente1, hace: 50, hasta: 'en_atencion', tecnicoId: 'tec-1' },
    { equipoId: 'eq-4', tipo: 'falla', descripcion: 'Ruido fuerte en la unidad de fusión.', por: gestor, hace: 30, hasta: 'asignado', tecnicoId: 'tec-1' },
    { equipoId: 'eq-6', tipo: 'mantenimiento', descripcion: 'Mantenimiento preventivo semestral.', por: gestor, hace: 20, hasta: 'aprobado' },
    { equipoId: 'eq-8', tipo: 'suministro', descripcion: 'Necesitamos tóner para el equipo de coordinación.', solicitados: [{ itemId: 'it-1', cantidad: 1 }], por: cliente1, hace: 6, hasta: 'registrado' },
    // Consumo anómalo: 900 copias en la última semana y piden 3 tóneres (rinden 38.400 c/u).
    { equipoId: 'eq-3', tipo: 'suministro', descripcion: 'Por favor enviar 3 tóneres negros.', solicitados: [{ itemId: 'it-2', cantidad: 3 }], por: cliente2, hace: 4, hasta: 'registrado' },
    // Contrato sin repuestos: criterio de aceptación 1.
    { equipoId: 'eq-3', tipo: 'repuesto', descripcion: 'Cambiar kit de rodillos, no toma el papel.', solicitados: [{ itemId: 'it-6', cantidad: 1 }], por: cliente2, hace: 2, hasta: 'registrado' },
    { equipoId: 'eq-1', tipo: 'falla', descripcion: 'No escanea a correo electrónico.', por: cliente1, hace: 1, hasta: 'registrado' },
  ];

  for (const p of planes) {
    const inicio = t(p.hace);
    const contador = db.equipos.find((e) => e.id === p.equipoId)!.lecturas.at(-1)!.valor;
    const caso = crearCaso(db, { equipoId: p.equipoId, tipo: p.tipo, descripcion: p.descripcion, itemsSolicitados: p.solicitados ?? [] }, p.por, inicio);
    if (p.hasta === 'registrado') continue;
    aprobarCaso(db, caso.id, gestor, { confirmarAdvertencias: true }, new Date(inicio.getTime() + 1 * HOUR));
    if (p.hasta === 'aprobado') continue;
    const fechaProg = new Date(inicio.getTime() + 20 * HOUR).toISOString().slice(0, 16);
    asignarCaso(db, caso.id, gestor, { tecnicoId: p.tecnicoId!, fechaProgramada: fechaProg }, new Date(inicio.getTime() + 2 * HOUR));
    if (p.hasta === 'asignado') continue;
    const tecnico = tecUsuario[p.tecnicoId!]!;
    iniciarCaso(db, caso.id, tecnico, new Date(inicio.getTime() + (p.hasta === 'cerrado' ? 18 : 40) * HOUR));
    if (p.hasta === 'en_atencion') continue;
    cerrarCaso(db, caso.id, tecnico, { descripcion: p.trabajo!, itemsUsados: p.usados ?? [], contador: contador + (p.contadorSuma ?? 0) }, new Date(inicio.getTime() + 21 * HOUR));
  }

  // Facturación de arriendos de los últimos 6 meses; los meses antiguos ya pagados.
  for (let m = 5; m >= 0; m--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1));
    const periodo = d.toISOString().slice(0, 7);
    const emision = new Date(d.getTime() + 2 * DAY);
    const creadas = generarFacturacion(db, periodo, emision);
    for (const f of creadas) {
      const pagada = m >= 2 || (m === 1 && f.clienteId !== 'cli-3');
      if (pagada) {
        f.estado = 'pagada';
        f.fechaPago = new Date(emision.getTime() + 20 * DAY).toISOString().slice(0, 10);
      }
    }
  }
  // La Universidad no pagó los dos últimos meses de su contrato vencido.
  for (const f of db.facturas.filter((x) => x.clienteId === 'cli-4').slice(-2)) {
    f.estado = 'pendiente';
    delete f.fechaPago;
  }

  return db;
}
