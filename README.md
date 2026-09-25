# Sellervate · Quality review

[Español](#español) · [English](#english)

## Español

Producto interno para el loop de calidad de un equipo de soporte de marca blanca: evalúa respuestas ya enviadas según el procedimiento de cada marca. No es un sistema genérico de calificación de comentarios. El líder revisa contra ese procedimiento, el especialista lee su feedback en privado y la marca recibe evidencia con tamaño de muestra, no impresiones. Las decisiones están en [DECISIONS.md](DECISIONS.md).

### Estado

El recorrido completo funciona: seed creíble → cambio de rol con sesión real → cola de revisión por cobertura → revisión con guardado atómico → feedback del especialista → evidencia por marca, con estados de carga, error y vacío. P0–P9b están integrados en `main` mediante PR #1–#10 con merge commit. P10 (`docs/decisions`, esta documentación) está en su PR. Lo que falta para enviar está en [Entrega](#entrega).

### Guía de instalación

Next.js se configuró a mano siguiendo la instalación oficial; no se usó starter kit ni plantilla.

#### 1. Requisitos

| Qué | Versión | Para qué | Comprobar |
| --- | --- | --- | --- |
| Git | cualquiera reciente | Clonar el repositorio | `git --version` |
| Node.js | 22.18 o superior (probado con 24.14; ver `.nvmrc`) | App y scripts; Node ejecuta el TypeScript de `scripts/` sin compilar | `node -v` |
| npm | incluido con Node (probado con 11.11) | Dependencias y comandos | `npm -v` |
| Docker Desktop | en marcha (probado con 29.7, 8 GB de memoria asignada) | Supabase local: Postgres, Auth, API REST y Studio en contenedores | `docker info` |
| Supabase CLI | incluido en el proyecto (`devDependencies`) | Arrancar la base, migraciones y pruebas | `npx supabase --version` |

Espacio: las imágenes de Supabase ocupan unos **8,6 GB** (medido en esta máquina). Conexión a internet en la primera instalación y en `npm run build` (descarga las fuentes).

Si no tienes Docker o Node:

```sh
# macOS (Homebrew)
brew install --cask docker     # abre Docker Desktop una vez y espera a que diga «running»
brew install nvm               # o instala Node desde nodejs.org
nvm install                    # dentro del repositorio: usa la versión de .nvmrc
nvm use
```

En Windows usa Docker Desktop con WSL 2 y ejecuta los comandos dentro de WSL. En Linux, Docker Engine con el plugin de Compose.

#### 2. Instalar y arrancar

```sh
git clone --branch main https://github.com/JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci                         # instala las dependencias exactas de package-lock.json
npm run db:start               # supabase start: la primera vez descarga las imágenes
```

#### 3. Variables de entorno

Genera `.env.local` a partir de la base local (macOS, Linux o WSL):

```sh
eval "$(npm run --silent db:status -- -o env)"
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DEMO_PASSWORD=sellervate-demo
EOF
```

O a mano: `cp .env.example .env.local` y copia `ANON_KEY` y `SERVICE_ROLE_KEY` de `npm run db:status`. La clave `service_role` solo la usa `scripts/seed.ts`, nunca el código que atiende peticiones. `.env.local` está en `.gitignore`.

#### 4. Base de datos, datos de demo y app

```sh
npm run db:reset               # BORRA y recrea la base local aplicando supabase/migrations
npm run seed                   # 5 cuentas, 3 marcas, 42 respuestas, 27 revisiones (fechas relativas a hoy)
npm run dev                    # http://localhost:3000
```

En otra terminal, con la app en marcha:

```sh
npm run authz-check            # 29 comprobaciones de autorización contra la API y la app
```

#### 5. Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm run db:status` | Estado de Supabase, URLs y claves locales |
| `npm run db:stop` | Detiene los contenedores y conserva los datos |
| `npx supabase stop --no-backup` | Detiene y **borra** los volúmenes de datos |
| `npm run db:reset` | Recrea la base desde las migraciones (borra los datos) |
| `npx supabase migration up --local` | Aplica migraciones nuevas sin borrar datos |
| `npm run db:test` | Pruebas pgTAP de la base (169 aserciones) |
| `npm run check` | ESLint, TypeScript y build de producción |
| `npm run build && npm run start` | App en modo producción |

Puertos locales: app `3000`; API de Supabase `54321`; Postgres `54322` (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`); Studio `54323` (http://127.0.0.1:54323, para ver las tablas); correo de pruebas `54324`.

#### 6. Si algo falla

| Síntoma | Causa y solución |
| --- | --- |
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto: ábrelo y espera a que esté «running». |
| `port is already allocated` al arrancar | Otro proyecto de Supabase usa los puertos: `npx supabase stop --project-id <otro>` o cierra ese proyecto. |
| `seed: la base ya tiene datos` | El seed solo corre sobre una base vacía: `npm run db:reset` y vuelve a sembrar. |
| `seed: faltan NEXT_PUBLIC_SUPABASE_URL…` | Falta `.env.local` o sus claves: repite el paso 3. |
| «Sign-in failed» al cambiar de persona | No se ejecutó el seed o `DEMO_PASSWORD` no es `sellervate-demo`. |
| «This page could not load its data» | La base no responde: `npm run db:status`; si está parada, `npm run db:start`. |
| `npm run build` falla descargando fuentes | `next/font` necesita internet al compilar. |

**Medido:** desde el clon hasta `authz-check` en verde tardó **65 s** (instalación 5 s, reset 31 s) con caché de npm, imágenes ya descargadas y Supabase ya arrancado. En una máquina nueva la descarga de ~8,6 GB de imágenes añade varios minutos que no se pudieron medir; el objetivo de menos de diez minutos no está verificado en ese caso.

### Usuarios de demo y cambio de rol

Elige a la persona en **«Viewing as»**, arriba a la derecha, y pulsa **Switch**. Es un login simulado con sesión real: el servidor inicia sesión en Supabase Auth con `DEMO_PASSWORD` (`sellervate-demo`) y Postgres ve el `auth.uid()` de esa persona; lo que aparece lo decide RLS, no la interfaz.

| Cuenta (`@demo.sellervate.test`) | Rol | Marcas | Qué ver |
| --- | --- | --- | --- |
| `marta` | Líder | Voltia Scooters, Caja Norte | Cola (Lucía primero en Caja Norte), evidencia de Voltia |
| `nuria` | Líder | Brisa Café | Una cola distinta; no ve nada de Voltia ni Caja Norte |
| `dani` | Especialista | Voltia, Caja Norte | Su feedback: «No revisó el historial del pedido» en tres semanas |
| `lucia` | Especialista | Caja Norte, Brisa Café | Sin revisiones en los últimos 10 días (hueco de cobertura) |
| `oscar` | Especialista | Voltia, Brisa Café | La devolución sin diagnóstico (puntaje 1, crítica) |

### Recorrido

1. **Cola** (`/review`, líderes): respuestas sin revisar de 14 días por marca; primero quien lleva más sin revisión *en esa marca*, luego la más antigua; cobertura por especialista.
2. **Revisión** (`/review/<id>`): respuesta como carta junto al procedimiento de la marca; puntaje 1–4, problemas por severidad (globales y de esa marca), comentario. Teclado: `1`–`4`, `C`, `⌘/Ctrl+Enter` guarda y pasa a la siguiente.
3. **Feedback** (`/me`, especialistas): promedio por marca siempre con n, cada comentario con la respuesta original, filtro por marca.
4. **Evidencia** (`/brands/<slug>`, líderes de esa marca): tendencia semanal con n e intervenciones, críticos con enlace, patrones que se repiten en varias semanas, cobertura y registro de cambios.

### Autorización y pruebas

```sh
npm run authz-check   # con npm run dev en marcha
npm run db:test       # pgTAP
npm run check         # ESLint, TypeScript y build
```

- `authz-check` usa solo la clave anon y sesiones reales, y llama directamente a PostgREST y a la app: **29 casos**, entre ellos otra marca, otra especialista de la misma marca, otro líder, anónimo, escrituras prohibidas, firmar como otra persona y 404 (no 403) para lo ajeno.
- `db:test`: **169 aserciones** en 7 archivos, sobre integridad, cada política, cola, guardado atómico, resumen y evidencia.
- En la última ejecución pasaron las tres, además del lint SQL. Se usan en local; no hay CI.

### Qué probaría primero

`authz-check` como prueba automática en CI en cada PR: es la garantía que no se ve en la interfaz y la que rompería el servicio si falla. Existe y pasa, pero se ejecuta a mano. Después, una prueba de navegador del recorrido cola → revisión → feedback. No fueron la mejor inversión de la quinta hora porque quedaban por construir el feedback y la evidencia, sin los que el loop no se cierra; las pruebas de base ya cubrían las reglas de autorización e integridad.

### Horas reales

**6 h 30 min efectivas**, declaradas por el autor: 6 h de requerimientos técnicos (implementación, revisión de PR y verificación) y 30 min de análisis del problema y elaboración del pipeline. Los intervalos medidos en las sesiones están en el [registro de tiempo](docs/time-log.md).

### Entrega

- [x] Repositorio público, `main` como rama predeterminada, historial y ramas conservados.
- [x] P0–P9b integrados mediante PR con merge commit.
- [x] `DECISIONS.md` en inglés y español; la parte en inglés cabe en dos páginas.
- [ ] P10: revisión escrita del autor en el PR y merge.
- [ ] Comprobar en GitHub que cada PR tiene la revisión escrita del autor antes de su merge.
- [ ] Confirmar la fecha de recepción del ejercicio (una semana natural de plazo).
- [ ] Enlace al repositorio y horas reales **dentro del texto** de la propuesta de Upwork.

Detalle por criterio de evaluación: [matriz de evaluación y entrega](docs/delivery-checklist.md).

### Documentación

- [Decisiones (inglés y español)](DECISIONS.md) · [Interpretación del problema](01-problema.md) · [Pipeline](02-pipeline.md)
- [Modelo de datos](docs/data-model.md) · [Acuerdo de ejecución](docs/implementation-plan.md) · [Registro de tiempo](docs/time-log.md)
- Prompts y evidencias por problema: [`ai-logs/`](ai-logs) · Descripciones de PR: `docs/P*-pr.md`
- Reglas del agente: [CLAUDE.md](CLAUDE.md). El PDF del ejercicio se conserva fuera del repositorio.

## English

An internal product for the quality loop of a white-label support team: it evaluates already-sent replies against each brand's own procedure. It is not a generic comment-scoring system. The lead reviews against that procedure, the specialist reads their feedback privately, and the brand gets evidence with sample sizes, not impressions. Decisions are in [DECISIONS.md](DECISIONS.md).

### Status

The full journey works: credible seed → role switching with a real session → coverage-ordered review queue → review with atomic save → specialist feedback → brand evidence, with loading, error and empty states. P0–P9b are integrated into `main` through PRs #1–#10 with merge commits. P10 (`docs/decisions`, this documentation) is in its PR. What remains before submission is under [Delivery](#delivery).

### Installation guide

Next.js was set up by hand following the official installation; no starter kit or template was used.

#### 1. Requirements

| What | Version | Why | Check |
| --- | --- | --- | --- |
| Git | any recent | Clone the repository | `git --version` |
| Node.js | 22.18 or newer (tested with 24.14; see `.nvmrc`) | App and scripts; Node runs the TypeScript in `scripts/` without compiling | `node -v` |
| npm | bundled with Node (tested with 11.11) | Dependencies and commands | `npm -v` |
| Docker Desktop | running (tested with 29.7, 8 GB of memory assigned) | Local Supabase: Postgres, Auth, REST API and Studio in containers | `docker info` |
| Supabase CLI | included in the project (`devDependencies`) | Start the database, migrations and tests | `npx supabase --version` |

Disk: the Supabase images take about **8.6 GB** (measured on this machine). Internet access for the first install and for `npm run build` (it downloads the fonts).

If you do not have Docker or Node:

```sh
# macOS (Homebrew)
brew install --cask docker     # open Docker Desktop once and wait until it says "running"
brew install nvm               # or install Node from nodejs.org
nvm install                    # inside the repository: uses the version in .nvmrc
nvm use
```

On Windows use Docker Desktop with WSL 2 and run the commands inside WSL. On Linux, Docker Engine with the Compose plugin.

#### 2. Install and start

```sh
git clone --branch main https://github.com/JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci                         # installs the exact dependencies from package-lock.json
npm run db:start               # supabase start: the first run downloads the images
```

#### 3. Environment variables

Generate `.env.local` from the local database (macOS, Linux or WSL):

```sh
eval "$(npm run --silent db:status -- -o env)"
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=$API_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
DEMO_PASSWORD=sellervate-demo
EOF
```

Or by hand: `cp .env.example .env.local` and copy `ANON_KEY` and `SERVICE_ROLE_KEY` from `npm run db:status`. The `service_role` key is used only by `scripts/seed.ts`, never by request-handling code. `.env.local` is in `.gitignore`.

#### 4. Database, demo data and app

```sh
npm run db:reset               # DELETES and rebuilds the local database from supabase/migrations
npm run seed                   # 5 accounts, 3 brands, 42 replies, 27 reviews (dates relative to today)
npm run dev                    # http://localhost:3000
```

In another terminal, with the app running:

```sh
npm run authz-check            # 29 authorization checks against the API and the app
```

#### 5. Useful commands

| Command | What it does |
| --- | --- |
| `npm run db:status` | Supabase status, local URLs and keys |
| `npm run db:stop` | Stops the containers and keeps the data |
| `npx supabase stop --no-backup` | Stops and **deletes** the data volumes |
| `npm run db:reset` | Rebuilds the database from migrations (deletes data) |
| `npx supabase migration up --local` | Applies new migrations without deleting data |
| `npm run db:test` | pgTAP database tests (169 assertions) |
| `npm run check` | ESLint, TypeScript and production build |
| `npm run build && npm run start` | App in production mode |

Local ports: app `3000`; Supabase API `54321`; Postgres `54322` (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`); Studio `54323` (http://127.0.0.1:54323, to browse the tables); test mail `54324`.

#### 6. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Cannot connect to the Docker daemon` | Docker Desktop is not open: open it and wait until it is "running". |
| `port is already allocated` on start | Another Supabase project uses the ports: `npx supabase stop --project-id <other>` or close that project. |
| `seed: la base ya tiene datos` | The seed only runs on an empty database: `npm run db:reset`, then seed again. |
| `seed: faltan NEXT_PUBLIC_SUPABASE_URL…` | `.env.local` or its keys are missing: repeat step 3. |
| "Sign-in failed" when switching person | The seed did not run, or `DEMO_PASSWORD` is not `sellervate-demo`. |
| "This page could not load its data" | The database is not answering: `npm run db:status`; if stopped, `npm run db:start`. |
| `npm run build` fails downloading fonts | `next/font` needs internet at build time. |

**Measured:** from clone to a passing `authz-check` took **65 s** (install 5 s, reset 31 s) with a warm npm cache, images already downloaded and Supabase already running. On a fresh machine downloading ~8.6 GB of images adds several minutes that could not be measured; the under-ten-minutes target is not verified for that case.

### Demo users and role switching

Pick the person under **"Viewing as"**, top right, and press **Switch**. It is a simulated login with a real session: the server signs in to Supabase Auth with `DEMO_PASSWORD` (`sellervate-demo`) and Postgres sees that person's `auth.uid()`; RLS, not the interface, decides what appears.

| Account (`@demo.sellervate.test`) | Role | Brands | What to look at |
| --- | --- | --- | --- |
| `marta` | Lead | Voltia Scooters, Caja Norte | Queue (Lucía first in Caja Norte), Voltia evidence |
| `nuria` | Lead | Brisa Café | A different queue; sees nothing from Voltia or Caja Norte |
| `dani` | Specialist | Voltia, Caja Norte | His feedback: "No revisó el historial del pedido" across three weeks |
| `lucia` | Specialist | Caja Norte, Brisa Café | No reviews in the last 10 days (coverage gap) |
| `oscar` | Specialist | Voltia, Brisa Café | The return offered without diagnosis (score 1, critical) |

### Journey

1. **Queue** (`/review`, leads): unreviewed replies from 14 days, per brand; whoever has gone longest without a review *in that brand* first, then the oldest reply; coverage per specialist.
2. **Review** (`/review/<id>`): the reply as a letter beside the brand's procedure; score 1–4, issues by severity (global and that brand's), comment. Keyboard: `1`–`4`, `C`, `⌘/Ctrl+Enter` saves and moves to the next.
3. **Feedback** (`/me`, specialists): average per brand always with n, every comment with the original reply, brand filter.
4. **Evidence** (`/brands/<slug>`, that brand's leads): weekly trend with n and interventions, critical issues with links, patterns repeated across weeks, coverage and a change log.

### Authorization and tests

```sh
npm run authz-check   # with npm run dev running
npm run db:test       # pgTAP
npm run check         # ESLint, TypeScript and build
```

- `authz-check` uses only the anon key and real sessions, calling PostgREST and the app directly: **29 cases**, including another brand, another specialist in the same brand, another lead, anonymous, forbidden writes, signing as someone else and 404 (not 403) for other people's data.
- `db:test`: **169 assertions** across 7 files, covering integrity, every policy, the queue, atomic save, the summary and the evidence.
- All three passed on the last run, as did the SQL lint. They run locally; there is no CI.

### What I would test first

`authz-check` as an automated test in CI on every PR: it is the guarantee the interface cannot show, and the one that would break the service if it failed. It exists and passes, but runs by hand. Next, a browser test of the queue → review → feedback journey. Neither was the best use of hour five because feedback and evidence still had to be built, and without them the loop does not close; the database tests already covered the authorization and integrity rules.

### Actual time

**6 h 30 min effective**, as declared by the author: 6 h of technical requirements (implementation, PR review and verification) and 30 min analysing the problem and building the pipeline. Intervals measured during the sessions are in the [time log](docs/time-log.md).

### Delivery

- [x] Public repository, `main` as the default branch, history and branches kept.
- [x] P0–P9b integrated through PRs with merge commits.
- [x] `DECISIONS.md` in English and Spanish; the English part fits in two pages.
- [ ] P10: the author's written review on the PR and merge.
- [ ] Check on GitHub that each PR carries the author's written review before its merge.
- [ ] Confirm the date the exercise was received (one calendar week deadline).
- [ ] Repository link and actual hours **in the text** of the Upwork proposal.

Per-criterion detail: [evaluation and delivery matrix](docs/delivery-checklist.md).

### Documentation

- [Decisions (English and Spanish)](DECISIONS.md) · [Problem interpretation](01-problema.md) · [Pipeline](02-pipeline.md)
- [Data model](docs/data-model.md) · [Execution agreement](docs/implementation-plan.md) · [Time log](docs/time-log.md)
- Prompts and evidence per problem: [`ai-logs/`](ai-logs) · PR descriptions: `docs/P*-pr.md`
- Agent rules: [CLAUDE.md](CLAUDE.md). The exercise PDF is kept outside the repository.
