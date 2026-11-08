# Cómo contribuir

Prácticas de ingeniería acordadas en la propuesta (§9.1).

## Flujo de trabajo: GitHub Flow

1. Cada historia de usuario se trabaja en una **rama corta** desde `main`:
   `feature/<modulo>-<descripcion>`, `fix/<descripcion>` o `docs/<descripcion>`.
2. Commits pequeños con [Conventional Commits](https://www.conventionalcommits.org/es/):
   `feat(casos): …`, `fix(inventario): …`, `test: …`, `docs: …`, `chore: …`.
3. Se integra a `main` **solo mediante pull request aprobado** por otro integrante.
4. El pipeline de CI (`.github/workflows/ci.yml`) corre en cada PR: lint, formato,
   tipos, pruebas con cobertura y build. **No se integra código con pruebas fallidas.**
5. Cada entrega se marca con una etiqueta de versión: `git tag -a v0.1.0 -m "Entrega 1"`.

Protección sugerida para `main` en GitHub: exigir PR, una aprobación y que el check
"Lint, tipos, pruebas y build" pase.

## Historias de usuario

Use la plantilla `.github/ISSUE_TEMPLATE/historia-de-usuario.md`.

- **Lista para trabajarse:** tiene criterios de aceptación y está estimada.
- **Terminada:** código revisado por otro integrante, pruebas pasando, cobertura
  del módulo ≥ 75 % y demostrada al Product Owner.

## Estructura

```
src/
  app/            Enrutador, layout por rol, proveedores
  modules/<m>/    Un módulo por área de la propuesta
    types.ts        Tipos del dominio
    domain/         Reglas de negocio puras (probadas unitariamente)
    api.ts          Acceso a la API REST + hooks de TanStack Query
    components/     Componentes del módulo
    pages/          Pantallas
  shared/         UI reutilizable, cliente HTTP, utilidades
  mocks/          Backend simulado (MSW): datos semilla, reglas y endpoints
  test/           Configuración y pruebas de integración
```

Regla: un módulo puede usar `domain/` y `api.ts` de otro, nunca sus `pages/`.
