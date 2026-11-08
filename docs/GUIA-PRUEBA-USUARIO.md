# Guion de prueba con usuarios

Guion para grabar a una persona completando tareas reales en MAKI-TRACE. Cada
tarea recorre **al menos tres ventanas** de la aplicación. Se recomienda grabar
la pantalla y la voz del participante (protocolo "pensar en voz alta").

## Antes de cada sesión

1. Ejecute `npm run dev` y abra <http://localhost:5173>.
2. Inicie sesión como `gerente` / `maki2026` y vaya a **Usuarios y roles →
   Restablecer datos demo**. Así cada participante parte de los mismos datos.
3. Cierre sesión (icono de salida arriba a la derecha).
4. Lea al participante: _"Vamos a evaluar la aplicación, no a usted. Diga en voz
   alta lo que piensa mientras trabaja. Si se bloquea, dígalo."_
5. Inicie la grabación. No ayude salvo que el participante lleve más de 2 minutos bloqueado.

Las tareas están en orden: la 2 continúa lo que hace la 1, y la 3 lo que hace la 2.

---

## Tarea 1 · Cliente: pedir tóner y seguir la solicitud

**Rol:** cliente (Colegio San Ángel) · usuario `cliente` · contraseña `maki2026`

**Escenario que se lee al participante:**

> "Usted es la encargada de compras del Colegio San Ángel. Al equipo de la
> coordinación académica se le acabó el tóner. Pídalo por la aplicación y averigüe
> en qué estado quedó su solicitud."

**Ventanas que recorre:** Inicio de sesión → Mi portal → Nueva solicitud → Detalle del caso (→ Mis solicitudes)

**Ruta esperada:**

1. Ingresar con el usuario de cliente.
2. En _Mi portal_, pulsar **Nueva solicitud**.
3. Equipo: `CNCJ71301 · e-STUDIO 3018A · … Coordinación académica`.
4. ¿Qué necesita?: **Suministros** → marcar _Tóner T-3018 negro_ (cantidad 1).
5. (Opcional) contador actual, p. ej. `20000`.
6. Descripción: "Se acabó el tóner".
7. **Enviar solicitud** → ve el caso `CASO-2026-0014` en estado _Registrado_.
8. Volver a _Mi portal_ o _Casos_ y encontrar la solicitud en curso.

**Éxito:** el caso queda creado y el participante sabe decir su número y su estado.

---

## Tarea 2 · Gestor de servicios: revisar, aprobar y asignar

**Rol:** gestor · usuario `gestor` · contraseña `maki2026`

**Escenario:**

> "Usted recibe las solicitudes de los clientes. Revise la solicitud de tóner que
> acaba de llegar del Colegio San Ángel, apruébela y asígnela a Carlos Ramírez
> para mañana. Después revise la solicitud de repuestos de la Papelería El
> Estudiante: ¿la aprobaría? ¿por qué?"

**Ventanas que recorre:** Tablero → Casos → Detalle del caso → diálogo Aprobar → diálogo Asignar

**Ruta esperada:**

1. Ir a **Casos** (o abrir la campana de alertas).
2. Abrir `CASO-2026-0014` → **Aprobar** → mensaje "Sin observaciones" → **Aprobar caso**.
3. **Asignar técnico** → _Carlos Ramírez_ → fecha de mañana → **Asignar**.
4. Volver a _Casos_ y abrir `CASO-2026-0012` (Papelería El Estudiante, repuestos).
5. **Aprobar** → el sistema advierte: _"El contrato POS-2025-002 no incluye repuestos"_.
6. El participante decide: rechazar con motivo, o marcar "Entiendo las advertencias" y aprobar.

**Éxito:** el caso de tóner queda _Asignado_ a Carlos; el participante nota y explica
la advertencia de cobertura (criterio de aceptación 1).

---

## Tarea 3 · Técnico: atender en sitio con el QR y cerrar el caso

