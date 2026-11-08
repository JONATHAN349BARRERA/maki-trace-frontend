# Trazabilidad: propuesta → aplicación

Cada compromiso del documento de propuesta y dónde se cumple en el frontend.
Rutas relativas a la aplicación (por ejemplo `/casos`).

## 1.3 Dolores concretos

| Dolor                                                                               | Cómo lo resuelve la aplicación                                                     | Dónde                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| Desconocimiento del estado de los contratos (vigencia, modalidad, valor, qué cubre) | Lista con estado de vigencia, modalidad, valor y componentes; detalle por contrato | `/contratos`, `/contratos/:id`          |
| Solicitudes de servicio dispersas                                                   | Formulario de autogestión; cada solicitud es un caso con consecutivo               | `/portal/solicitud`, `/casos`           |
| No hay hoja de vida por equipo                                                      | Hoja de vida con características, fotos, contrato, garantía, repuestos e historial | `/equipos/:id`                          |
| No hay seguimiento al personal técnico                                              | Ficha por técnico: asignaciones, dónde, cuándo, qué hizo y tiempos                 | `/personal/:id`                         |
| No se costean repuestos y suministros                                               | Costo por caso, por equipo, por contrato y por técnico                             | Detalle de caso, hoja de vida, informes |
| Consumos anómalos no detectados                                                     | Validación de consumo vs. contador de copias y rendimiento del suministro          | Al aprobar un caso, `/alertas`          |
| Sin control de vigencias de contratos ni garantías                                  | Alertas de contratos y garantías por vencer / vencidos                             | `/alertas`, campana de alertas          |

## 2. Actores (vistas diferenciadas por rol)

| Actor               | Beneficio esperado                                                           | Dónde                                              |
| ------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Gerente             | Informes de contratos, casos, inventario y personal                          | `/`, `/informes`, `/cartera`                       |
| Gestor de servicios | Gestiona cada caso con consecutivo, verifica cobertura, sabe en qué punto va | `/casos`, `/casos/:id`                             |
| Personal técnico    | Consulta la hoja de vida escaneando el QR y registra trabajo y repuestos     | `/tecnico`, `/escanear`, `/equipos/serial/:serial` |
| Cliente             | Registra su solicitud en un formulario de autogestión y consulta el estado   | `/portal`, `/portal/solicitud`, `/casos`           |

## 3.2 Módulos

| #   | Módulo                       | Funcionalidades                                                                                                                          | Dónde                                           |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | Gestión de contratos         | Vigencia, modalidad (arriendo/posventa), valor y componentes incluidos                                                                   | `/contratos` (+ `/clientes`)                    |
| 2   | Gestión de servicios (casos) | Autogestión, consecutivo, aprobar, asignar, atender, cerrar, registro de cada paso; tipos falla, mantenimiento, repuestos, suministros   | `/casos`, `/casos/:id`, `/portal/solicitud`     |
| 3   | Hoja de vida de equipos      | Características, fotos, contrato, capacidades, repuestos que usa, garantías, historial alimentado por los casos; QR por serial           | `/equipos/:id`                                  |
| 4   | Repuestos y suministros      | Entradas, salidas, existencias, alertas de faltantes, validación de compatibilidad y de consumo                                          | `/inventario`, `/inventario/:id`                |
| 5   | Personal técnico             | Quién atiende, dónde, cuándo y qué hizo                                                                                                  | `/personal`, `/personal/:id`                    |
| 6   | Administración e informes    | Tablero; informes de casos (estado y demorados), personal, inventario (rotación y escasez), uso de contratos y cartera; usuarios y roles | `/`, `/informes`, `/cartera`, `/admin/usuarios` |

## 4.3 Tendencias incorporadas

| Tendencia                                    | Implementación                                                                                                                                 |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Acercar técnico y máquina al sistema (QR) | Etiqueta QR imprimible por equipo; escáner con la cámara del celular; al escanear ve último mantenimiento, casos pendientes y repuestos usados |
| 2. Mantenimiento basado en datos del equipo  | Lecturas del contador; el ejemplo de la propuesta (1.000 copias, tóner de 20.000, piden 3) se marca como consumo anómalo                       |
| 3. Analítica sobre el histórico              | Informes de rotación, consumo por contrato, tiempos de atención                                                                                |
| 4. Monitoreo remoto                          | Fuera del alcance del MVP; el registro de contadores deja la base de datos lista                                                               |

## 7. Criterios de aceptación

| #   | Criterio                                                                      | Dónde se ve                                                   | Prueba automatizada                       |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------- |
| 1   | Contrato sin repuestos + cliente pide repuesto → se advierte antes de aprobar | Caso `CASO-2026-0012` → Aprobar                               | `src/test/integracion/criterios.test.tsx` |
| 2   | Al cerrar un caso, el servicio y los repuestos aparecen en la hoja de vida    | Técnico cierra `CASO-2026-0007` → hoja de vida de `CNCJ71235` | ídem                                      |
| 3   | Existencia bajo el mínimo → alerta                                            | Inventario → registrar salida → alerta                        | ídem                                      |
| 4   | El informe de casos muestra estado y demorados                                | `/informes?tab=casos`                                         | ídem                                      |

## 8.1 Arquitectura

| Compromiso                                          | Implementación                                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Aplicación web adaptable a computador y celular     | Diseño responsive; menú lateral en escritorio y desplegable en celular                                  |
| Vistas diferenciadas por rol                        | Menú y rutas filtradas por la matriz de permisos (`src/modules/auth/domain/permisos.ts`)                |
| Módulos con sus propias reglas                      | `src/modules/*/domain`                                                                                  |
| Interfaces entre módulos al aprobar y cerrar        | Aprobar consulta cobertura de Contratos; cerrar actualiza Equipos e Inventario (`src/mocks/backend.ts`) |
| API REST con JSON como única puerta de entrada      | `src/shared/api/http.ts`, contrato en [API.md](API.md)                                                  |
| Fotos como archivos; la base guarda la referencia   | `POST /equipos/:id/fotos` devuelve la URL `/api/archivos/:id`                                           |
| Autenticación usuario/contraseña y permisos por rol | `/login`; un cliente solo ve equipos y casos de sus contratos                                           |

## 9.1 Prácticas de ingeniería

| Práctica                                                                  | Evidencia                                                      |
| ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Historias de usuario con criterios de aceptación                          | `.github/ISSUE_TEMPLATE/historia-de-usuario.md`                |
| Definición de terminado (revisión, pruebas, cobertura ≥ 75 %, demo al PO) | `.github/pull_request_template.md`, umbral en `vite.config.ts` |
| GitHub Flow, ramas cortas, PR aprobado, etiquetas de versión              | `CONTRIBUTING.md`, historial de git                            |
| Pruebas unitarias por módulo e integración entre módulos                  | `src/**/*.test.ts(x)`                                          |
| Integración continua en cada PR                                           | `.github/workflows/ci.yml`                                     |

## Fuera de alcance (§6)

Modelo predictivo de mora, agente de WhatsApp, bloqueo remoto / llave prepago,
integración con World Office y aplicación móvil nativa. **No** se implementan.
