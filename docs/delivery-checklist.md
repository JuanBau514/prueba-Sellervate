# Sellervate · Evaluación y entrega

Fuente: PDF local «Sellervate-Technical-Exercise (1).pdf», especialmente páginas 5–7 (Assignment, Technical constraints, Design, Scoring, Delivery, Questions we expect y Before you send it). El límite de tiempo y el plazo están en las páginas 1–2. Esta matriz guía el trabajo; no es una autoevaluación de puntos obtenidos.

## Scoring: 100 puntos

| Dimensión del PDF | Peso | Evidencia que debemos producir | Problemas | Estado actual |
| --- | ---: | --- | --- | --- |
| How you worked · Forma de trabajo | 24 | PR pequeños del agente, revisión escrita real del autor antes del merge, correcciones en la misma rama, historial y ramas intactos | Todos | P0–P8 integrados mediante PR #1–#9 con merge commit, ramas conservadas; P9b y P10 en ramas propias con PR pendiente. Comprobar en GitHub el texto de cada revisión humana |
| Problem interpretation and prioritisation · Interpretación y prioridades | 18 | Problema central, elección del loop de revisión, supuestos y recortes defendibles en DECISIONS.md | P0, P10 | `01-problema.md`, pipeline y DECISIONS.md (Product): loop primero, recortes y dónde iría un modelo |
| Architecture and code · Arquitectura y código | 13 | Separación de responsabilidades, código legible, lecturas en servidor y flujo completo | P0, P4–P8 | Base técnica, migraciones P1/P2/P4/P5, capa de datos `server-only` con JWT del usuario y cola de revisión con orden y cobertura en SQL (P5, sin N+1). P6: espacio de revisión con Server Action, `useActionState` y guardado atómico por RPC. P7: `/me` con resumen en vista SQL y sin filtros manuales de permisos. P8: `/brands/[slug]` con agregados en vistas por marca y gráfico SVG propio. Flujo de producto completo; pendiente pulido P9b |
| Data model · Modelo de datos | 12 | Entidades y relaciones coherentes, integridad, migraciones e importación futura posible | P1–P3 | P1 normalizado integrado; P2 conserva 3FN, añade criterios/revisiones e integridad entre marcas. 110 aserciones pasan (con base vacía y sembrada) y lint SQL sin errores. P3: seed con 42 respuestas y 27 revisiones que respeta todas las restricciones, incluidas etiquetas por marca y revisor líder asignado |
| Security and tenant isolation · Seguridad y aislamiento | 10 | Autorización en servidor; pruebas directas entre marcas y entre especialistas, sin depender de ocultar botones | P4, P6–P8 | Integrado (PR #5): políticas RLS por asignación de marca, especialista solo lo propio, `reviewer_id = auth.uid()`, `anon` sin privilegios. 130 aserciones pgTAP y `npm run authz-check` (16 casos por PostgREST y ruta de la app, 404 para lo ajeno) pasan. P5 añade vistas `security_invoker` limitadas a líderes; P6, `submit_review` sin parámetro de revisor; P7, feedback solo por RLS; P8, evidencia limitada a líderes de la marca y autor de intervenciones desde la sesión. `authz-check` sube a 28 casos y pgTAP a 169 aserciones. P9b: guardas en layouts de segmento para conservar 404/307 con streaming; `authz-check` 29 casos. P6–P8 deben conservarlo |
| Interface and visual craft · Interfaz y diseño | 10 | Escala tipográfica, sistema de color explicable, estados de carga/vacío/error y recorrido comprensible | P9a, P5–P9b | P6 adelanta P9a por petición del autor: tema daisyUI con tokens explicables, escala 13–28 px, Public Sans + Literata, respuesta como carta, severidad solo en rojo/ámbar/gris, 404 propia, 390 px verificado en Chrome. P9b: esqueletos por ruta, error de ruta y global (probados con la base detenida), estados vacíos con acción, skip link, foco, contraste AA medido (≥ 4,8:1) y tablas móviles. Sin comparación visual formal con sellervate.com |
| Decisions document · Documento de decisiones | 8 | DECISIONS.md breve y defendible, con todos los apartados del brief | P10, actualizado con decisiones reales | DECISIONS.md en inglés y español (la parte en inglés, 956 palabras, cabe en dos páginas), con el alcance explícito: producto para el loop de Sellervate, no calificador genérico. Dos apartados del autor en borrador |
| Ground covered in six hours · Alcance en seis horas | 5 | Producto coherente de extremo a extremo dentro del límite, con estado y horas reales | Todos | Recorrido completo P0–P9b. Horas declaradas por el autor: 6 h técnicas + 30 min de análisis = 6 h 30 min |
| **Total** | **100** | | | |

Los dos primeros criterios suman 42 puntos: reservar tiempo para decidir, revisar y documentar. El brief considera suficientes cuatro o cinco PR reales; los once del pipeline son nuestra organización inicial, no una exigencia del evaluador. No se evalúan cobertura exhaustiva, despliegue, perfección de casos extremos ni ausencia total de asperezas. No gastar el presupuesto en esas áreas a costa del flujo principal.

## Restricciones técnicas y diseño

- [x] Base Next.js App Router + TypeScript y Tailwind; daisyUI elegido como complemento opcional.
- [x] Supabase local inicia y aplica todas las migraciones; el producto lo usa en todas las rutas.
- [x] Monorepo público en GitHub con historial, ramas y PR conservados (comprobado sin sesión: público, rama predeterminada `main`).
- [x] Datos inventados: mínimo dos marcas, tres especialistas, dos líderes y suficientes revisiones para que el promedio signifique algo. P3 en `feat/seed`: tres marcas, dos líderes, tres especialistas, 42 respuestas, 27 revisiones; verificado con `db reset` + seed y consultas SQL; integrado en main mediante PR #4.
- [x] Forma de entrar como cada rol. Login simulado permitido; autorización en servidor obligatoria. Selector «Viewing as» con sesión real de Supabase Auth y RLS, integrado mediante PR #5 y verificado por el autor; renovación con token caducado comprobada en P5.
- [x] Respuestas creíbles, voces distintas por marca y al menos un caso claramente malo. P3 incluye tres voces y la devolución sin diagnóstico (puntaje 1); visibles completas en la cola y en el espacio de revisión (P6); corregido el recorte de la vista previa señalado por el autor.
- [ ] Diseño intencional: tipografía, color y estados explicables (P6, P9b). Queda sin hacer la comparación formal con sellervate.com.
- [x] Prompts y registros de P0–P10 incluidos.
- [x] Recorrido de producto funcional de extremo a extremo y alcance recortado explícitamente cuando corresponda. Con P8 existen los cuatro tramos (cola → revisión → feedback → evidencia); se marcará tras integrar P8 y documentar los recortes en DECISIONS.md.

## DECISIONS.md · Máximo dos páginas

Redactado en P10 (`DECISIONS.md`) con hechos de los registros. «Un prompt del que estoy orgulloso» y «la objeción más fuerte» están marcados como borrador para que el autor los confirme:

- **Product:** problema real, qué se priorizó y por qué, qué se excluyó, dónde un modelo aportaría valor y qué habría que validar antes de confiar en él, preguntas previas a V2.
- **Architecture:** forma de la solución, modelo de datos, capa de autorización y motivo, qué requeriría la autenticación real, qué fallaría primero al crecer.
- **AI:** forma real de trabajar, aciertos del agente, decisiones que el autor corrigió, qué hizo falta para obtener un buen resultado y un prompt o fragmento de sesión concreto.
- **Status:** terminado, parcial, sin tocar, orden de retoma y **la objeción más importante que harías a tu propio repositorio, con el motivo de haberla dejado**.

Registrar las decisiones durante cada problema permite que P10 sea una síntesis. La versión final en inglés debe caber en dos páginas; el README es bilingüe por petición del autor.

## Before you send it · Comprobación de entrega

Todos los puntos siguientes requieren evidencia final; no basta con que haya instrucciones:

- [ ] Clonar **main** en un directorio limpio y comprobar instalación + Supabase + migraciones + seed + ejecución en menos de diez minutos. **Medido en P10:** 65 s desde el clon hasta `authz-check` en verde, sobre la rama `docs/decisions` (clon local) con caché de npm, imágenes de Docker descargadas y Supabase en marcha. Pendiente: repetirlo sobre `main` tras integrar P9b/P10 y, si es posible, en una máquina sin imágenes.
- [ ] Verificar cuentas de demo y cambio de rol siguiendo solo el README, en español y en inglés. El agente siguió los comandos; falta la lectura del autor.
- [x] El README contiene las horas efectivas declaradas por el autor (6 h 30 min). Confirmar que coinciden con la propuesta.
- [ ] Confirmar fecha de recepción y entregar dentro de una semana calendario. Seis horas es el límite del brief: las horas declaradas lo superan en 30 min si el análisis previo cuenta dentro del límite.
- [x] **main** es la rama predeterminada de GitHub y contiene los PR revisados hasta P9b (`a199b2d`, PR #10).
- [ ] Abrir cada PR y comprobar revisión escrita del autor anterior al merge; preservar commits de corrección y merge, sin squash, rebase ni eliminación de ramas.
- [x] DECISIONS.md existe en inglés y español, cumple los cuatro apartados y la versión en inglés cabe en dos páginas. Dos apartados a confirmar por el autor.
- [x] Repositorio abierto sin iniciar sesión: público (API de GitHub `private: false`).
- [ ] Incluir el enlace del repositorio **en el texto** de la propuesta de Upwork y las horas reales. Enviar el ejercicio con la propuesta; no prometer enviarlo después.
- [x] Starter/boilerplate: ninguno; Next.js configurado a mano (README, Requisitos).
- [x] Qué se probaría primero y por qué no fue la mejor inversión: README, «Qué probaría primero».

La evaluación lee PR y DECISIONS.md antes de ejecutar el producto. Si hay entrevista, dura 45 minutos, sin programación en vivo, y cubre decisiones, dos recortes y un PR en detalle. Conservar evidencia suficiente para explicar esas elecciones.

## Estado remoto y siguiente acción

Actualizado al iniciar P9b: `git fetch origin` confirma `main` en el merge de P8 mediante GitHub PR #9 (`809c6c4`). `chore/states-polish` se creó desde ese merge; `docs/decisions` (P10) parte de esa rama por decisión del autor.

Siguiente acción: P9b integrado mediante PR #10 (`a199b2d`). Revisar e integrar el PR de P10 ([descripción](P10-pr.md)), antes de integrar mediante merge commit. Usar exclusivamente Git por SSH en la terminal y la web de GitHub para revisar e integrar el PR. El procedimiento está en [el acuerdo de ejecución](implementation-plan.md#main-as-the-integration-and-delivery-branch). La comprobación final del contenido de las revisiones humanas sigue pendiente; un merge por sí solo no prueba esa revisión. P10 se prepara en su propia rama.
