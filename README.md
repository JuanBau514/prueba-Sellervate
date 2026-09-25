# Sellervate · Quality review

[Español](#español) · [English](#english)

## Español

Herramienta interna para evaluar respuestas de soporte ya enviadas según los procedimientos de cada marca. El líder registra su juicio, el especialista consulta su feedback privado y esas revisiones sirven como evidencia de calidad.

### Estado y rama principal

**En construcción; todavía no es la entrega final.** P0–P5 están integrados en `main`: seed local creíble, cambio de usuario con sesión real, autorización en Postgres (RLS) comprobada con llamadas directas a la API y cola de revisión con cobertura por especialista. P6 añade en `feat/review-workspace` el espacio para registrar la revisión, con guardado atómico, atajos de teclado y una primera base visual (tema, tipografías y corrección de la cola). El feedback al especialista y la evidencia por marca siguen pendientes.

**`main` es la rama principal de integración y entrega.** Cada problema se trabaja con un prompt independiente y una rama basada en `main`; su PR apunta a `main`. Después de tu revisión escrita y las correcciones, se incorpora mediante **merge commit**, conservando ramas y commits, sin squash ni rebase. Por tu instrucción más reciente, P1 y P2 tendrán ramas y PR separados: P1 en `feat/data-model` y P2 en `feat/quality-criteria`, después de integrar P1.

`main` es la rama predeterminada y contiene P0 mediante PR #1 (`1beec2a`), P1 normalizado mediante PR #2 (`2b7aba8`), P2 mediante PR #3 (`9295e76`), P3 mediante PR #4 (`f2766c1`), P4 mediante PR #5 (`5e93c3b`) y P5 mediante PR #6 (`26f13f6`). P6 está implementado en `feat/review-workspace`, pendiente de revisión e integración. Usamos exclusivamente **Git por SSH** en la terminal y la web de GitHub para crear/revisar/integrar PR. Consulta el [procedimiento de integración](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

### Instalación y ejecución local

Requisitos: Node.js 22 o superior (24 recomendado), npm y Docker Desktop iniciado. Supabase CLI es una dependencia del proyecto; no requiere instalación global. Next.js se configuró manualmente; no se usó un starter kit.

Para ejecutar la base integrada en `main`:

```sh
git clone --branch main git@github.com:JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci
npm run db:start
cp .env.example .env.local
npm run db:status
```

Para revisar P6 antes de su merge, cambia a `feat/review-workspace` después de clonar. En este checkout existente, empieza en `npm ci`. Si ya tienes `.env.local`, conserva sus valores y agrega solo las variables que falten. Un evaluador sin llave SSH puede clonar el repositorio público con `https://github.com/JuanBau514/prueba-Sellervate.git`; esto no cambia nuestro remoto de trabajo SSH.

Copia a `.env.local` la URL local, la clave `anon` (`ANON_KEY`) y la clave `service_role` (`SERVICE_ROLE_KEY`) que muestra `npm run db:status`. `DEMO_PASSWORD` ya trae un valor local de ejemplo. La clave `service_role` permanece solo en el servidor; su único consumidor es `scripts/seed.ts`. La página inicial de P0 no necesita credenciales. El primer arranque de Supabase descarga imágenes Docker y depende de la conexión.

```sh
npm run dev
```

Abre http://localhost:3000. Para detener Supabase: `npm run db:stop`.

### Datos de demostración y roles

Con Supabase iniciado y `.env.local` completo:

```sh
npm run db:reset   # borra y recrea la base local
npm run seed
```

`db:reset` borra todos los datos locales. El seed se niega a ejecutarse si la base ya tiene marcas y solo acepta una URL local. Usa la API de Auth admin y REST con `fetch`, sin dependencias nuevas; requiere Node 22.18 o superior (ejecuta TypeScript de forma nativa). Medido en esta máquina con las imágenes ya descargadas: reset + seed en 27 s.

| Cuenta (`@demo.sellervate.test`) | Persona | Rol | Marcas |
| --- | --- | --- | --- |
| `marta` | Marta Ibáñez | Líder | Voltia Scooters, Caja Norte |
| `nuria` | Nuria Castells | Líder | Brisa Café |
| `dani` | Dani Ruiz | Especialista | Voltia Scooters, Caja Norte |
| `lucia` | Lucía Ferrer | Especialista | Caja Norte, Brisa Café |
| `oscar` | Óscar Medina | Especialista | Voltia Scooters, Brisa Café |

Contraseña común: el valor de `DEMO_PASSWORD` (`sellervate-demo` en `.env.example`). Datos: 42 respuestas en cuatro semanas con fechas relativas a hoy, 27 revisiones, 11 criterios (4 globales, 7 por marca) y 2 intervenciones de marca. Voces distintas: Voltia diagnostica paso a paso, Caja Norte responde en tres líneas con cifras exactas y Brisa Café es cálida y sensorial. Casos incluidos: una devolución ofrecida sin diagnóstico en Voltia (puntaje 1, crítica); Dani con «No revisó el historial del pedido» en cinco revisiones a lo largo de más de tres semanas y dos marcas; Lucía sin revisiones en los últimos 10 días; respuestas de ayer sin revisar; tendencia de Voltia que mejora tras la intervención del día −16. Los fixtures de pruebas se revierten al terminar; no son datos de demostración.

**Cambio de rol (P4).** Con `npm run dev`, abre http://localhost:3000 y elige una persona en «Viewing as». Es un login simulado con sesión real: el servidor inicia sesión en Supabase Auth con `DEMO_PASSWORD` y guarda los tokens en cookies httpOnly; `src/proxy.ts` renueva el token antes de que caduque. Postgres ve el `auth.uid()` de esa persona y RLS decide qué devuelve. Un líder entra directamente en su cola (`/review`); un especialista ve sus propias respuestas (Dani 14), en una lista provisional hasta la vista de feedback de P7.

**Cola de revisión (P5).** `/review` muestra, por marca, las respuestas sin revisar de los últimos 14 días. Primero van los especialistas que llevan más tiempo sin revisión *en esa marca* (los nunca revisados antes que nadie) y después la respuesta más antigua. Encima de cada marca hay una línea de cobertura por especialista, por ejemplo «Lucía Ferrer · last review 13 days ago · 3 of 7 replies reviewed in 4 weeks · 4 waiting». Marta ve Caja Norte (Lucía primero) y Voltia (Dani, a 9 días en esa marca aunque en Caja Norte lleve 3); Nuria ve una cola distinta, solo de Brisa Café. El orden y la cobertura se calculan en SQL con dos vistas `security_invoker` (`review_queue`, `review_coverage`) que respetan RLS y solo devuelven filas de marcas que lideras: un especialista recibe una cola vacía desde la base. Es una heurística explicable; un modelo de triage podría sustituirla en V2. Cada respuesta muestra el mensaje del cliente y la respuesta enviada, con una vista previa sin líneas en blanco y «Read the full reply» para leerla completa, más un botón **Review**.

**Registrar la revisión (P6).** `/review/<id>` presenta el mensaje del cliente, la respuesta enviada como una carta en serif y, fijo a la derecha, la voz y el procedimiento de la marca. Debajo: puntaje 1–4, problemas encontrados agrupados por severidad (solo globales y de esa marca), comentario para el especialista y «Keep as a training example». Teclado: `1`–`4` puntaje, `C` ir al comentario, `⌘/Ctrl+Enter` guardar. «Save and next» lleva a la siguiente respuesta de la cola; «Skip for now» la salta. Una respuesta ya revisada muestra la revisión en lugar del formulario.

El guardado llama a la función `submit_review` (`security invoker`): inserta revisión y etiquetas en una sola transacción, con `reviewer_id = auth.uid()` (no hay campo para el revisor) y bajo RLS. Una etiqueta de otra marca, una revisión duplicada o una marca ajena rechazan todo, sin dejar nada a medias; la interfaz lo explica en su propia voz. Validación en la Server Action sin `zod`, para no añadir dependencias.

**Base visual.** Tema daisyUI propio (papel `#F4F6F5`, tinta `#1D252C`, acento `#2E5E55`; rojo, ámbar y gris reservados para severidad), escala 13/15/17/21/28 px, Public Sans para la interfaz y Literata para leer respuestas (`next/font`, se descargan al compilar). Cabecera y selector rediseñados, estados vacíos, página 404 propia y diseño adaptable a 390 px. El pulido de estados de carga y error es P9b.

Quién ve qué, aplicado en la base de datos:

| Tabla | Lectura | Escritura |
| --- | --- | --- |
| `brands`, `issue_tags` | Marcas asignadas (y criterios globales) | — |
| `replies` | Especialista: solo las propias. Líder: todas las de sus marcas | — |
| `reviews`, `review_tags` | Las de respuestas visibles | Líder asignado, `reviewer_id = auth.uid()`, solo sus propias revisiones; sin borrado |
| `brand_changes` | Líder de la marca | Líder de la marca, como autor |
| `people`, `brand_memberships` | Uno mismo y quienes comparten una marca; el líder ve su equipo | — |

Un rol global nunca da acceso sin la asignación a la marca. `anon` no tiene privilegios. La capa `src/lib/data/*` (`server-only`) llama a PostgREST con el JWT del usuario; la service role no aparece en `src/`. `GET /api/replies/<id>` devuelve 404 tanto si la respuesta no existe como si es ajena, para no revelar su existencia, y 401 sin sesión. Sin dependencias nuevas: el cliente de Supabase se sustituye por `fetch` a las APIs de Auth y REST.

Comprobación ejecutable, con la app en marcha (usa solo la clave anon y sesiones reales):

```sh
npm run authz-check
```

Verifica 22 casos: anónimo sin acceso a respuestas ni a la cola; Dani solo lee lo suyo, nada de otra marca ni de Lucía en su marca compartida; los especialistas no crean revisiones, no editan respuestas ni leen la cola o la cobertura; Nuria no ve la marca de Marta y su cola solo contiene Brisa Café; un líder no revisa otra marca ni firma como otra persona; `submit_review` rechaza al especialista, la marca ajena y la etiqueta de otra marca sin dejar revisión parcial; y la ruta de la app responde 200/404/404/401.

El objetivo obligatorio es pasar de un clon limpio al producto con datos y roles en menos de diez minutos; todavía no está verificado.

### Validación y limitaciones

```sh
npm run check
```

Ejecuta ESLint, TypeScript y una compilación de producción. Estas comprobaciones pasaron en P0; también se verificaron el arranque de la app y la salud de Supabase. En P6 pasaron lint, typecheck y el build de producción, y el flujo se probó en Chrome (escritorio y 390 px) sin errores de consola. Para aplicar las migraciones sin recrear la base local, ejecuta lo siguiente. **`npm run db:reset` es una alternativa que borra los datos locales**; resérvala para reconstruir una base desechable:

```sh
npx --no-install supabase migration up --local
npm run db:test
```

Las pruebas comprueban asignaciones, identidad de importación, historial, criterios y revisiones, rechazo de etiquetas ajenas y, desde P4, cada política: acceso permitido y prohibido entre marcas, entre especialistas de la misma marca, entre colíderes, tras retirar una asignación y para anónimos; desde P5, la cola y la cobertura por marca y especialista; desde P6, el guardado atómico. Pasan **153 aserciones** en cinco archivos, con base vacía y sembrada, y el lint SQL de `public,private` no encuentra errores. La cobertura exhaustiva y el despliegue no son requisitos del brief; la evaluación ejecuta el proyecto localmente. Ver [modelo y decisiones](docs/data-model.md).

Solo `people` almacena el rol; la marca de una revisión se deriva de su respuesta y la severidad vive en el catálogo. Con las dependencias declaradas, el modelo conserva 3FN. Límites de V1: rol, marca de respuesta, atribución de revisión y ámbito/código/severidad de criterio son fijos; los nombres, etiquetas y feedback admiten correcciones. Cambiar la severidad requiere un nuevo criterio. Se valida que el revisor sea líder asignado y el usuario de la sesión; revisión y etiquetas se guardan juntas (P6). Una revisión guardada no se edita desde la interfaz en V1. No hay auditoría de versiones del feedback.

ESLint está fijado en 9.39.5 por incompatibilidad de los plugins actuales de Next.js con ESLint 10. npm advierte que ESLint 9 está fuera de soporte. El intento de actualización y el fallo observado están registrados en [P0](ai-logs/P0.md).

### Tiempo real y entrega

**Horas efectivas totales: pendientes de confirmar; no se declara un total aún.** El límite es seis horas, incluyendo planificación, implementación, documentación y revisión, distribuidas en una semana calendario desde la recepción del ejercicio. Falta confirmar el tiempo previo y la fecha de recepción; ver [registro de tiempo](docs/time-log.md).

Antes de enviar deben estar resueltos estos puntos, hoy pendientes:

- [ ] README probado desde un clon limpio en menos de diez minutos, con seed, cambio de rol y horas reales.
- [ ] `main` publicada y predeterminada, con cada entrega incorporada mediante PR y merge commit.
- [ ] Ramas y PR conservados, con tu revisión escrita antes de cada merge.
- [ ] `DECISIONS.md`, máximo dos páginas: producto, arquitectura, uso real de IA y estado honesto; también la mayor objeción que harías a tu propio repositorio y por qué la dejaste.
- [ ] Repositorio público accesible sin iniciar sesión y enlace **en el texto de la propuesta de Upwork**, junto con las horas efectivas. El ejercicio se envía con la propuesta, no después.

La [matriz de evaluación y entrega](docs/delivery-checklist.md) relaciona los ocho criterios de Scoring con sus pesos, problemas y evidencias pendientes. No se declara cumplido un requisito por haberlo documentado.

## English

An internal tool for evaluating already-sent customer support replies against each brand's procedures. A lead records their judgement, the specialist reads their private feedback, and those reviews become evidence of quality.

### Status and main branch

**Work in progress; not the final submission.** P0–P5 are integrated into `main`: a credible local seed, user switching with a real session, authorization in Postgres (RLS) checked with direct API calls, and the review queue with per-specialist coverage. P6 adds the workspace to record a review on `feat/review-workspace`, with atomic save, keyboard shortcuts and a first visual foundation (theme, typefaces and a queue fix). Feedback to the specialist and brand evidence are still pending.

**`main` is the integration and delivery branch.** Each problem uses an independent prompt and a working branch based on `main`; its PR targets `main`. After your written review and corrections, it is integrated with a **merge commit**, retaining branches and commits, without squash or rebase. Per your latest instruction, P1 and P2 use separate branches and PRs: P1 on `feat/data-model`, then P2 on `feat/quality-criteria` after P1 is merged.

`main` is the default branch and contains P0 through PR #1 (`1beec2a`), normalized P1 through PR #2 (`2b7aba8`), P2 through PR #3 (`9295e76`), P3 through PR #4 (`f2766c1`), P4 through PR #5 (`5e93c3b`) and P5 through PR #6 (`26f13f6`). P6 is implemented on `feat/review-workspace`, awaiting review and integration. We use only **Git over SSH** in the terminal and GitHub's website to create, review and merge PRs. See the [integration procedure](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

### Local installation and startup

Requirements: Node.js 22 or newer (24 recommended), npm and Docker Desktop running. Supabase CLI is a project dependency; no global installation is required. Next.js was configured manually; no starter kit was used.

To run the base integrated into `main`:

```sh
git clone --branch main git@github.com:JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci
npm run db:start
cp .env.example .env.local
npm run db:status
```

To review P6 before its merge, switch to `feat/review-workspace` after cloning. In this existing checkout, start at `npm ci`. If `.env.local` already exists, preserve its values and add only missing variables. Evaluators without an SSH key may clone the public repository using `https://github.com/JuanBau514/prueba-Sellervate.git`; this does not change our SSH working remote.

Copy the local URL, the `anon` key (`ANON_KEY`) and the `service_role` key (`SERVICE_ROLE_KEY`) shown by `npm run db:status` into `.env.local`. `DEMO_PASSWORD` already has a local example value. The service role key stays server-only; its sole consumer is `scripts/seed.ts`. The P0 landing page does not need credentials. The first Supabase start downloads Docker images and depends on connection speed.

```sh
npm run dev
```

Open http://localhost:3000. Stop Supabase with `npm run db:stop`.

### Demo data and roles

With Supabase running and `.env.local` filled in:

```sh
npm run db:reset   # deletes and recreates the local database
npm run seed
```

`db:reset` deletes all local data. The seed refuses to run if the database already has brands and only accepts a local URL. It uses the Auth admin and REST APIs through `fetch`, with no new dependencies; it requires Node 22.18 or newer (native TypeScript execution). Measured on this machine with images already downloaded: reset + seed in 27 s.

| Account (`@demo.sellervate.test`) | Person | Role | Brands |
| --- | --- | --- | --- |
| `marta` | Marta Ibáñez | Lead | Voltia Scooters, Caja Norte |
| `nuria` | Nuria Castells | Lead | Brisa Café |
| `dani` | Dani Ruiz | Specialist | Voltia Scooters, Caja Norte |
| `lucia` | Lucía Ferrer | Specialist | Caja Norte, Brisa Café |
| `oscar` | Óscar Medina | Specialist | Voltia Scooters, Brisa Café |

Shared password: the value of `DEMO_PASSWORD` (`sellervate-demo` in `.env.example`). Data: 42 replies across four weeks with dates relative to today, 27 reviews, 11 criteria (4 global, 7 brand-specific) and 2 brand interventions. Distinct voices: Voltia diagnoses step by step, Caja Norte answers in three lines with exact figures, and Brisa Café is warm and sensory. Included cases: a Voltia return offered without diagnosis (score 1, critical); Dani tagged "No revisó el historial del pedido" in five reviews across more than three weeks and two brands; Lucía with no reviews in the last 10 days; unreviewed replies from yesterday; a Voltia trend that improves after the intervention on day −16. Test fixtures are rolled back after execution and are not demo data.

**Role switching (P4).** With `npm run dev`, open http://localhost:3000 and pick a person under "Viewing as". It is a simulated login with a real session: the server signs in to Supabase Auth with `DEMO_PASSWORD` and stores the tokens in httpOnly cookies; `src/proxy.ts` renews the token before it expires. Postgres sees that person's `auth.uid()` and RLS decides what comes back. A lead lands directly on their queue (`/review`); a specialist sees their own replies (Dani 14), in a provisional list until the P7 feedback view.

**Review queue (P5).** `/review` shows, per brand, the unreviewed replies from the last 14 days. Specialists who have gone longest without a review *in that brand* come first (never-reviewed before anyone), then the oldest reply. Above each brand there is a coverage line per specialist, e.g. "Lucía Ferrer · last review 13 days ago · 3 of 7 replies reviewed in 4 weeks · 4 waiting". Marta sees Caja Norte (Lucía first) and Voltia (Dani at 9 days in that brand even though he is at 3 in Caja Norte); Nuria sees a different queue, Brisa Café only. Ordering and coverage are computed in SQL by two `security_invoker` views (`review_queue`, `review_coverage`) that respect RLS and only return rows from brands you lead: a specialist gets an empty queue from the database. It is an explainable heuristic; a triage model could replace it in V2. Each reply shows the customer's message and the sent reply, with a preview free of blank lines and "Read the full reply" to read it in full, plus a **Review** button.

**Recording a review (P6).** `/review/<id>` shows the customer's message, the sent reply as a letter in a serif face and, pinned on the right, the brand's voice and procedure. Below: score 1–4, issues found grouped by severity (global and that brand's only), a comment for the specialist and "Keep as a training example". Keyboard: `1`–`4` score, `C` jump to the comment, `⌘/Ctrl+Enter` save. "Save and next" goes to the next reply in the queue; "Skip for now" skips it. A reply that is already reviewed shows the review instead of the form.

Saving calls the `submit_review` function (`security invoker`): it inserts the review and its tags in one transaction, with `reviewer_id = auth.uid()` (there is no reviewer field) and under RLS. A tag from another brand, a duplicate review or another lead's brand rejects everything, leaving nothing half-saved; the interface explains it in its own voice. Validation in the Server Action without `zod`, to avoid new dependencies.

**Visual foundation.** A custom daisyUI theme (paper `#F4F6F5`, ink `#1D252C`, accent `#2E5E55`; red, amber and slate reserved for severity), a 13/15/17/21/28 px scale, Public Sans for the interface and Literata for reading replies (`next/font`, downloaded at build time). Redesigned header and switcher, empty states, a custom 404 page and a layout that works at 390 px. Polishing loading and error states is P9b.

Who sees what, enforced in the database:

| Table | Read | Write |
| --- | --- | --- |
| `brands`, `issue_tags` | Assigned brands (plus global criteria) | — |
| `replies` | Specialist: own replies only. Lead: all replies in their brands | — |
| `reviews`, `review_tags` | Those of visible replies | Assigned lead, `reviewer_id = auth.uid()`, own reviews only; no deletion |
| `brand_changes` | Brand lead | Brand lead, as author |
| `people`, `brand_memberships` | Yourself and people sharing a brand; leads see their team | — |

A global role never grants access without the brand assignment. `anon` has no privileges. The `src/lib/data/*` layer (`server-only`) calls PostgREST with the user's JWT; the service role does not appear in `src/`. `GET /api/replies/<id>` returns 404 both when the reply does not exist and when it belongs to someone else, so its existence is not revealed, and 401 without a session. No new dependencies: the Supabase client is replaced by `fetch` calls to the Auth and REST APIs.

Executable check, with the app running (uses only the anon key and real sessions):

```sh
npm run authz-check
```

It verifies 22 cases: anonymous has no access to replies or the queue; Dani reads only his own data, nothing from another brand nor Lucía's in their shared brand; specialists cannot create reviews, edit replies or read the queue or coverage; Nuria cannot see Marta's brand and her queue contains only Brisa Café; a lead cannot review another brand or sign as someone else; `submit_review` rejects a specialist, another lead's brand and a foreign-brand tag without leaving a partial review; and the app route answers 200/404/404/401.

The required target is a working product with data and roles within ten minutes of a fresh clone; that target has not yet been verified.

### Validation and limitations

```sh
npm run check
```

Runs ESLint, TypeScript and a production build. These checks passed for P0; application startup and Supabase health were also verified. For P6, lint, typecheck and the production build passed, and the flow was exercised in Chrome (desktop and 390 px) with no console errors. To apply migrations without recreating the local database, run the following. **`npm run db:reset` is an alternative that deletes local data**; reserve it for rebuilding a disposable database:

```sh
npx --no-install supabase migration up --local
npm run db:test
```

Tests cover assignments, import identity, history, criteria and reviews, rejection of foreign-brand tags and, since P4, every policy: allowed and forbidden access across brands, between specialists in the same brand, between co-leads, after an assignment is removed and for anonymous users; since P5, the queue and coverage per brand and specialist; since P6, atomic submission. **153 assertions pass** across five files, on an empty and a seeded database, and SQL lint for `public,private` reports no errors. Exhaustive coverage and deployment are not brief requirements; evaluation runs the project locally. See [model and decisions](docs/data-model.md).

Only `people` stores the role; a review's brand is derived from its reply and severity lives in the catalog. Under the declared dependencies, the model remains in 3NF. V1 limitations: role, reply brand, review attribution and criterion scope/code/severity are fixed; names, labels and feedback allow corrections. Changing severity requires a new criterion. Reviewers must be assigned leads and the session user; review and tags are saved together (P6). A saved review cannot be edited from the interface in V1. Feedback revision auditing is not implemented.

ESLint is pinned to 9.39.5 because the current Next.js plugins are incompatible with ESLint 10. npm reports ESLint 9 as out of support. The attempted upgrade and observed failure are recorded in [P0](ai-logs/P0.md).

### Actual time and delivery

**Total effective hours: awaiting confirmation; no total is asserted yet.** The cap is six hours, including planning, implementation, documentation and review, spread across one calendar week from receipt of the exercise. Prior work duration and receipt date still need confirmation; see the [time log](docs/time-log.md).

Before submission, these currently outstanding items must be resolved:

- [ ] README verified from a fresh clone in under ten minutes, including seed data, role switching and actual hours.
- [ ] `main` published and set as default, with each delivery integrated through a PR and merge commit.
- [ ] Branches and PRs retained, with your written review before each merge.
- [ ] `DECISIONS.md`, maximum two pages: product, architecture, actual AI workflow and honest status; also the strongest objection you would raise against your own repository and why you left it.
- [ ] Public repository accessible without login, with its link **in the Upwork proposal text**, alongside effective hours. Submit the exercise with the proposal, not afterwards.

The [evaluation and delivery matrix](docs/delivery-checklist.md) maps all eight scoring dimensions to their weights, implementation tasks and outstanding evidence. Documenting a requirement does not make it complete.

## Documentación / Documentation

- [Interpretación del producto / Product interpretation](01-problema.md)
- [Mapa de problemas y pipeline / Problem map and pipeline](02-pipeline.md)
- [Acuerdo de ejecución y prompts / Execution agreement and prompts](docs/implementation-plan.md)
- [Evaluación y entrega / Evaluation and delivery](docs/delivery-checklist.md)
- [Reglas del agente / Agent working rules](CLAUDE.md)
- [Prompt y registro de P0 / P0 prompt and record](ai-logs/P0.md)
- [Descripción preparada del PR de P0 / Prepared P0 PR description](docs/P0-pr.md)
- [Modelo de P1 y P2 / P1 and P2 data model](docs/data-model.md)
- [Prompt y registro de P1 / P1 prompt and record](ai-logs/P1.md)
- [Prompt y registro de P2 / P2 prompt and record](ai-logs/P2.md)
- [Descripción del PR de P2 / P2 PR description](docs/P2-pr.md)
- [Prompt y registro de P3 / P3 prompt and record](ai-logs/P3.md)
- [Descripción del PR de P3 / P3 PR description](docs/P3-pr.md)
- [Prompt y registro de P4 / P4 prompt and record](ai-logs/P4.md)
- [Descripción del PR de P4 / P4 PR description](docs/P4-pr.md)
- [Prompt y registro de P5 / P5 prompt and record](ai-logs/P5.md)
- [Descripción del PR de P5 / P5 PR description](docs/P5-pr.md)
- [Prompt y registro de P6 / P6 prompt and record](ai-logs/P6.md)
- [Descripción del PR de P6 / P6 PR description](docs/P6-pr.md)

El PDF del ejercicio se conserva localmente. / The supplied exercise PDF stays local.
