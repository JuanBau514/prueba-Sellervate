# P4 · Descripción preparada del PR

**Título:** feat: enforce brand isolation with RLS and real demo sessions

**Base:** `main` · **Rama:** `feat/authz`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/authz?expand=1)

## Qué resuelve

Un especialista no puede ver datos de otra marca ni de otros especialistas, aunque llame a la API directamente. Cambiar de usuario en la app cambia lo que devuelve Postgres, porque la sesión es real y RLS decide.

## Cambios

- Migración `20260925170000_authorization.sql`: helpers `private.is_brand_member/is_brand_lead/shares_brand_with` (`security definer`, `search_path = ''`), privilegios mínimos por columna y políticas en las ocho tablas. `anon` sin privilegios.
- Sesión: Server Action que inicia sesión en Supabase Auth con `DEMO_PASSWORD`, cookies httpOnly y renovación en `src/proxy.ts`. Sin dependencias nuevas (no `@supabase/ssr`).
- `src/lib/data/*` con `server-only`: PostgREST con el JWT del usuario. Service role ausente de `src/`.
- Selector «Viewing as» y página provisional con marcas y respuestas visibles.
- `GET /api/replies/[id]`: 404 para lo ajeno o inexistente, 401 sin sesión.
- `supabase/tests/database/authorization.test.sql` y `scripts/authz-check.ts` (`npm run authz-check`).
- Pruebas P1/P2: se sustituyen las aserciones de «cerrado hasta P4» por privilegios vigentes.
- README bilingüe, modelo, checklist, bitácora, registro `ai-logs/P4.md`.

## Verificación ejecutada

- `db reset` + seed + `supabase test db`: 130 aserciones PASS; lint SQL sin errores.
- `npm run authz-check`: 16/16 contra PostgREST y la app en marcha.
- Selector ejercitado por formulario: Dani 14 respuestas, Marta 29, Nuria 13.
- Renovación por proxy y cierre de sesión comprobados; `lint`, `typecheck`, `build` sin errores.
- No probado en navegador real ni tras la caducidad natural del token.

## Revisar especialmente

- Service role en `src/`: no debe aparecer.
- Que ninguna política use solo `people.role`: todas exigen la asignación en `brand_memberships`.
- `security definer` con `search_path = ''` y sin datos expuestos.
- Todas las políticas de INSERT/UPDATE con `WITH CHECK` (hay una aserción que lo verifica).
- Decisión: `people` visible solo si se comparte marca (más estricto que el pipeline).
- Decisión: mantener sesión sin `@supabase/ssr`; ¿aceptable el código propio de cookies/refresco?

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
