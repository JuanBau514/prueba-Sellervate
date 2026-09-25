# 02 · Pipeline de construcción

> Desglose del problema de `01-problema.md` en problemas pequeños, cómo se resuelve cada uno con el stack, y en qué rama/PR se trabaja. Al final hay una **bitácora** que se actualiza después de cada commit.

---

## 0. Reglas del juego

### Stack (restricciones del brief y elecciones del proyecto)

El brief fija Next.js App Router, TypeScript, Supabase y Tailwind. daisyUI, Supabase local y las demás herramientas de la tabla son elecciones de implementación.

| Capa | Herramienta | Uso |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components para leer, Server Actions para escribir, Route Handlers solo para la prueba de autorización. |
| Datos | **Supabase local** (`supabase start`) | Postgres, migraciones SQL, RLS, Auth. |
| Cliente de datos | `@supabase/ssr` + `@supabase/supabase-js` | Sesión en cookies; toda consulta viaja con el JWT del usuario. |
| Validación | `zod` | Entradas de Server Actions. |
| Estilos | **Tailwind + daisyUI** | Tema propio (tokens), no el tema por defecto. |
| Gráficos | `recharts` (o SVG propio si pesa demasiado) | Tendencia por marca. |
| Scripts | `tsx` | Seed y verificación de autorización. |
| Flujo | **Codex** + Git por SSH + web de GitHub | Una rama por pieza de trabajo desde `main`, PR dirigido a `main`, revisión escrita y merge commit. Por instrucción del usuario no se usa `gh`. |

### Flujo de trabajo por PR (no negociable)

**`main` es la rama principal, de integración y de entrega.** Todos los problemas P0–P10 se incorporan allí mediante PR. Debe ser también la rama predeterminada en GitHub. Conservar las ramas de trabajo para que el evaluador pueda revisar el proceso.

1. `git checkout -b <rama>` desde `main` actualizado.
2. El agente presenta el plan acotado al problema; implementa dentro del alcance autorizado por el usuario y registra el prompt independiente.
3. El agente publica la rama con Git por SSH y prepara título, descripción y enlace de comparación hacia `main`. El autor abre el PR en la web de GitHub. Esta adaptación explícita evita usar `gh`, según la instrucción del usuario; se conserva la revisión escrita y el historial exigidos por el brief.
4. **Yo leo el diff y escribo la revisión** en el PR: qué está mal, qué dejo pasar y por qué. Si está limpio, una línea.
5. Correcciones en commits de seguimiento en la **misma rama**.
6. Merge **hacia `main`** con **merge commit**. Nunca squash, nunca rebase. Conservar las ramas y volver a `main` actualizado antes del siguiente problema.
7. Actualizar la **bitácora** (sección 4) y el cronómetro.

