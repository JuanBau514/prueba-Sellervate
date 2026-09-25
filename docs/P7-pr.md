# P7 · Descripción preparada del PR

**Título:** feat: specialist feedback page with per-brand averages and n

**Base:** `main` · **Rama:** `feat/specialist-view`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/specialist-view?expand=1)

## Qué resuelve

El feedback se perdía en Slack. `/me` reúne lo que los líderes escribieron sobre las respuestas de cada especialista, con el promedio por marca siempre acompañado de su n, y solo lo ve esa persona (y los líderes de la marca).

## Cambios

- Migración `20260925210000_review_summary.sql`: vista `review_summary` (`security_invoker`), sin filtros de rol.
- `src/lib/data/feedback.ts`: revisiones y resumen, sin `specialist_id` en la consulta.
- `/me`: resumen por marca (promedio, n, críticos, última revisión, aviso con n < 5), filtro por marca, feedback con severidad, revisor, fecha y respuesta original desplegable; estado vacío.
- Portada y navegación por rol; se elimina la lista provisional de P4.
- `review_summary.test.sql`; `authz-check` con 2 casos más; README bilingüe, modelo, bitácora, `ai-logs/P7.md`.

## Verificación ejecutada

- `db reset` + seed + `supabase test db`: 159 aserciones PASS; lint SQL sin errores.
- `npm run authz-check`: 24/24.
- Chrome como Dani: resumen, filtro, respuesta desplegable y 390 px.
- `lint`, `typecheck`, `build`: sin errores.

## Revisar especialmente

- Que ninguna consulta de `/me` filtre por especialista a mano.
- El promedio no se infla con varias etiquetas por revisión (`EXISTS`, con prueba).
- Umbral n < 5 para el aviso: ¿razonable?
- Estado vacío y copy.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
