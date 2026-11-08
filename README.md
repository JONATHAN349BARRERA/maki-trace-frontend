# MAKI-TRACE · Frontend

Sistema de información web para la gestión de contratos de arriendo y posventa de
equipos multifuncionales en **Maki Import Group S.A.S.**

Trabajo de grado — Ingeniería de Sistemas, Universidad El Bosque.
Proponentes: Samuel Mesa Comaz, Jonathan Barrera Fernández y Juan David Guarnizo Martínez.

> **Alcance de este repositorio:** frontend funcional e interactivo. No necesita base
> de datos ni servidor: la API REST se simula en el propio navegador
> ([Mock Service Worker](https://mswjs.io/)) con datos de demostración que se
> guardan en el navegador. Cuando exista el backend real, basta con cambiar
> `VITE_USE_MOCKS=false` y `VITE_API_URL` (ver [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md)).

## Ver la aplicación en línea

**https://jonathan349barrera.github.io/maki-trace-frontend/**

Se publica automáticamente en GitHub Pages cada vez que se integra un cambio a `main`
(flujo `.github/workflows/pages.yml`). Funciona en computador y celular; los datos de
demostración viven en el navegador de cada persona.

## Cómo ejecutarlo localmente

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abra <http://localhost:5173> e ingrese con un usuario de demostración
(contraseña para todos: `maki2026`; en la pantalla de inicio hay botones que la llenan):

| Usuario    | Rol                 | Qué puede hacer                                                  |
| ---------- | ------------------- | ---------------------------------------------------------------- |
| `gerente`  | Gerente             | Tablero, contratos, informes, cartera, usuarios y roles          |
| `gestor`   | Gestor de servicios | Aprobar, rechazar y asignar casos, inventario, equipos           |
| `tecnico`  | Personal técnico    | Sus casos, escanear QR, hoja de vida, registrar trabajo y cerrar |
| `cliente`  | Cliente (colegio)   | Portal, solicitudes de autogestión y seguimiento                 |
| `cliente2` | Cliente (papelería) | Igual, con un contrato posventa **sin** repuestos ni suministros |

Para volver a los datos iniciales: **Usuarios y roles → Restablecer datos demo** (como gerente).

## Scripts

| Comando                 | Descripción                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo                            |
| `npm run build`         | Verificación de tipos y build de producción       |
| `npm test`              | Pruebas unitarias y de integración (Vitest)       |
| `npm run test:coverage` | Pruebas con reporte de cobertura (umbral 75 %)    |
| `npm run lint`          | ESLint                                            |
| `npm run format`        | Prettier                                          |
| `npm run ci`            | Todo lo anterior, igual que el pipeline de GitHub |

## Documentación

- [Trazabilidad propuesta → aplicación](docs/TRAZABILIDAD.md): dónde está cada cosa prometida en la propuesta.
- [Guion de prueba con usuarios](docs/GUIA-PRUEBA-USUARIO.md): tareas para grabar a una persona usando la aplicación.
- [Arquitectura](docs/ARQUITECTURA.md) y [contrato de la API REST](docs/API.md).
- [Cómo contribuir](CONTRIBUTING.md): GitHub Flow, historias de usuario y definición de terminado.

## Stack

React 19 · TypeScript (estricto) · Vite · Tailwind CSS · React Router · TanStack Query ·
React Hook Form + Zod · Recharts · qrcode.react / html5-qrcode · MSW · Vitest + Testing Library ·
ESLint + Prettier · GitHub Actions.
