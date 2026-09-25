# P9b · Estados y pulido

## Instrucción del usuario

> ya he verificado y hecho merge ahora vamos a trabajar sobre los ulitmos 2 p9 y p10 nesesito que ajustes estoo especialmente porque ya solamentte falta estos 2 apartados

Decisiones del autor en la sesión: dos ramas en cadena (`chore/states-polish` desde main y `docs/decisions` desde esa rama), ejecutar la prueba de clon limpio, borrador marcado de la sección AI y horas: 6 h de requerimientos técnicos más 30 min de análisis y pipeline.

## Prompt independiente aplicado

Verificar el merge de P8 (`809c6c4`, PR #9) y crear `chore/states-polish`. Implementar P9b: `loading.tsx` con esqueletos por ruta, `error.tsx` que explique qué pasó y qué hacer, estados vacíos que inviten a actuar, foco visible, contraste y pantallas pequeñas; sin textos que se disculpen ni animaciones decorativas. Mantener el README bilingüe y el PR preparado sin inventar la revisión humana.

## Evidencia y decisiones

- Herramienta: Claude Code (Opus 5.5).
- **Esqueletos** con la forma del contenido; el pulso solo con `motion-safe`. Región `role="status"` con texto para lectores de pantalla.
- **Error:** un componente compartido para `error.tsx` y `global-error.tsx` (esta versión de Next usa `retry`). Explica la causa, las dos causas locales y la acción; muestra el `digest` para cruzar con el log. `global-error` hace falta porque el layout raíz consulta la sesión a la base.
- **Regresión encontrada y corregida:** con `loading.tsx`, las páginas empezaban a transmitirse antes de `notFound()`/`redirect()`, así que `/brands/voltia` devolvía **200** a Nuria y a Dani (con la UI de «no encontrado», sin datos de la marca), y `/me` y `/review/<id>` perdían su 307/404. Corrección: guardas en `layout.tsx` de segmento y páginas de lista movidas a grupos de rutas (`(queue)`, `(index)`) para que su esqueleto no envuelva a las rutas hijas. Lecturas repetidas envueltas en `cache()` de React. `authz-check` añade la comprobación del estado 404 de la página.
- **Contraste medido** (WCAG): el peor texto es muted sobre base-200, 4,83:1; primario sobre papel 6,79:1; críticos 6,57:1.
- **Pantallas pequeñas:** tabla de patrones con columnas separadas y «Last seen» oculto por debajo de `sm`.
- No se hizo una comparación visual formal con sellervate.com.

## Comprobaciones ejecutadas

- Esqueleto presente en la respuesta transmitida de `/review`.
- Error: build de producción en el puerto 3100, PostgREST detenido unos segundos → Chrome muestra «This page could not load its data» con referencia; «Try again» recupera tras reiniciarlo. En desarrollo Next muestra su propia página de error.
- Códigos: anon `/me` 307, líder `/me` 307, `/review/<uuid inexistente>` 404, anon `/brands` 404, `/brands/voltia` 200/404/404.
- `supabase test db` 169 PASS; `npm run authz-check` 29/29; `lint`, `typecheck`, `build` sin errores.
- Skip link visible al pulsar Tab. La captura a 390 px no se repitió tras ajustar la tabla (el redimensionado de ventana no se aplicó).
