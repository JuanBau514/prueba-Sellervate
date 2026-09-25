# Sellervate · Quality review

[Español](#español) · [English](#english)

## Español

Herramienta interna para evaluar respuestas de soporte ya enviadas según los procedimientos de cada marca. El líder registra su juicio, el especialista consulta su feedback privado y esas revisiones sirven como evidencia de calidad.

### Estado y rama principal

**En construcción; todavía no es la entrega final.** P0 y P1 están integrados en `main`. P2 añade en `feat/quality-criteria` criterios globales/por marca con severidad, revisiones, etiquetas por revisión e intervenciones de marca. Seed, cambio de usuario, políticas de autorización y recorridos del producto siguen pendientes.

**`main` es la rama principal de integración y entrega.** Cada problema se trabaja con un prompt independiente y una rama basada en `main`; su PR apunta a `main`. Después de tu revisión escrita y las correcciones, se incorpora mediante **merge commit**, conservando ramas y commits, sin squash ni rebase. Por tu instrucción más reciente, P1 y P2 tendrán ramas y PR separados: P1 en `feat/data-model` y P2 en `feat/quality-criteria`, después de integrar P1.

`main` es la rama predeterminada y contiene P0 mediante PR #1 (`1beec2a`) y P1 normalizado mediante PR #2 (`2b7aba8`). P2 está implementado en una rama independiente, pendiente de revisión e integración. Usamos exclusivamente **Git por SSH** en la terminal y la web de GitHub para crear/revisar/integrar PR. Consulta el [procedimiento de integración](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

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

Para revisar P2 antes de su merge, cambia a `feat/quality-criteria` después de clonar, una vez publicada la rama. En este checkout existente, empieza en `npm ci`. Si ya tienes `.env.local`, conserva sus valores y agrega solo las variables que falten. Un evaluador sin llave SSH puede clonar el repositorio público con `https://github.com/JuanBau514/prueba-Sellervate.git`; esto no cambia nuestro remoto de trabajo SSH.

Copia la URL local y la clave `anon` de Supabase a `.env.local`. La clave `service_role` debe permanecer solo en el servidor; su único consumidor previsto es `scripts/seed.ts`. La página inicial de P0 no necesita credenciales. El primer arranque de Supabase descarga imágenes Docker y depende de la conexión.

```sh
npm run dev
```

Abre http://localhost:3000. Para detener Supabase: `npm run db:stop`.

### Datos de demostración y roles

**P1 y P2 implementados; pendientes P3–P4.** Aún no existen cuentas de demo, seed ni selector de usuario. El mínimo del brief es dos marcas, tres especialistas y dos líderes, con respuestas creíbles y suficientes revisiones. Nuestro plan usa tres marcas para demostrar el aislamiento entre líderes. P3 incorporará el seed y P4 el cambio de rol con autorización real en el servidor. Los fixtures de pruebas se revierten al terminar; no son datos de demostración.

Las migraciones se aplican con `npx --no-install supabase migration up --local`, sin borrar filas existentes. El comando de seed y las cuentas se documentarán cuando estén implementados y verificados. El objetivo obligatorio es pasar de un clon limpio al producto con datos y roles en menos de diez minutos; todavía no está verificado.

### Validación y limitaciones

```sh
npm run check
```

Ejecuta ESLint, TypeScript y una compilación de producción. Estas comprobaciones pasaron en P0; también se verificaron el arranque de la app y la salud de Supabase. P2 solo modifica SQL y documentación, sin repetir el build de la aplicación. Para aplicar las migraciones sin recrear la base local, ejecuta lo siguiente en `feat/quality-criteria`. **`npm run db:reset` es una alternativa que borra los datos locales**; resérvala para reconstruir una base desechable:

```sh
npx --no-install supabase migration up --local
npm run db:test
```

Las pruebas comprueban asignaciones, identidad de importación, historial, criterios y revisiones, rechazo de etiquetas ajenas y denegación inicial por RLS. Pasan **110 aserciones** y el lint SQL de `public,private` no encuentra errores. En P4 se reemplazará ese cierre total por pruebas de acceso permitido y prohibido entre marcas y especialistas, incluidas llamadas directas a la API. La cobertura exhaustiva y el despliegue no son requisitos del brief; la evaluación ejecuta el proyecto localmente. Ver [modelo y decisiones](docs/data-model.md).

Solo `people` almacena el rol; la marca de una revisión se deriva de su respuesta y la severidad vive en el catálogo. Con las dependencias declaradas, el modelo conserva 3FN. Límites de V1: rol, marca de respuesta, atribución de revisión y ámbito/código/severidad de criterio son fijos; los nombres, etiquetas y feedback admiten correcciones. Cambiar la severidad requiere un nuevo criterio. Se valida que el revisor sea líder asignado, pero la autorización por sesión queda para P4 y el guardado atómico con etiquetas para P6. No hay auditoría de versiones del feedback.

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

**Work in progress; not the final submission.** P0 and P1 are integrated into `main`. P2 adds global/brand-specific criteria with severity, reviews, review tags and brand interventions on `feat/quality-criteria`. Seed data, user switching, authorization policies and product journeys are still pending.

**`main` is the integration and delivery branch.** Each problem uses an independent prompt and a working branch based on `main`; its PR targets `main`. After your written review and corrections, it is integrated with a **merge commit**, retaining branches and commits, without squash or rebase. Per your latest instruction, P1 and P2 use separate branches and PRs: P1 on `feat/data-model`, then P2 on `feat/quality-criteria` after P1 is merged.

`main` is the default branch and contains P0 through PR #1 (`1beec2a`) and normalized P1 through PR #2 (`2b7aba8`). P2 is implemented on a separate branch, awaiting review and integration. We use only **Git over SSH** in the terminal and GitHub's website to create, review and merge PRs. See the [integration procedure](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

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

To review P2 before its merge, switch to `feat/quality-criteria` after cloning once that branch is published. In this existing checkout, start at `npm ci`. If `.env.local` already exists, preserve its values and add only missing variables. Evaluators without an SSH key may clone the public repository using `https://github.com/JuanBau514/prueba-Sellervate.git`; this does not change our SSH working remote.

Copy the local Supabase URL and anon key into `.env.local`. Keep the service role key server-only; its sole planned consumer is `scripts/seed.ts`. The P0 landing page does not need credentials. The first Supabase start downloads Docker images and depends on connection speed.

```sh
npm run dev
```

Open http://localhost:3000. Stop Supabase with `npm run db:stop`.

### Demo data and roles

**P1 and P2 implemented; P3–P4 pending.** Demo accounts, seed data and a user switcher do not exist yet. The brief requires at least two brands, three specialists and two team leads, with credible replies and enough scored rows. Our plan uses three brands to demonstrate isolation between leads. P3 adds the seed; P4 adds role switching with real server-side authorization. Test fixtures are rolled back after execution and are not demo data.

Apply migrations with `npx --no-install supabase migration up --local`, preserving existing rows. Seed commands and accounts will be documented once implemented and verified. The required target is a working product with data and roles within ten minutes of a fresh clone; that target has not yet been verified.

### Validation and limitations

```sh
npm run check
```

Runs ESLint, TypeScript and a production build. These checks passed for P0; application startup and Supabase health were also verified. P2 changes only SQL and documentation; the application build was not rerun. To apply migrations without recreating the local database, run the following on `feat/quality-criteria`. **`npm run db:reset` is an alternative that deletes local data**; reserve it for rebuilding a disposable database:

```sh
npx --no-install supabase migration up --local
npm run db:test
```

Tests cover assignments, import identity, history, criteria and reviews, rejection of foreign-brand tags and initial RLS denial. **110 assertions pass**, and SQL lint for `public,private` reports no errors. P4 will replace the complete access closure with allowed/forbidden access tests across brands and specialists, including direct API calls. Exhaustive coverage and deployment are not brief requirements; evaluation runs the project locally. See [model and decisions](docs/data-model.md).

Only `people` stores the role; a review's brand is derived from its reply and severity lives in the catalog. Under the declared dependencies, the model remains in 3NF. V1 limitations: role, reply brand, review attribution and criterion scope/code/severity are fixed; names, labels and feedback allow corrections. Changing severity requires a new criterion. Reviewers must be assigned leads, but session authorization belongs to P4 and atomic review/tag submission to P6. Feedback revision auditing is not implemented.

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

El PDF del ejercicio se conserva localmente. / The supplied exercise PDF stays local.