README en **español e inglés**, con contenido equivalente. Consultar la [matriz de Scoring, Delivery y Before you send it](docs/delivery-checklist.md) al cerrar cada problema. La configuración remota inicial de `main` se detalla en [el acuerdo de ejecución](docs/implementation-plan.md#main-as-the-integration-and-delivery-branch).

### Estructura del repositorio

```
/
├─ src/
│  ├─ app/
│  │  ├─ (app)/review/            # cola y espacio de revisión (líder)
│  │  ├─ (app)/me/                # mis revisiones (especialista)
│  │  ├─ (app)/brands/[slug]/     # vista de marca (líder)
│  │  ├─ api/replies/[id]/        # route handler para prueba de authz
│  │  └─ actions/                 # server actions
│  ├─ lib/
│  │  ├─ supabase/                # server.ts, client.ts, middleware
│  │  └─ data/                    # capa de acceso a datos (import 'server-only')
│  └─ components/
├─ supabase/migrations/
├─ scripts/                       # seed.ts, authz-check.ts
├─ docs/                          # ejecución, evaluación, entrega y tiempo
├─ ai-logs/                       # prompts y sesiones del agente
├─ 01-problema.md
├─ 02-pipeline.md
├─ CLAUDE.md
├─ DECISIONS.md
└─ README.md
```

### Reglas para el agente (van a `CLAUDE.md`)

- La **service role key nunca** se usa en código que corre en una request. Solo en `scripts/seed.ts`.
- Toda lectura pasa por `src/lib/data/*` con `import 'server-only'`.
- Nada de filtros de permisos en el cliente; los permisos viven en RLS.
- Nada de enums de Postgres: `text` + `check`, o tablas de catálogo.
- Las vistas SQL se crean con `security_invoker = true`.
- Las funciones `security definer` llevan `set search_path = ''`.
- El `reviewer_id` sale de la sesión, nunca del formulario.
- Fechas del seed **relativas a hoy**, nunca fijas.

---

## 1. Mapa de problemas pequeños

| # | Problema pequeño | Viene de | PR |
|---|---|---|---|
| P0 | Base del proyecto y reglas de trabajo | Flujo exigido por el brief | PR0 |
| P1 | Representar marcas, personas, asignaciones y respuestas | Todo | PR1 |
| P2 | Criterios de calidad relativos a la marca, con severidad | Capas 3 y 4 | PR1b (separado por instrucción del usuario) |
| P3 | Datos creíbles para ver el producto funcionar | Brief: seed inventado | PR2 |
| P4 | Quién ve qué, aplicado en el servidor | Aislamiento, privacidad | PR3 |
| P5 | Elegir qué revisar sin puntos ciegos | Capa 2 (muestreo) | PR4 |
| P6 | Registrar el juicio rápido y con contexto | Capas 1, 3 y 5 | PR5 |
| P7 | Devolver el juicio al especialista | "ve sus puntajes y mis comentarios" | PR6 |
| P8 | Mostrarle a la marca la evidencia | "mostrar el número" | PR7 |
| P9 | Oficio visual y estados diseñados | Criterio de diseño del brief | PR0b + PR8 |
| P10 | Documentar decisiones y cómo correrlo | DECISIONS.md, README | PR9 |

---

## 2. Cada problema, paso a paso

### P0 · Base del proyecto — `chore/scaffold` (15 min)

**Problema:** sin una base limpia y reglas claras, el agente toma decisiones por defecto que luego hay que deshacer.

**Solución con el stack:**
- `create-next-app` con TypeScript, Tailwind, App Router y `src/`.
- daisyUI como plugin de Tailwind.
- `supabase init`; `.env.example` con URL y anon key locales.
- `CLAUDE.md` con las reglas de la sección 0.
- README esqueleto; carpetas `docs/` y `ai-logs/`; commit de estos dos documentos.

**Hecho cuando:** `npm run dev` levanta una página vacía y `supabase start` corre.

**Qué revisar en el PR:** que no traiga plantilla de ejemplo, que `.env.local` esté en `.gitignore`.

---

### P9a · Fundaciones visuales — `feat/design-tokens` (15 min)

**Problema:** si el diseño llega al final, cada pantalla inventa sus propios colores y tamaños.

**Solución con el stack:** tema propio de daisyUI en `globals.css` y fuentes con `next/font`.

Propuesta inicial (a validar en el PR):

| Token | Valor | Rol |
|---|---|---|
| `paper` | `#F4F6F5` | Fondo, neutro frío con un matiz verde |
| `ink` | `#1D252C` | Texto principal |
| `accent` | `#2E5E55` | Acciones y selección (tinta de revisor) |
| `critical` | `#B42318` | Severidad crítica |
| `major` | `#B54708` | Severidad mayor |
| `minor` | `#5B6776` | Severidad menor |

- **Tipografía:** una sans para la interfaz (p. ej. Public Sans) y una serif de lectura para el texto de las respuestas (p. ej. Literata), porque el producto es leer lo que alguien escribió.
- **Escala:** 13 / 15 / 17 / 21 / 28 px.
- **Principio:** el color significa algo o no aparece. Rojo, ámbar y gris están reservados para severidad.
- **Elemento memorable (uno solo):** la respuesta presentada como una carta legible, con los hallazgos de la revisión como marcas de margen.

**Qué revisar en el PR:** que el agente no caiga en el kit de tarjetas redondeadas idénticas con sombra gris, ni en etiquetas en mayúsculas sobre cada título.

---

### P1 + P2 · Modelo de datos — ramas separadas (presupuesto conjunto: 30 min)

**Problema P1:** representar quién trabaja en qué marca y qué respuestas se enviaron, de forma que la importación desde el helpdesk sea posible después.

**Problema P2:** la calidad depende de la marca y los errores tienen pesos distintos.

**Solución con el stack:** migraciones SQL en `supabase/migrations/`. Tras la revisión de normalización, el usuario solicitó ramas separadas: P1 y su corrección en `feat/data-model`; P2 en `feat/quality-criteria` desde `main` con P1 integrado. P1 crea las cuatro tablas base; P2 agrega criterios, revisiones, asociaciones e intervenciones. Detalles de normalización e integridad en [docs/data-model.md](docs/data-model.md).

```
people            id (= auth.users.id), full_name, role ('lead'|'specialist')
brands            id, slug unique, name, voice_summary, procedures_md
brand_memberships person_id, brand_id, created_at   pk(person_id, brand_id)
replies           id, brand_id, specialist_id, customer_message, body,
                  sent_at, first_response_minutes,
                  source default 'seed', external_id
                  unique(brand_id, source, external_id)
issue_tags        id, code, label, severity ('critical'|'major'|'minor'),
                  brand_id null = global
                  unique nulls not distinct (brand_id, code)
reviews           id, reply_id unique, reviewer_id, score 1..4, comment,
                  is_example default false, created_at, updated_at
review_tags       review_id (on delete cascade), tag_id   pk(review_id, tag_id)
brand_changes     id, brand_id, author_id, happened_on, note
```

**Decisiones que se defienden:**
- `brand_id` **no** se copia en `reviews`: se deriva de la respuesta, una sola fuente de verdad.
- `reply_id unique` en `reviews`: V1 = una revisión por respuesta. Quitar el `unique` después es barato.
- `text` + `check` en lugar de enums.
- Etiquetas globales y por marca en la misma tabla.
- `is_example` deja abierto el coaching sin construirlo.

**Hecho cuando:** las migraciones se aplican sin errores y las pruebas de integridad pasan. En una base existente usar `supabase migration up --local`, que no borra datos; reservar `supabase db reset` para bases desechables. P2 se verificó con migración incremental, 110 aserciones y lint SQL sin errores; no se reinició la base local.

**Qué revisar en el PR:** enums, `brand_id` duplicado en `reviews`, falta de índices en `replies(brand_id, sent_at)` y `replies(specialist_id)`, `on delete` que borre revisiones en cascada desde una respuesta.

---

### P3 · Datos creíbles — `feat/seed` (25 min)

**Problema:** es un producto para leer lo que alguien escribió; con lorem ipsum nadie ve que funciona.

**Solución con el stack:** `scripts/seed.ts` ejecutado con `tsx`. *Implementado:* por decisión del usuario, sin dependencias nuevas: `node scripts/seed.ts` (TypeScript nativo de Node ≥ 22.18) y `fetch` directo a Auth admin y REST en lugar de `supabase-js`.
- Crea usuarios con `supabase.auth.admin.createUser` (service role, **solo en este script**) y una contraseña de demo común.
- Inserta el dominio con los ids devueltos.

**Contenido mínimo:**
- **Marcas (3):** scooters (técnica: diagnosticar antes de devolver), empaques (rápida, exacta, tres líneas) y una tercera para que el aislamiento entre líderes se note.
- **Personas:** Marta (lidera 2 marcas), Nuria (lidera 1), Dani, y dos especialistas más, cada uno en 2 marcas.
- **Respuestas:** unas 40 en 4 semanas, con fechas **relativas a hoy**, e incluyendo respuestas de ayer sin revisar para que la cola nunca esté vacía.
- **Revisiones:** unas 25, con tendencia visible.
- **Casos obligatorios:**
  - una respuesta claramente mala (ofrece devolución en la marca de scooters sin diagnosticar);
  - un especialista con la etiqueta "no revisó el historial del pedido" repetida durante 3 semanas (el caso real de las notas);
  - un especialista sin revisiones en los últimos 10 días (para la cobertura).

**Hecho cuando:** `supabase db reset && npm run seed` deja la base lista, y dos respuestas de marcas distintas se leen claramente diferentes.

**Qué revisar en el PR:** fechas fijas, textos genéricos que no suenan a cada marca, service role importada fuera de `scripts/`.

---

### P4 · Autorización en el servidor — `feat/authz` (35 min)

**Problema:** un especialista no puede ver datos de otra marca ni de otros especialistas, aunque llame a la API directamente. Esconder un botón no cuenta.

**Solución con el stack:**
1. **Login simulado, sesión real.** Un selector de usuario en la esquina ejecuta una Server Action que hace `signInWithPassword` con el usuario elegido y la contraseña de demo (leída del entorno del servidor). `@supabase/ssr` guarda la sesión en cookies. Resultado: `auth.uid()` es real en Postgres.
2. **RLS como autoridad.** Funciones auxiliares `is_brand_lead(brand_id)` e `is_brand_member(brand_id)` con `security definer` y `set search_path = ''` (evitan la recursión de políticas).

   | Tabla | Leer | Escribir |
   |---|---|---|
   | `brands` | miembro de la marca | — |
   | `replies` | propia (especialista) o líder de la marca | — |
   | `reviews` / `review_tags` | de una respuesta propia, o líder de la marca | líder de la marca, `reviewer_id = auth.uid()` |
   | `issue_tags` | globales o de marcas donde es miembro | — |
   | `brand_changes` | líder de la marca | líder de la marca |
   | `people` | todo el personal autenticado | — |

3. **Capa de datos solo en servidor.** `src/lib/data/*` usa el cliente con la sesión del usuario; nunca la service role.
4. **Prueba ejecutable.** `scripts/authz-check.ts` inicia sesión como Dani y:
   - consulta PostgREST directamente por respuestas de una marca ajena → 0 filas;
   - intenta insertar una revisión → rechazado;
   - llama `GET /api/replies/<id-ajeno>` → **404** (no 403, para no revelar que existe).

**Hecho cuando:** `npm run authz-check` pasa, y cambiar de usuario cambia lo que se ve.

*Implementado:* sin dependencias nuevas, `@supabase/ssr` se sustituye por `fetch` a Auth/REST, cookies httpOnly y renovación del token en `src/proxy.ts`. `people` se limita a quienes comparten una marca (más estricto que «todo el personal»).

**Qué revisar en el PR (el más importante):**
- service role en cualquier archivo bajo `src/`;
- políticas que miran solo `people.role` sin exigir la asignación correspondiente en `brand_memberships`; el rol ya no se duplica en las membresías;
- funciones `security definer` sin `search_path`;
- políticas de insert sin `with check`.

---

### P5 · Elegir qué revisar — `feat/review-queue` (25 min)

**Problema:** sin criterio de muestreo, un especialista puede pasar un mes sin ser revisado.

**Solución con el stack:** Server Component en `/review`.
- Lista respuestas **sin revisar** de los últimos días, de las marcas que lidera el usuario (RLS ya lo filtra), agrupadas por marca.
- **Orden:** primero los especialistas con más días desde su última revisión; luego por fecha de envío.
- Una línea de **cobertura** por especialista: "Dani · última revisión hace 11 días".
- Heurística simple y explicable, reemplazable en V2 por el modelo de triage.

**Hecho cuando:** Marta ve su cola ordenada y Nuria ve una cola distinta.

*Implementado:* ventana de 14 días; la cobertura es por marca **y** especialista, calculada en SQL con vistas `security_invoker` que solo devuelven marcas lideradas.

**Qué revisar en el PR:** ordenamiento hecho en el cliente, consultas N+1 por especialista, estado vacío ausente.

---

### P6 · Registrar el juicio — `feat/review-workspace` (45 min)

**Problema:** revisar tiene que ser más rápido que hojear el inbox, o Marta no adopta la herramienta. Y tiene que revisar contra el procedimiento de la marca, no de memoria.

**Solución con el stack:** ruta `/review/[replyId]`.

```
┌──────────────────────────────┬──────────────────────┐
│ Mensaje del cliente          │ Procedimiento de     │
│ Respuesta enviada (serif)    │ la marca             │
│ Tiempo de respuesta: 42 min  │                      │
├──────────────────────────────┴──────────────────────┤
│ Puntaje 1 2 3 4 · Etiquetas (por severidad)         │
│ Comentario para el especialista · [ ] Ejemplo       │
│ [Guardar y siguiente]                               │
└─────────────────────────────────────────────────────┘
```

- **Etiquetas:** globales + las de esa marca, agrupadas por severidad.
- **Teclado:** 1–4 para el puntaje, `⌘/Ctrl + Enter` para guardar.
- **Server Action** con validación `zod`; `reviewer_id` desde la sesión; inserta la revisión y sus etiquetas; redirige a la siguiente respuesta de la cola.
- Errores mostrados con `useActionState`, en la voz de la interfaz.

**Hecho cuando:** Marta revisa 5 respuestas seguidas sin tocar el mouse más de lo necesario.

*Implementado:* función `submit_review` `security invoker`; validación manual en lugar de `zod` (sin dependencias nuevas); atajo extra `C` para el comentario y «Skip for now». El formulario va bajo la carta y el procedimiento queda fijo al lado, para no perderlo de vista al puntuar.

**Qué revisar en el PR:** `reviewer_id` que venga del formulario, inserción de revisión y etiquetas sin transacción (usar una función RPC si hace falta), aceptar etiquetas de otra marca.

---

### P7 · Devolver el juicio — `feat/specialist-view` (25 min)

**Problema:** el feedback hoy se pierde en Slack.

**Solución con el stack:** ruta `/me`.
- Lista de revisiones propias: marca, puntaje, etiquetas, comentario, quién revisó y cuándo.
- Resumen por marca: promedio **y** n.
- Filtro por marca.
- RLS garantiza que solo vea lo suyo; la página no filtra por `specialist_id` a mano.

**Hecho cuando:** Dani ve solo lo suyo y la prueba de authz sigue pasando.

*Implementado:* además del promedio y n, revisiones con problema crítico y aviso cuando n < 5; la respuesta original se despliega junto al comentario.

**Qué revisar en el PR:** filtros de permisos en la consulta que tapen una política mal escrita, estado vacío ("Todavía no tienes revisiones").

---

### P8 · Evidencia para la marca — `feat/brand-overview` (40 min)

**Problema:** "cada trimestre digo que mejoramos; prefiero mostrar el número".

**Solución con el stack:** ruta `/brands/[slug]`, solo líderes de esa marca.
- **Tendencia semanal:** puntaje promedio con **n** visible por semana y marcadores de `brand_changes`.
- **Errores críticos** de las últimas 4 semanas, con enlace a la respuesta.
- **Patrones recurrentes:** tabla etiqueta × especialista, resaltando repeticiones (aquí aparece el caso del historial del pedido).
- **Cobertura:** días desde la última revisión por especialista.
- **Registro de cambios:** formulario corto para "qué cambiamos".
- Agregados en una **vista SQL con `security_invoker = true`** para que el RLS aplique.

**Hecho cuando:** Marta abre la marca de scooters y puede contar la historia en 30 segundos.

*Implementado:* semanas por fecha de envío (no de revisión), para que una intervención se lea contra el trabajo que buscaba cambiar; patrones en ventana de 6 semanas contando semanas distintas; gráfico SVG en servidor sin librería (Recharts no se añadió); índice `/brands`.

**Qué revisar en el PR:** vistas sin `security_invoker` (se saltan el RLS), promedios sin tamaño de muestra, mezcla de marcas en un agregado.

---

### P9b · Estados y pulido — `chore/states-polish` (20 min)

**Problema:** un estado vacío o de error por defecto se nota y el brief lo evalúa.

**Solución con el stack:**
- `loading.tsx` con esqueletos por ruta;
- `error.tsx` que explica qué pasó y qué hacer;
- componentes de estado vacío que invitan a actuar;
- foco visible, contraste y respuesta en pantallas pequeñas.

**Qué revisar en el PR:** textos que se disculpan o son vagos, animaciones decorativas.

---

### P10 · Decisiones y README — `docs/decisions` (45 min)

**Problema:** el documento pesa tanto como una feature y el README debe llevar a un extraño de clonar a correr en menos de diez minutos.

**README:**
En español e inglés, manteniendo ambas versiones equivalentes y usando `main` como referencia de entrega.

1. Requisitos (Node, Docker, Supabase CLI).
2. `supabase start` → `supabase db reset` → `npm run seed` → `npm run dev`.
3. Usuarios de demo y cómo cambiar de rol.
4. `npm run authz-check`.
5. Horas reales.
6. Qué testearía primero: la prueba de authz como test automatizado, y por qué no fue la mejor hora cinco.
7. Comprobar el recorrido completo desde un clon limpio en menos de diez minutos, con seed y roles. Documentar lo realmente medido.
8. Estado real y enlace a la lista de entrega: PR revisados, historial intacto, DECISIONS.md de máximo dos páginas, repositorio público y enlace con horas reales dentro de la propuesta de Upwork.

**DECISIONS.md (máx. 2 páginas, en inglés):**
- **Product:** problema real, qué se construyó primero, qué se dejó fuera, dónde iría un modelo, preguntas para V2.
- **Architecture:** forma, modelo de datos, dónde vive la autorización y qué haría falta para autenticación real, qué se rompe primero al crecer.
- **AI:** cómo se trabajó, dónde se corrigió al agente, un prompt del que estoy orgulloso.
- **Status:** terminado, a medias, sin tocar, orden de retoma, y lo que marcaría más fuerte en mi propio repo.

---

## 3. Presupuesto de tiempo y orden de recorte

| PR | Rama | Min | Acumulado |
|---|---|---|---|
| PR0 | `chore/scaffold` | 15 | 0:15 |
| PR0b | `feat/design-tokens` | 15 | 0:30 |
| PR1 + PR1b | `feat/data-model` + `feat/quality-criteria` | 30 | 1:00 |
| PR2 | `feat/seed` | 25 | 1:25 |
| PR3 | `feat/authz` | 35 | 2:00 |
| PR4 | `feat/review-queue` | 25 | 2:25 |
| PR5 | `feat/review-workspace` | 45 | 3:10 |
| PR6 | `feat/specialist-view` | 25 | 3:35 |
| PR7 | `feat/brand-overview` | 40 | 4:15 |
| PR8 | `chore/states-polish` | 20 | 4:35 |
| PR9 | `docs/decisions` | 45 | 5:20 |
| — | Buffer | 40 | 6:00 |

> ⚠️ El tiempo de planificación también es trabajo sobre la prueba. Se cronometra y se suma al total del README.

**Si voy atrasado, se recorta en este orden:**
1. Registro de cambios de marca (P8).
2. Patrones recurrentes → reemplazar por lista simple de etiquetas más frecuentes.
3. Pulido visual (P9b) → solo estados vacíos.
4. Atajos de teclado (P6).

**Nunca se recorta:** autorización (P4), el loop de revisión (P5–P6), la vista del especialista (P7), DECISIONS.md.

---

## 4. Bitácora

> Se actualiza después de **cada commit**. Una fila por commit; la columna "Revisión" solo se llena en el commit que responde a comentarios del PR.

| Fecha | Rama / PR | Commit | Qué se hizo | Problema | Revisión / decisión | Tiempo acumulado |
|---|---|---|---|---|---|---|
| 2026-09-24 | `main` (base documental) | `4fe1b3a` | Versionar interpretación y pipeline originales; ignorar secretos, dependencias y PDF fuente | — | Tiempo de preparación previo pendiente de confirmar | Pendiente |
| 2026-09-24 | `chore/scaffold` / GitHub PR #1 | `bcf7d90` | Base ejecutable, configuración local, reglas y prompt independiente; ver `ai-logs/P0.md` | P0 | Integrado posteriormente mediante merge commit | Ver `docs/time-log.md` |
| 2026-09-24 | `chore/scaffold` / GitHub PR #1 | `c089886` | README bilingüe y criterios de entrega, commit realizado por el autor | P0 | Corrección solicitada por el usuario | Ver `docs/time-log.md` |
| 2026-09-24 | `main` / GitHub PR #1 | `1beec2a` | Integración de P0 con merge commit | P0 | Historial conservado; lectura del comentario de revisión pendiente | Ver `docs/time-log.md` |
| 2026-09-24 | `feat/data-model` / PR1 del pipeline | `67ab919` | Migración inicial de cuatro tablas, RLS cerrado, 38 pruebas de integridad/acceso y documentación bilingüe | P1 | El plan inicial de compartir rama con P2 fue sustituido después por ramas separadas | Ver `docs/time-log.md` |
| 2026-09-25 | `feat/data-model` / GitHub PR #2 | `ae05513` | Corrección de normalización realizada por el autor; rol solo en people, migración incremental y 47 pruebas | P1 | Responde a la revisión de normalización; ensayo conserva datos | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #2 | `2b7aba8` | Integración de P1 y su corrección mediante merge commit | P1 | Confirmado por Git; contenido de revisión humana pendiente de verificación final | Ver `docs/time-log.md` |

| 2026-09-25 | `feat/quality-criteria` / GitHub PR #3 | `bcc91ef` | Criterios por marca con severidad, revisiones, etiquetas e intervenciones; 110 aserciones | P2 | Ver `ai-logs/P2.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #3 | `9295e76` | Integración de P2 mediante merge commit | P2 | Confirmado por Git; contenido de revisión humana pendiente de verificación final | Ver `docs/time-log.md` |

**Entrega P3:** `feat/seed` parte de `9295e76`; `scripts/seed.ts` sin dependencias nuevas (Node nativo + `fetch`), 5 cuentas, 3 marcas, 42 respuestas y 27 revisiones con fechas relativas; pruebas de P1/P2 acotadas a sus fixtures para pasar con datos sembrados. Registro en `ai-logs/P3.md`; descripción de PR en `docs/P3-pr.md`. Publicado como `c4aed98`.

| 2026-09-25 | `feat/seed` / GitHub PR #4 | `c4aed98` | Seed creíble sin dependencias nuevas; pruebas acotadas a fixtures | P3 | Ver `ai-logs/P3.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #4 | `f2766c1` | Integración de P3 mediante merge commit | P3 | Confirmado por Git; contenido de revisión humana pendiente de verificación final | Ver `docs/time-log.md` |

**Entrega P4:** `feat/authz` parte de `f2766c1`; migración de políticas RLS con helpers `security definer`, sesión real con cookies httpOnly y renovación en `src/proxy.ts` (sin `@supabase/ssr`), capa `src/lib/data/*`, selector de usuario, `GET /api/replies/[id]`, `authorization.test.sql` y `npm run authz-check`. Registro en `ai-logs/P4.md`; descripción de PR en `docs/P4-pr.md`. Publicado como `020de45`.

| 2026-09-25 | `feat/authz` / GitHub PR #5 | `020de45` | RLS por asignación de marca, sesión real sin dependencias, capa de datos y `authz-check` | P4 | Ver `ai-logs/P4.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #5 | `5e93c3b` | Integración de P4 mediante merge commit | P4 | Autor verificó el funcionamiento; contenido de revisión humana pendiente de verificación final | Ver `docs/time-log.md` |

**Entrega P5:** `feat/review-queue` parte de `5e93c3b`; vistas `review_queue` y `review_coverage` (`security_invoker`, solo líderes), página `/review` agrupada por marca con cobertura por especialista y estados vacíos, portada que lleva al líder a su cola, `review_queue.test.sql` y tres casos nuevos en `authz-check`. También cierra pendientes de P3/P4 por instrucción del usuario. Registro en `ai-logs/P5.md`; descripción de PR en `docs/P5-pr.md`. Publicado como `c00ca3f`.

| 2026-09-25 | `feat/review-queue` / GitHub PR #6 | `c00ca3f` | Cola por marca con cobertura por especialista; pendientes P3/P4 | P5 | Ver `ai-logs/P5.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #6 | `26f13f6` | Integración de P5 mediante merge commit | P5 | Autor revisó el funcionamiento; señaló el recorte de contenido en la cola | Ver `docs/time-log.md` |

**Entrega P6:** `feat/review-workspace` parte de `26f13f6`; `submit_review` atómica (`security invoker`, sin parámetro de revisor), `/review/[replyId]` con carta, procedimiento fijo, etiquetas por severidad, atajos y `useActionState`; corrección de la vista previa de la cola; tema daisyUI y fuentes (adelanta P9a). Registro en `ai-logs/P6.md`; descripción de PR en `docs/P6-pr.md`. Publicado como `9a49535`.

| 2026-09-25 | `feat/review-workspace` / GitHub PR #7 | `9a49535` | Espacio de revisión con guardado atómico, atajos y base visual; corrección de la cola | P6 (+ P9a parcial) | Ver `ai-logs/P6.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #7 | `1dea779` | Integración de P6 mediante merge commit | P6 | Autor verificó manualmente la plataforma | Ver `docs/time-log.md` |

**Entrega P7:** `feat/specialist-view` parte de `1dea779`; vista `review_summary` (`security_invoker`, n y promedio sin inflar por etiquetas), `/me` con resumen por marca, filtro, feedback con severidad y respuesta original, estado vacío; portada y navegación por rol; `review_summary.test.sql` y dos casos nuevos en `authz-check`. Registro en `ai-logs/P7.md`; descripción de PR en `docs/P7-pr.md`. Publicado como `cd2851d`.

| 2026-09-25 | `feat/specialist-view` / GitHub PR #8 | `cd2851d` | `/me` con resumen por marca (promedio y n), filtro y feedback | P7 | Ver `ai-logs/P7.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #8 | `64134e3` | Integración de P7 mediante merge commit | P7 | Confirmado por Git | Ver `docs/time-log.md` |

**Entrega P8:** `feat/brand-overview` parte de `64134e3`; vistas `brand_weekly_scores`, `brand_critical_reviews` y `brand_issue_patterns` (`security_invoker`, solo líderes, por `brand_id`), autor de `brand_changes` desde la sesión, `/brands` y `/brands/[slug]` con tendencia SVG con n y marcadores, críticos, patrones, cobertura y registro de cambios; `brand_overview.test.sql` y cuatro casos nuevos en `authz-check`. Registro en `ai-logs/P8.md`; descripción de PR en `docs/P8-pr.md`. Publicado como `e225e64`.

| 2026-09-25 | `feat/brand-overview` / GitHub PR #9 | `e225e64` | Evidencia por marca: tendencia con n, críticos, patrones, cobertura y cambios | P8 | Ver `ai-logs/P8.md` | Ver `docs/time-log.md` |
| 2026-09-25 | `main` / GitHub PR #9 | `809c6c4` | Integración de P8 mediante merge commit | P8 | Autor verificó el funcionamiento | Ver `docs/time-log.md` |

**Entrega P9b:** `chore/states-polish` parte de `809c6c4`; `loading.tsx` por ruta, `error.tsx` y `global-error.tsx`, estados vacíos con acción, skip link y tablas móviles; guardas en layouts de segmento y páginas de lista en grupos de rutas para conservar 404/307 con streaming. Registro en `ai-logs/P9b.md`; descripción de PR en `docs/P9b-pr.md`.

### Plantilla de revisión para cada PR

```
**Lo que está mal:**
-

**Lo que dejo pasar y por qué:**
-

**Veredicto:** cambios pedidos | listo para merge
```
