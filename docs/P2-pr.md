# P2 · Descripción preparada del PR

**Título:** feat: model brand quality criteria and reviews

**Base:** `main` · **Rama:** `feat/quality-criteria`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/quality-criteria?expand=1)

## Qué resuelve

Criterios globales y por marca con severidades crítica/mayor/menor; una revisión por respuesta, etiquetas válidas para esa marca y registro de intervenciones. Mantiene el modelo normalizado, sin duplicar roles, marca en revisiones ni severidad en asociaciones.

## Cambios

- Migración incremental: `issue_tags`, `reviews`, `review_tags`, `brand_changes`, FK, índices y restricciones.
- Validación de líder asignado y etiqueta global/de la marca, incluso para escrituras del seed con service_role.
- Identidad de marca/autoría y severidad estables en V1; `updated_at` automático para feedback editable.
- RLS cerrado y funciones internas sin ejecución directa para roles API. Políticas con sesión real pendientes de P4.
- README bilingüe, decisiones del modelo, registro del prompt y entrega actualizados.

## Verificación ejecutada

- Migración aplicada sobre P1 normalizado, sin reset.
- `npm run db:test`: 110 aserciones aprobadas (48 P1 + 62 P2).
- Lint SQL `public,private`: sin errores.

## Revisar especialmente

- Dependencias funcionales y 3FN en `docs/data-model.md`.
- Rechazo de etiquetas de otra marca también en UPDATE y protección frente a cambios posteriores del catálogo/respuesta.
- Recortes de V1: roles y severidades fijos; sin historial de versiones del feedback; membresía exigida al crear, autoría histórica conservada después.
- Esto no es el guardado de la aplicación: sesión/RLS funcional en P4 y transacción revisión+etiquetas en P6.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar ambas ramas.
