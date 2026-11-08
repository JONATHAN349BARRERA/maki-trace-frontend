# Arquitectura del frontend

Implementa la **capa de presentación** del monolito modular descrito en la
propuesta (§8.1).

```
Navegador
 ├─ Capa de presentación (este repositorio)
 │   ├─ app/          enrutador, layout y menú por rol
 │   ├─ modules/*     pantallas por módulo
 │   └─ shared/api    cliente HTTP único (REST + JSON + token)
 │
 └─ API REST  ── en desarrollo: backend simulado con MSW (src/mocks)
                 en producción: backend real en VITE_API_URL
```

## Decisiones

| Decisión                                                                                                           | Motivo                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Organización por **módulos de negocio** (`contratos`, `casos`, `equipos`, `inventario`, `personal`, `informes`, …) | Refleja los seis módulos de la propuesta; cada equipo/historia toca un módulo                                                            |
| Reglas de negocio en `domain/` como **funciones puras**                                                            | Se prueban sin interfaz y se reutilizan (frontend avisa; backend decide)                                                                 |
| **TanStack Query** para datos del servidor                                                                         | Caché, reintentos e invalidación tras cada acción (al cerrar un caso se refrescan equipos, inventario, alertas e informes)               |
| **MSW** como backend simulado                                                                                      | El frontend habla REST real (`fetch`) desde ya; cambiar al backend definitivo no requiere tocar pantallas                                |
| **React Hook Form + Zod**                                                                                          | Validación declarativa y mensajes en español                                                                                             |
| Rutas con **carga diferida**                                                                                       | Cada módulo se descarga solo cuando se usa (importante en el celular del técnico)                                                        |
| **Matriz de permisos** única (`auth/domain/permisos.ts`)                                                           | Menú, rutas y botones se derivan de la misma fuente                                                                                      |
| Accesibilidad                                                                                                      | Etiquetas en todos los campos, roles ARIA en diálogos y pestañas, estados no solo por color, paleta de gráficos validada para daltonismo |

## Backend simulado (`src/mocks`)

- `seed.ts` — datos de demostración con fechas relativas a hoy (siempre hay casos
  demorados, contratos por vencer, cartera vencida…). Los casos se generan
  ejecutando los mismos casos de uso, así todo es coherente.
- `backend.ts` — casos de uso y comunicación entre módulos:
  - **Aprobar** consulta la cobertura del contrato, la compatibilidad del ítem, el
    consumo frente al contador y las existencias; si hay advertencias responde
    `409` hasta que el gestor las confirme.
  - **Cerrar** valida existencias, descuenta inventario (movimiento de salida),
    registra la lectura del contador y agrega el evento a la hoja de vida.
- `informes.ts` — cálculos de los informes.
- `handlers.ts` — endpoints REST, autenticación por token y filtros por rol.
- Persistencia en `localStorage` del navegador; _Restablecer datos demo_ la reinicia.

## Conectar el backend real

1. Implementar los endpoints de [API.md](API.md).
2. Crear `.env.local` con `VITE_USE_MOCKS=false` y `VITE_API_URL=https://…/api`.
3. Las pruebas automatizadas siguen usando el backend simulado.
