# Decisions · Decisiones

[English](#english) · [Español](#español)

The English section is the two-page decisions document; the Spanish section says the same. · La sección en inglés es el documento de decisiones de dos páginas; la sección en español dice lo mismo.

## English

### A product, not a generic scoring system

The problem analysis (`01-problema.md`) and the development pipeline (`02-pipeline.md`, P0–P10) were written to build one product: the quality loop of a white-label support team that answers *as* each brand. It is not a configurable "rate customer comments" platform for any company. That choice shaped everything: criteria belong to a brand and carry severity; the unit of coverage is brand × specialist; a specialist sees only their own feedback; brands are isolated in the database because mixing them breaks the service promise; and the evidence is what a lead shows *that* brand each quarter. A generic tool would have started from forms, scales and settings; this one starts from Marta reviewing five replies a day against the scooter brand's procedure.

### Product

**The real problem.** Expert judgement about a reply disappears after a Slack message. Leads read a handful of replies a day out of hundreds and pick them without a method (one specialist skipped the order history for a month and the brand noticed first), and "good" depends on the brand: diagnose before a return for scooters, three exact lines for packaging.

**Built first.** The loop end to end, before reporting: a queue ordered by coverage gaps per brand and specialist → a workspace to review against the brand's procedure → the specialist's private feedback → brand evidence with sample sizes. Authorization came before the screens (P4).

**Left out, on purpose.** Helpdesk import (the model is ready: `source` + `external_id` unique per brand), coaching screens (only an `is_example` flag), editing a saved review, several reviews per reply, a login for the brand, notifications and feedback history.

**Where a model would go.** In triage, not in judgement: rank unreviewed replies by the probability of a *critical* brand issue (a return without diagnosis, a missing battery warning) and suggest tags for the lead to confirm. Before trusting it: precision and recall on critical tags against lead-labelled reviews, per brand, keeping the coverage rule so it cannot create blind spots.

**Questions before V2.** Should the brand see this directly? How many reviews a week make a trend credible for a small account? Is brand × specialist the right unit of coverage? Who owns and versions each brand's criteria?

### Architecture

**Shape.** Next.js App Router with Server Components. Reads go through `src/lib/data/*` (`server-only`) to PostgREST with the user's JWT; writes are Server Actions. Aggregates are SQL views with `security_invoker = true`; a review and its tags are saved by one `security invoker` function, `submit_review`. At the author's request no dependencies were added after the scaffold: Supabase is reached with `fetch`, and the demo session lives in httpOnly cookies renewed by `src/proxy.ts`.

**Data model.** Eight tables in 3NF: `people` (the only place a role lives), `brands`, `brand_memberships`, `replies`, `issue_tags` (global or per brand, severity on the criterion), `reviews` (one per reply, brand derived from the reply), `review_tags`, `brand_changes`. Identity fields are immutable in V1; triggers enforce "reviewer is a lead of the brand" and "tag is global or of that brand" even for the seed's service role.

**Where authorization lives.** In Postgres. RLS requires a brand membership (a role alone grants nothing); helpers are `security definer` with an empty `search_path`; `reviewer_id` and `author_id` come from `auth.uid()`; someone else's reply is a 404, not a 403. Evidence: 169 pgTAP assertions and `npm run authz-check` (29 cases against PostgREST and the running app).

**Real authentication would need** SSO or magic-link sign-in instead of the demo switcher, membership administration and offboarding, `Secure` cookies behind HTTPS, and `@supabase/ssr` instead of the hand-written session code.

**What breaks first.** Every figure is computed per request from all reviews (weekly aggregates would need materializing); RLS calls membership helpers per row; the session refresh is ours to maintain; one review per reply will not survive calibration between leads.

### AI

**How I worked.** One independent prompt, branch and PR per problem into `main`, merged by the author after review. Codex for P0–P2, Claude Code for P3–P10. Prompts and evidence are in `ai-logs/`.

**Where the author corrected the agent.** P1 duplicated the role in `brand_memberships` (2NF violation); the author asked for normalization and committed it (`ae05513`). P1/P2 were planned on one branch; the author split them. In P3 the agent asked to install `supabase-js` and `tsx`; the author ruled out new dependencies. In P6 the author's screenshot showed the queue cutting replies after the greeting. The agent caught three of its own defects: an average inflated by joins (P7), a clipped chart marker (P8), and `loading.tsx` turning 404s into 200s (P9b).

**A prompt I am proud of.** *[Draft for the author to confirm or replace]* The contract reused for every problem (`docs/implementation-plan.md`): "Implement only P… on its designated branch from reviewed main. State the scoped plan… Run the acceptance checks, review the diff for security and scope, and report what passed and what was blocked… do not fabricate [reviews]."

### Status

**Done.** Seed, real sessions with role switching, RLS isolation with executable checks, review queue with coverage, workspace with atomic save and shortcuts, specialist feedback with n, brand evidence, loading, error and empty states.

**Half done.** A formal visual comparison with sellervate.com; the clean-clone run was measured with warm caches (65 s), not on a fresh machine.

**Not touched.** Helpdesk import, editing reviews, CI, browser end-to-end tests, deployment, dark mode.

**Order to resume.** pgTAP and `authz-check` in CI; editing one's own review; helpdesk import; real authentication.

**Strongest objection to my own repository.** *[Draft for the author to confirm or replace]* The session layer is hand-written, cookies and token refresh that `@supabase/ssr` would own. I kept it because the no-dependency rule was explicit and RLS still verifies every token, but it is the first thing I would replace before real users.

## Español

### Un producto, no un sistema genérico de calificación

El análisis del problema (`01-problema.md`) y el pipeline de desarrollo (`02-pipeline.md`, P0–P10) se escribieron para construir un producto concreto: el loop de calidad de un equipo de soporte de marca blanca que responde *como* cada marca. No es una plataforma configurable para «calificar comentarios de clientes» de cualquier empresa. Esa elección lo determinó todo: los criterios pertenecen a una marca y tienen severidad; la unidad de cobertura es marca × especialista; un especialista ve solo su propio feedback; las marcas están aisladas en la base de datos porque mezclarlas rompe la promesa del servicio; y la evidencia es lo que un líder enseña a *esa* marca cada trimestre. Una herramienta genérica habría empezado por formularios, escalas y ajustes; esta empieza por Marta revisando cinco respuestas al día contra el procedimiento de la marca de scooters.

### Producto

**El problema real.** El juicio experto sobre una respuesta desaparece después de un mensaje de Slack. Los líderes leen pocas respuestas al día entre cientos y las eligen sin método (un especialista pasó un mes sin revisar el historial del pedido y la marca se enteró primero), y «bueno» depende de la marca: diagnosticar antes de una devolución en scooters, tres líneas exactas en empaques.

**Qué se construyó primero.** El loop de extremo a extremo, antes que los informes: una cola ordenada por huecos de cobertura por marca y especialista → un espacio para revisar contra el procedimiento de la marca → el feedback privado del especialista → evidencia por marca con tamaño de muestra. La autorización llegó antes que las pantallas (P4).

**Qué se dejó fuera, a propósito.** Importación desde el helpdesk (el modelo está listo: `source` + `external_id` únicos por marca), pantallas de formación (solo el indicador `is_example`), editar una revisión guardada, varias revisiones por respuesta, acceso para la marca, notificaciones e historial del feedback.

**Dónde iría un modelo.** En el triaje, no en el juicio: ordenar las respuestas sin revisar por la probabilidad de un problema *crítico* de la marca (una devolución sin diagnóstico, un aviso de batería omitido) y sugerir etiquetas que el líder confirme. Antes de confiar en él: precisión y exhaustividad en etiquetas críticas frente a revisiones etiquetadas por líderes, por marca, manteniendo la regla de cobertura para que no cree puntos ciegos.

**Preguntas antes de V2.** ¿La marca debería verlo directamente? ¿Cuántas revisiones por semana hacen creíble una tendencia en una cuenta pequeña? ¿Es marca × especialista la unidad correcta de cobertura? ¿Quién mantiene y versiona los criterios de cada marca?

### Arquitectura

**Forma.** Next.js App Router con Server Components. Las lecturas pasan por `src/lib/data/*` (`server-only`) hacia PostgREST con el JWT del usuario; las escrituras son Server Actions. Los agregados son vistas SQL con `security_invoker = true`; una revisión y sus etiquetas se guardan con una sola función `security invoker`, `submit_review`. Por decisión del autor no se añadieron dependencias tras la base: Supabase se consulta con `fetch` y la sesión demo vive en cookies httpOnly que renueva `src/proxy.ts`.

**Modelo de datos.** Ocho tablas en 3FN: `people` (único lugar del rol), `brands`, `brand_memberships`, `replies`, `issue_tags` (globales o por marca, severidad en el criterio), `reviews` (una por respuesta, marca derivada de la respuesta), `review_tags`, `brand_changes`. Los campos de identidad son inmutables en V1; los triggers exigen «revisor líder de la marca» y «etiqueta global o de esa marca» incluso para el service role del seed.

**Dónde vive la autorización.** En Postgres. RLS exige pertenecer a la marca (el rol solo no concede nada); los helpers son `security definer` con `search_path` vacío; `reviewer_id` y `author_id` salen de `auth.uid()`; la respuesta de otra persona es un 404, no un 403. Evidencia: 169 aserciones pgTAP y `npm run authz-check` (29 casos contra PostgREST y la app en marcha).

**Para autenticación real haría falta** inicio de sesión SSO o por enlace mágico en lugar del selector demo, administración de asignaciones y bajas, cookies `Secure` detrás de HTTPS y `@supabase/ssr` en lugar del código de sesión propio.

**Qué se rompe primero.** Cada cifra se calcula en cada petición sobre todas las revisiones (habría que materializar agregados semanales); RLS llama a los helpers de pertenencia por fila; la renovación de sesión la mantenemos nosotros; una revisión por respuesta no aguantará la calibración entre líderes.

### IA

**Cómo se trabajó.** Un prompt independiente, una rama y un PR por problema hacia `main`, integrado por el autor tras su revisión. Codex en P0–P2, Claude Code en P3–P10. Prompts y evidencias en `ai-logs/`.

**Dónde corrigió el autor al agente.** P1 duplicaba el rol en `brand_memberships` (violación de 2FN); el autor pidió normalizar e hizo el commit (`ae05513`). P1/P2 estaban planeados en una rama; el autor los separó. En P3 el agente pidió instalar `supabase-js` y `tsx`; el autor descartó dependencias nuevas. En P6 la captura del autor mostró la cola cortando respuestas tras el saludo. El agente detectó tres defectos propios: un promedio inflado por joins (P7), un marcador del gráfico recortado (P8) y `loading.tsx` convirtiendo 404 en 200 (P9b).

**Un prompt del que estoy orgulloso.** *[Borrador para que el autor lo confirme o sustituya]* El contrato reutilizado en cada problema (`docs/implementation-plan.md`): «Implementar solo P… en su rama desde main revisado. Exponer el plan acotado… Ejecutar las comprobaciones de aceptación, revisar el diff por seguridad y alcance, e informar qué pasó y qué quedó bloqueado… no inventar [revisiones]».

### Estado

**Terminado.** Seed, sesiones reales con cambio de rol, aislamiento por RLS con pruebas ejecutables, cola con cobertura, espacio de revisión con guardado atómico y atajos, feedback del especialista con n, evidencia por marca, estados de carga, error y vacío.

**A medias.** Comparación visual formal con sellervate.com; el clon limpio se midió con cachés calientes (65 s), no en una máquina nueva.

**Sin tocar.** Importación del helpdesk, edición de revisiones, CI, pruebas de navegador de extremo a extremo, despliegue, modo oscuro.

**Orden de retoma.** pgTAP y `authz-check` en CI; editar la propia revisión; importación del helpdesk; autenticación real.

**La objeción más fuerte a mi propio repositorio.** *[Borrador para que el autor lo confirme o sustituya]* La capa de sesión está escrita a mano: cookies y renovación del token que `@supabase/ssr` resolvería. La mantuve porque la regla de no añadir dependencias fue explícita y RLS verifica igualmente cada token, pero es lo primero que sustituiría antes de tener usuarios reales.
