# P8 · Descripción preparada del PR

**Título:** feat: brand evidence with weekly trend, patterns and coverage

**Base:** `main` · **Rama:** `feat/brand-overview`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/brand-overview?expand=1)

## Qué resuelve

«Cada trimestre digo que mejoramos; prefiero mostrar el número.» `/brands/[slug]` permite a un líder contar la historia de su marca en 30 segundos: tendencia con n, qué cambiamos y cuándo, qué salió mal y qué se repite.

## Cambios

- Migración `20260925220000_brand_overview.sql`: tres vistas `security_invoker` por marca, solo líderes; `brand_changes.author_id` desde la sesión.
- `/brands` (índice) y `/brands/[slug]`: resumen de 4 semanas con n, tendencia semanal SVG con n y marcadores, críticos con enlace a la respuesta, patrones problema × especialista con semanas distintas, cobertura y formulario «What we changed» con `useActionState`.
- Navegación «Brands» y enlace «Brand evidence» desde la cola.
- `brand_overview.test.sql`, pruebas de P4 ajustadas al autor desde sesión, `authz-check` con 4 casos más; README bilingüe, modelo, bitácora, `ai-logs/P8.md`.

## Verificación ejecutada

- `supabase test db`: 169 aserciones PASS; `db diff` sin diferencias; lint SQL sin errores.
- `npm run authz-check`: 28/28.
- Chrome como Marta: página completa y registro de un cambio (borrado después).
- `lint`, `typecheck`, `build`: sin errores.

## Revisar especialmente

- Todas las vistas con `security_invoker` y agrupadas por un solo `brand_id`.
- Ningún promedio sin su n (resumen, gráfico, tabla).
- Semana de envío frente a semana de revisión.
- Umbral de patrón (≥ 2 semanas distintas en 6).
- Gráfico propio en SVG en lugar de Recharts.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