**Rol:** técnico · usuario `tecnico` · contraseña `maki2026`
_(ideal grabarla desde un celular o con la ventana angosta)_

**Escenario:**

> "Usted es Carlos, técnico. Llegó al colegio a entregar el tóner. Antes de
> empezar, consulte la hoja de vida del equipo escaneando su código QR (si no
> tiene cámara, digite el serial CNCJ71301). Inicie la atención, registre lo que
> hizo y cierre el caso."

**Ventanas que recorre:** Mis casos → Escanear QR → Hoja de vida del equipo → Detalle del caso → diálogo Registrar trabajo y cerrar

**Ruta esperada:**

1. En _Mis casos_ ve `CASO-2026-0014` con la ubicación.
2. **Escanear QR del equipo** → activar cámara y leer la etiqueta _(o digitar `CNCJ71301` → Buscar)_.
3. En la hoja de vida identifica el último mantenimiento, casos pendientes y repuestos que usa.
4. Abrir el caso (desde _Casos del equipo_ o desde _Mis casos_) → **Iniciar atención**.
5. **Registrar trabajo y cerrar** → descripción, contador (p. ej. `20500`), el tóner ya viene en la lista → **Cerrar caso**.
6. Volver a la hoja de vida: el servicio y el tóner aparecen en el **Historial**.

> Para imprimir una etiqueta QR real: como gestor, abra el equipo → **Imprimir etiqueta**.

**Éxito:** el caso queda _Cerrado_ y el historial del equipo muestra el servicio
(criterio de aceptación 2).

---

## Tarea 4 · Gerente: controlar la operación con datos

**Rol:** gerente · usuario `gerente` · contraseña `maki2026`

**Escenario:**

> "Usted es el gerente. Averigüe qué casos están demorados y quién los tiene,
> qué repuesto o suministro está por agotarse, y registre que la Universidad del
> Norte Andino pagó una de sus facturas vencidas."

**Ventanas que recorre:** Tablero → Informes (Casos / Inventario) → Repuestos y suministros → Cartera

**Ruta esperada:**

1. En el _Tablero_ ve los indicadores (casos demorados, ítems bajo mínimo, cartera vencida).
2. **Informes → Casos**: identifica los casos con la etiqueta _Demorado_ (criterio 4).
3. **Informes → Inventario** o **Repuestos y suministros**: ve _Tóner T-FC330 cian_ bajo el mínimo (criterio 3).
4. (Opcional) registra una **entrada** de 5 unidades y la alerta desaparece.
5. **Cartera** → filtrar _Vencida_ → **Registrar pago** en una factura de la Universidad.

**Éxito:** responde las tres preguntas y el pago queda registrado.

---

## Tarea 5 (opcional) · Gerente: registrar un contrato nuevo

> "Copias Express firmó un arriendo de un año a $500.000 por equipo que incluye
> todo. Regístrelo y asígnele el equipo que está en bodega (CNEK45100)."

**Ventanas:** Contratos → Nuevo contrato → Detalle del contrato → Equipos → Editar equipo

---

## Después de cada tarea

Pregunte (escala 1 a 7, _Single Ease Question_): **"¿Qué tan fácil o difícil fue esta tarea?"**

Registre por tarea:

| Participante | Tarea | ¿Completó? (sí / con ayuda / no) | Tiempo (mm:ss) | Errores | SEQ (1-7) | Comentarios |
| ------------ | ----- | -------------------------------- | -------------- | ------- | --------- | ----------- |
| P1           | 1     |                                  |                |         |           |             |
| P1           | 2     |                                  |                |         |           |             |
| P1           | 3     |                                  |                |         |           |             |
| P1           | 4     |                                  |                |         |           |             |

## Al final de la sesión

Aplique el cuestionario SUS (System Usability Scale, 10 preguntas) y pregunte:

- ¿Qué fue lo más útil?
- ¿Qué le confundió?
- ¿Qué cambiaría?
