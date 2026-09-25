# P3 · Descripción preparada del PR

**Título:** feat: seed credible demo data

**Base:** `main` · **Rama:** `feat/seed`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/seed?expand=1)

## Qué resuelve

Un producto para leer lo que alguien escribió no se puede evaluar con lorem ipsum. `npm run db:reset && npm run seed` deja la base local con tres marcas de voces claramente distintas, dos líderes, tres especialistas, 42 respuestas en cuatro semanas y 27 revisiones, todo con fechas relativas a hoy.

## Cambios

- `scripts/seed.ts`: crea las cinco cuentas con la API de Auth admin e inserta el dominio por REST. Único uso de la service role key; solo acepta URL local y se niega a sembrar una base con datos.
- Sin dependencias nuevas: Node ≥ 22.18 ejecuta el TypeScript directamente (`engines` actualizado); `npm run seed` carga `.env.local`.
- `.env.example`: contraseña demo local `sellervate-demo`.
- Pruebas P1/P2: conteos acotados a sus fixtures para que pasen también con la base sembrada.
- README bilingüe (cuentas, comandos, casos), checklist, bitácora, registro `ai-logs/P3.md`.

## Casos que el seed garantiza

- Devolución ofrecida sin diagnóstico en Voltia Scooters (puntaje 1, etiqueta crítica).
- Dani con «No revisó el historial del pedido» en cinco revisiones durante más de tres semanas y en sus dos marcas.
- Lucía sin revisiones en los últimos 10 días, con respuestas recientes pendientes.
- Respuestas de ayer sin revisar: la cola nunca está vacía.
- Tendencia de Voltia que mejora tras una intervención de marca fechada.

## Verificación ejecutada

- Reset + seed: 27 s; conteos y casos comprobados por SQL.
- Segunda ejecución sin reset: rechazada sin escribir.
- Login con contraseña de una cuenta demo contra Auth local: correcto.
- `supabase test db`: 110 aserciones PASS con base vacía y sembrada; lint SQL sin errores.
- `lint` y `typecheck`: sin errores. Build no repetido (no cambia código de la app).

## Revisar especialmente

- Que los textos suenen a cada marca: comparar una respuesta de Voltia con una de Caja Norte.
- Fechas: ninguna fija; todo sale de `at(hora, díasAtrás)`.
- Service role solo en `scripts/`; ningún import desde `src/`.
- El seed no es idempotente por diseño (exige reset). ¿Aceptable para V1?
- Aún no se puede entrar con las cuentas desde la app: eso es P4.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
