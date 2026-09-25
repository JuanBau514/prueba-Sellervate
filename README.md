# Sellervate · Quality review

[Español](#español) · [English](#english)

## Español

Herramienta interna para evaluar respuestas de soporte ya enviadas según el procedimiento de cada marca. El líder revisa contra ese procedimiento, el especialista lee su feedback en privado y la marca recibe evidencia con tamaño de muestra, no impresiones. Las decisiones están en [DECISIONS.md](DECISIONS.md).

### Estado

El recorrido completo funciona: seed creíble → cambio de rol con sesión real → cola de revisión por cobertura → revisión con guardado atómico → feedback del especialista → evidencia por marca, con estados de carga, error y vacío. P0–P8 están integrados en `main` mediante PR #1–#9 con merge commit. P9b (`chore/states-polish`) y P10 (`docs/decisions`, esta documentación) esperan su PR. Lo que falta para enviar está en [Entrega](#entrega).

### Requisitos

- Node.js 22.18 o superior (se usa 24, ver `.nvmrc`): ejecuta el TypeScript de los scripts sin compilar.
- npm y Docker Desktop en marcha.
- Supabase CLI viene como dependencia del proyecto; no hace falta instalarlo aparte.

Next.js se configuró a mano siguiendo la instalación oficial; no se usó starter kit ni plantilla.

### Puesta en marcha

```sh
git clone --branch main https://github.com/JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci
npm run db:start               # supabase start
cp .env.example .env.local
npm run db:status              # copia ANON_KEY y SERVICE_ROLE_KEY a .env.local
npm run db:reset               # supabase db reset: BORRA y recrea la base local con las migraciones
npm run seed                   # 5 cuentas, 3 marcas, 42 respuestas, 27 revisiones
npm run dev                    # http://localhost:3000
```

`.env.local` necesita `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` de `npm run db:status`; la URL y `DEMO_PASSWORD` ya vienen rellenas. La clave `service_role` solo la usa `scripts/seed.ts`, nunca el código que atiende peticiones. El seed se niega a correr contra una URL no local o una base con datos. Las fechas son relativas a hoy.

**Medido:** desde el clon hasta `authz-check` en verde tardó **65 s** (instalación 5 s, reset 31 s) en una máquina con caché de npm, imágenes de Docker ya descargadas y Supabase ya arrancado. En una máquina nueva la primera descarga de imágenes de Supabase añade varios minutos que no se pudieron medir; el objetivo de menos de diez minutos no está verificado en ese caso.

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
- [x] P0–P8 integrados mediante PR con merge commit.
- [x] `DECISIONS.md` de dos páginas como máximo.
- [ ] P9b y P10: PR, revisión escrita del autor y merge.
- [ ] Comprobar en GitHub que cada PR tiene la revisión escrita del autor antes de su merge.
- [ ] Confirmar la fecha de recepción del ejercicio (una semana natural de plazo).
- [ ] Enlace al repositorio y horas reales **dentro del texto** de la propuesta de Upwork.

Detalle por criterio de evaluación: [matriz de evaluación y entrega](docs/delivery-checklist.md).

### Documentación

- [Decisiones](DECISIONS.md) · [Interpretación del problema](01-problema.md) · [Pipeline](02-pipeline.md)
- [Modelo de datos](docs/data-model.md) · [Acuerdo de ejecución](docs/implementation-plan.md) · [Registro de tiempo](docs/time-log.md)
- Prompts y evidencias por problema: [`ai-logs/`](ai-logs) · Descripciones de PR: `docs/P*-pr.md`
- Reglas del agente: [CLAUDE.md](CLAUDE.md). El PDF del ejercicio se conserva fuera del repositorio.

## English

An internal tool for evaluating already-sent support replies against each brand's own procedure. The lead reviews against that procedure, the specialist reads their feedback privately, and the brand gets evidence with sample sizes, not impressions. Decisions are in [DECISIONS.md](DECISIONS.md).

### Status

The full journey works: credible seed → role switching with a real session → coverage-ordered review queue → review with atomic save → specialist feedback → brand evidence, with loading, error and empty states. P0–P8 are integrated into `main` through PRs #1–#9 with merge commits. P9b (`chore/states-polish`) and P10 (`docs/decisions`, this documentation) await their PRs. What remains before submission is under [Delivery](#delivery).

### Requirements

- Node.js 22.18 or newer (24 is used, see `.nvmrc`): it runs the scripts' TypeScript without compiling.
- npm and Docker Desktop running.
- Supabase CLI is a project dependency; no separate install is needed.

Next.js was set up by hand following the official installation; no starter kit or template was used.

### Getting started

```sh
git clone --branch main https://github.com/JuanBau514/prueba-Sellervate.git
cd prueba-Sellervate
npm ci
npm run db:start               # supabase start
cp .env.example .env.local
npm run db:status              # copy ANON_KEY and SERVICE_ROLE_KEY into .env.local
npm run db:reset               # supabase db reset: DELETES and rebuilds the local database from migrations
npm run seed                   # 5 accounts, 3 brands, 42 replies, 27 reviews
npm run dev                    # http://localhost:3000
```

`.env.local` needs `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from `npm run db:status`; the URL and `DEMO_PASSWORD` are prefilled. The `service_role` key is used only by `scripts/seed.ts`, never by request-handling code. The seed refuses a non-local URL or a database that already has data. Dates are relative to today.

**Measured:** from clone to a passing `authz-check` took **65 s** (install 5 s, reset 31 s) on a machine with a warm npm cache, Docker images already downloaded and Supabase already running. On a fresh machine the first download of the Supabase images adds several minutes that could not be measured; the under-ten-minutes target is not verified for that case.

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
- [x] P0–P8 integrated through PRs with merge commits.
- [x] `DECISIONS.md` of at most two pages.
- [ ] P9b and P10: PR, the author's written review and merge.
- [ ] Check on GitHub that each PR carries the author's written review before its merge.
- [ ] Confirm the date the exercise was received (one calendar week deadline).
- [ ] Repository link and actual hours **in the text** of the Upwork proposal.

Per-criterion detail: [evaluation and delivery matrix](docs/delivery-checklist.md).

### Documentation

- [Decisions](DECISIONS.md) · [Problem interpretation](01-problema.md) · [Pipeline](02-pipeline.md)
- [Data model](docs/data-model.md) · [Execution agreement](docs/implementation-plan.md) · [Time log](docs/time-log.md)
- Prompts and evidence per problem: [`ai-logs/`](ai-logs) · PR descriptions: `docs/P*-pr.md`
- Agent rules: [CLAUDE.md](CLAUDE.md). The exercise PDF is kept outside the repository.
