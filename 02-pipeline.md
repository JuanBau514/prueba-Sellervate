# 02 · Pipeline de construcción

> Desglose del problema de `01-problema.md` en problemas pequeños, cómo se resuelve cada uno con el stack, y en qué rama/PR se trabaja. Al final hay una **bitácora** que se actualiza después de cada commit.

---

## 0. Reglas del juego

### Stack (fijado por el brief)

| Capa | Herramienta | Uso |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components para leer, Server Actions para escribir, Route Handlers solo para la prueba de autorización. |
| Datos | **Supabase local** (`supabase start`) | Postgres, migraciones SQL, RLS, Auth. |
| Cliente de datos | `@supabase/ssr` + `@supabase/supabase-js` | Sesión en cookies; toda consulta viaja con el JWT del usuario. |
| Validación | `zod` | Entradas de Server Actions. |
| Estilos | **Tailwind + daisyUI** | Tema propio (tokens), no el tema por defecto. |
| Gráficos | `recharts` (o SVG propio si pesa demasiado) | Tendencia por marca. |
| Scripts | `tsx` | Seed y verificación de autorización. |
| Flujo | **Claude Code** + `gh` CLI | Una rama por pieza de trabajo, PR, revisión escrita, merge. |

### Flujo de trabajo por PR (no negociable)

1. `git checkout -b <rama>` desde `main` actualizado.
2. Claude Code en **modo plan** primero; se aprueba el plan y luego implementa.
3. Claude Code abre el PR con `gh pr create` (título y descripción con: qué problema resuelve, qué decisiones tomó).
4. **Yo leo el diff y escribo la revisión** en el PR: qué está mal, qué dejo pasar y por qué. Si está limpio, una línea.
5. Correcciones en commits de seguimiento en la **misma rama**.
6. Merge con **merge commit**. Nunca squash, nunca rebase.
7. Actualizar la **bitácora** (sección 4) y el cronómetro.

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
├─ docs/                          # 01-problema.md, 02-pipeline.md
├─ ai-logs/                       # prompts y sesiones de Claude Code
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
| P2 | Criterios de calidad relativos a la marca, con severidad | Capas 3 y 4 | PR1 |
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

### P1 + P2 · Modelo de datos — `feat/data-model` (30 min)

**Problema P1:** representar quién trabaja en qué marca y qué respuestas se enviaron, de forma que la importación desde el helpdesk sea posible después.

**Problema P2:** la calidad depende de la marca y los errores tienen pesos distintos.

**Solución con el stack:** una migración SQL en `supabase/migrations/`.

```
people            id (= auth.users.id), full_name, role ('lead'|'specialist')
brands            id, slug unique, name, voice_summary, procedures_md
brand_memberships person_id, brand_id, role ('lead'|'specialist')   pk(person_id, brand_id)
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

**Hecho cuando:** `supabase db reset` aplica la migración sin errores.

**Qué revisar en el PR:** enums, `brand_id` duplicado en `reviews`, falta de índices en `replies(brand_id, sent_at)` y `replies(specialist_id)`, `on delete` que borre revisiones en cascada desde una respuesta.

---

### P3 · Datos creíbles — `feat/seed` (25 min)

**Problema:** es un producto para leer lo que alguien escribió; con lorem ipsum nadie ve que funciona.

**Solución con el stack:** `scripts/seed.ts` ejecutado con `tsx`.
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

**Qué revisar en el PR (el más importante):**
- service role en cualquier archivo bajo `src/`;
- políticas que miran `people.role` global en vez de `brand_memberships`;
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
1. Requisitos (Node, Docker, Supabase CLI).
2. `supabase start` → `supabase db reset` → `npm run seed` → `npm run dev`.
3. Usuarios de demo y cómo cambiar de rol.
4. `npm run authz-check`.
5. Horas reales.
6. Qué testearía primero: la prueba de authz como test automatizado, y por qué no fue la mejor hora cinco.

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
| PR1 | `feat/data-model` | 30 | 1:00 |
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
| | | | Planificación: `01-problema.md` y `02-pipeline.md` | — | — | |
| | | | | | | |

### Plantilla de revisión para cada PR

```
**Lo que está mal:**
-

**Lo que dejo pasar y por qué:**
-

**Veredicto:** cambios pedidos | listo para merge
```
