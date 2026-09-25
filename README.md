# Sellervate · Quality review

[Español](#español) · [English](#english)

## Español

Herramienta interna para evaluar respuestas de soporte ya enviadas según los procedimientos de cada marca. El líder registra su juicio, el especialista consulta su feedback privado y esas revisiones sirven como evidencia de calidad.

### Estado y rama principal

**En construcción; todavía no es la entrega final.** P0 está integrado en `main`. P1 añade en `feat/data-model` las tablas de marcas, personas, asignaciones y respuestas, con integridad e índices y acceso cerrado por defecto. Los criterios/revisiones de P2, seed, cambio de usuario, políticas de autorización y recorridos del producto siguen pendientes.

**`main` es la rama principal de integración y entrega.** Cada problema se trabaja con un prompt independiente y una rama basada en `main`; su PR apunta a `main`. Después de tu revisión escrita y las correcciones, se incorpora mediante **merge commit**, conservando ramas y commits, sin squash ni rebase. P1/P2 comparten un PR según el pipeline. Las mejoras siguientes parten del `main` actualizado.

`main` es la rama predeterminada y contiene P0 mediante el merge del PR #1 (`1beec2a`). P1/P2 se preparan en `feat/data-model` para PR1 del pipeline (el número asignado por GitHub puede ser distinto). Usamos exclusivamente **Git por SSH** en la terminal y la web de GitHub para crear/revisar/integrar PR. Consulta el [procedimiento de integración](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

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

Para revisar P1 antes de su merge, cambia a `feat/data-model` después de clonar, una vez publicada la rama. En este checkout existente, empieza en `npm ci`. Si ya tienes `.env.local`, conserva sus valores y agrega solo las variables que falten. Un evaluador sin llave SSH puede clonar el repositorio público con `https://github.com/JuanBau514/prueba-Sellervate.git`; esto no cambia nuestro remoto de trabajo SSH.

Copia la URL local y la clave `anon` de Supabase a `.env.local`. La clave `service_role` debe permanecer solo en el servidor; su único consumidor previsto es `scripts/seed.ts`. La página inicial de P0 no necesita credenciales. El primer arranque de Supabase descarga imágenes Docker y depende de la conexión.

```sh
npm run dev
```

Abre http://localhost:3000. Para detener Supabase: `npm run db:stop`.

### Datos de demostración y roles

**P1 implementado; pendientes P2–P4.** Aún no existen cuentas de demo, seed ni selector de usuario. El mínimo del brief es dos marcas, tres especialistas y dos líderes, con respuestas creíbles y suficientes revisiones. Nuestro plan usa tres marcas para demostrar el aislamiento entre líderes. P3 incorporará el seed y P4 el cambio de rol con autorización real en el servidor. Los fixtures de pruebas de P1 se revierten al terminar; no son datos de demostración.

La migración de P1 se aplica con `npm run db:reset` en la base local desechable. El comando de seed y las cuentas se documentarán cuando estén implementados y verificados. El objetivo obligatorio es pasar de un clon limpio al producto con datos y roles en menos de diez minutos; todavía no está verificado.

### Validación y limitaciones

```sh
npm run check
```

Ejecuta ESLint, TypeScript y una compilación de producción. Estas comprobaciones pasaron en P0; también se verificaron el arranque de la app y la salud de Supabase. Para aplicar P1 y probar su integridad en Supabase local, ejecuta lo siguiente en `feat/data-model`. **`db:reset` borra los datos locales**; úsalo solo en la base de desarrollo desechable:

```sh
npm run db:reset
npm run db:test
```

Las pruebas de P1 comprueban asignaciones válidas, identidad de importación, conservación del historial y denegación inicial por RLS. En P4 se reemplazará ese cierre total por pruebas de acceso permitido y prohibido entre marcas y especialistas, incluidas llamadas directas a la API. La cobertura exhaustiva y el despliegue no son requisitos del brief; la evaluación ejecuta el proyecto localmente. Ver [modelo y decisiones de P1](docs/data-model.md).

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

**Work in progress; not the final submission.** P0 is integrated into `main`. P1 adds brands, people, assignments and replies on `feat/data-model`, with integrity constraints, indexes and access denied by default. P2 quality criteria/reviews, seed data, user switching, authorization policies and product journeys are still pending.

**`main` is the integration and delivery branch.** Each problem uses an independent prompt and a working branch based on `main`; its PR targets `main`. After your written review and corrections, it is integrated with a **merge commit**, retaining branches and commits, without squash or rebase. P1/P2 share a PR as specified by the pipeline. Subsequent work starts from the updated `main`.

`main` is the default branch and contains P0 through PR #1's merge (`1beec2a`). P1/P2 are prepared on `feat/data-model` for pipeline PR1 (GitHub may assign a different number). We use only **Git over SSH** in the terminal and GitHub's website to create, review and merge PRs. See the [integration procedure](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

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

To review P1 before its merge, switch to `feat/data-model` after cloning once that branch is published. In this existing checkout, start at `npm ci`. If `.env.local` already exists, preserve its values and add only missing variables. Evaluators without an SSH key may clone the public repository using `https://github.com/JuanBau514/prueba-Sellervate.git`; this does not change our SSH working remote.

Copy the local Supabase URL and anon key into `.env.local`. Keep the service role key server-only; its sole planned consumer is `scripts/seed.ts`. The P0 landing page does not need credentials. The first Supabase start downloads Docker images and depends on connection speed.

```sh
npm run dev
```

Open http://localhost:3000. Stop Supabase with `npm run db:stop`.

### Demo data and roles

**P1 implemented; P2–P4 pending.** Demo accounts, seed data and a user switcher do not exist yet. The brief requires at least two brands, three specialists and two team leads, with credible replies and enough scored rows. Our plan uses three brands to demonstrate isolation between leads. P3 adds the seed; P4 adds role switching with real server-side authorization. P1 test fixtures are rolled back after execution and are not demo data.

Apply the P1 migration with `npm run db:reset` on the disposable local database. Seed commands and accounts will be documented once implemented and verified. The required target is a working product with data and roles within ten minutes of a fresh clone; that target has not yet been verified.

### Validation and limitations

```sh
npm run check
```

Runs ESLint, TypeScript and a production build. These checks passed for P0; application startup and Supabase health were also verified. To apply P1 and test its integrity on local Supabase, run the following on `feat/data-model`. **`db:reset` deletes local data**; use it only on the disposable development database:

```sh
npm run db:reset
npm run db:test
```

P1 tests valid assignments, import identity, history preservation and the initial RLS denial. P4 will replace the complete access closure with allowed/forbidden access tests across brands and specialists, including direct API calls. Exhaustive coverage and deployment are not brief requirements; evaluation runs the project locally. See [P1 model and decisions](docs/data-model.md).

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
- [Modelo de P1 / P1 data model](docs/data-model.md)
- [Prompt y registro de P1 / P1 prompt and record](ai-logs/P1.md)

El PDF del ejercicio se conserva localmente. / The supplied exercise PDF stays local.
