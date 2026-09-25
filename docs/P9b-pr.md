# P9b · Descripción preparada del PR

**Título:** chore: loading, error and empty states; keep HTTP status with streaming

**Base:** `main` · **Rama:** `chore/states-polish`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...chore/states-polish?expand=1)

## Qué resuelve

Un estado vacío o de error por defecto se nota. Cada ruta tiene ahora esqueleto de carga, error que explica y ofrece acción, y estados vacíos que invitan a actuar. También corrige una regresión que el propio cambio introducía: con streaming, los 404 y las redirecciones salían con 200.

## Cambios

- `loading.tsx` en `/review`, `/review/[replyId]`, `/me`, `/brands`, `/brands/[slug]`; `Skeleton` con `motion-safe`.
- `error.tsx` y `global-error.tsx` con `LoadFailure` (causa, qué hacer, «Try again», referencia).
- `EmptyState` con acción en cola, feedback e índice de marcas; textos de la página de marca.
- Skip link, foco visible, tabla de patrones adaptada a móvil.
- Guardas en layouts de segmento (`/me`, `/brands`, `/brands/[slug]`, `/review/[replyId]`) y páginas de lista en grupos de rutas; `cache()` en `getViewer`, `getBrandBySlug`, `getReviewContext`.
- `authz-check`: estado 404 de la página de una respuesta ajena.

## Verificación ejecutada

- Error probado contra el build de producción con PostgREST detenido; recuperación con «Try again».
- Códigos 307/404 comprobados; `authz-check` 29/29; `supabase test db` 169 PASS; `lint`, `typecheck`, `build` sin errores.

## Revisar especialmente

- Copy de error y vacíos: sin disculpas, con causa y acción.
- La corrección de streaming: guardas en layouts y grupos de rutas.
- Pulso de esqueletos solo con `motion-safe`; sin otras animaciones.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
