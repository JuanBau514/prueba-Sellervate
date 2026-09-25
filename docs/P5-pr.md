# P5 · Descripción preparada del PR

**Título:** feat: review queue ordered by per-brand coverage gaps

**Base:** `main` · **Rama:** `feat/review-queue`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/review-queue?expand=1)

## Qué resuelve

Sin criterio de muestreo, un especialista podía pasar un mes sin ser revisado. `/review` pone primero a quien más tiempo lleva sin revisión en cada marca y muestra la cobertura de cada especialista, para que el hueco se vea antes de que lo vea la marca.

## Cambios

- Migración `20260925190000_review_queue.sql`: vistas `review_coverage` y `review_queue` con `security_invoker = true`, limitadas a marcas lideradas; `anon` sin acceso.
- `src/lib/data/queue.ts` (`server-only`): dos consultas ordenadas en SQL.
- `/review`: grupos por marca, línea de cobertura por especialista, respuestas en espera con mensaje del cliente y respuesta; estados vacíos global y por marca; mensaje para especialistas.
- Portada: el líder va a su cola; enlace en la cabecera. El especialista mantiene su lista hasta P7.
- Pendientes de P3/P4: renovación con token caducado verificada, `authz-check` ampliado a 19 casos, lista de entrega actualizada.
- `supabase/tests/database/review_queue.test.sql`; README bilingüe, modelo, bitácora, registro `ai-logs/P5.md`.

## Verificación ejecutada

- `db reset` + seed + `supabase test db`: 139 aserciones PASS; lint SQL sin errores.
- `npm run authz-check`: 19/19.
- Marta y Nuria ven colas distintas y ordenadas (Lucía primero en ambas, 13 y 17 días); Dani ve el mensaje para especialistas.
- `lint`, `typecheck`, `build`: sin errores.

## Revisar especialmente

- Que el orden se haga en SQL (parámetro `order` sobre la vista) y no en el cliente.
- Cobertura por marca y especialista: ¿es la definición correcta de «punto ciego»?
- Ventana de 14 días y desempates: ¿razonables para ~8 revisiones por marca y semana?
- Las vistas filtran por líder además de RLS: un especialista no ve ni su propia cobertura.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
