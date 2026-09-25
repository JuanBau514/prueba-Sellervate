# P6 · Descripción preparada del PR

**Título:** feat: review workspace with atomic save and visual foundation

**Base:** `main` · **Rama:** `feat/review-workspace`

[Crear el PR en GitHub](https://github.com/JuanBau514/prueba-Sellervate/compare/main...feat/review-workspace?expand=1)

## Qué resuelve

Revisar tiene que ser más rápido que hojear el inbox y hacerse contra el procedimiento de la marca. `/review/[replyId]` pone la respuesta y el procedimiento lado a lado, se opera con teclado y guarda revisión y etiquetas de una vez. También corrige la cola, que recortaba el contenido de las respuestas (captura del autor), y establece la base visual.

## Cambios

- Migración `20260925200000_submit_review.sql`: `submit_review` atómica, `security invoker`, revisor = `auth.uid()`.
- `/review/[replyId]`: cliente, respuesta como carta, voz y procedimiento fijos; puntaje, etiquetas por severidad, comentario, ejemplo; `useActionState`; «Save and next» y «Skip for now»; revisión existente en solo lectura.
- Teclado: `1`–`4`, `C`, `⌘/Ctrl+Enter`.
- Cola: contenido etiquetado, vista previa sin líneas en blanco, respuesta completa desplegable, botón Review.
- Tema daisyUI, escala tipográfica, Public Sans + Literata, cabecera y selector, portada, 404.
- `submit_review.test.sql`; `authz-check` con 3 casos del RPC; README bilingüe, modelo, bitácora, `ai-logs/P6.md`.

## Verificación ejecutada

- `db reset` + seed + `supabase test db`: 153 aserciones PASS; lint SQL sin errores.
- `npm run authz-check`: 22/22.
- Chrome: revisión solo con teclado, guardada y redirigida; 390 px correcto; sin errores de consola.
- `lint`, `typecheck`, `build`: sin errores.

## Revisar especialmente

- `reviewer_id` no llega del formulario (no existe ese parámetro en la función).
- Atomicidad: etiqueta de otra marca ⇒ ni revisión ni etiquetas.
- Validación manual en lugar de `zod`: ¿suficiente?
- Tokens y tipografía: ¿representan la intención de P9a? Adelantarlo cambia el orden del pipeline.
- Fuentes de Google descargadas al compilar: requiere red para `npm run build`.

La revisión humana debe escribirse en el PR **antes** del merge. Esta descripción y las pruebas no la sustituyen. Integrar con merge commit y conservar la rama.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
