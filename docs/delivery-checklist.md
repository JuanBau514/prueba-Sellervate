# Sellervate · Evaluación y entrega

Fuente: PDF local «Sellervate-Technical-Exercise (1).pdf», especialmente páginas 5–7 (Assignment, Technical constraints, Design, Scoring, Delivery, Questions we expect y Before you send it). El límite de tiempo y el plazo están en las páginas 1–2. Esta matriz guía el trabajo; no es una autoevaluación de puntos obtenidos.

## Scoring: 100 puntos

| Dimensión del PDF | Peso | Evidencia que debemos producir | Problemas | Estado actual |
| --- | ---: | --- | --- | --- |
| How you worked · Forma de trabajo | 24 | PR pequeños del agente, revisión escrita real del autor antes del merge, correcciones en la misma rama, historial y ramas intactos | Todos | P0–P5 integrados mediante PR #1–#6; P6 en `feat/review-workspace` desde main, PR pendiente. Verificación final de comentarios de revisión pendiente |
| Problem interpretation and prioritisation · Interpretación y prioridades | 18 | Problema central, elección del loop de revisión, supuestos y recortes defendibles en DECISIONS.md | P0, P10 | Interpretación y pipeline escritos; decisiones finales pendientes |
| Architecture and code · Arquitectura y código | 13 | Separación de responsabilidades, código legible, lecturas en servidor y flujo completo | P0, P4–P8 | Base técnica, migraciones P1/P2/P4/P5, capa de datos `server-only` con JWT del usuario y cola de revisión con orden y cobertura en SQL (P5, sin N+1). P6: espacio de revisión con Server Action, `useActionState` y guardado atómico por RPC. Feedback y evidencia pendientes |
| Data model · Modelo de datos | 12 | Entidades y relaciones coherentes, integridad, migraciones e importación futura posible | P1–P3 | P1 normalizado integrado; P2 conserva 3FN, añade criterios/revisiones e integridad entre marcas. 110 aserciones pasan (con base vacía y sembrada) y lint SQL sin errores. P3: seed con 42 respuestas y 27 revisiones que respeta todas las restricciones, incluidas etiquetas por marca y revisor líder asignado |
| Security and tenant isolation · Seguridad y aislamiento | 10 | Autorización en servidor; pruebas directas entre marcas y entre especialistas, sin depender de ocultar botones | P4, P6–P8 | Integrado (PR #5): políticas RLS por asignación de marca, especialista solo lo propio, `reviewer_id = auth.uid()`, `anon` sin privilegios. 130 aserciones pgTAP y `npm run authz-check` (16 casos por PostgREST y ruta de la app, 404 para lo ajeno) pasan. P5 añade vistas `security_invoker` limitadas a líderes; P6, `submit_review` sin parámetro de revisor. `authz-check` sube a 22 casos y pgTAP a 153 aserciones. P6–P8 deben conservarlo |
| Interface and visual craft · Interfaz y diseño | 10 | Escala tipográfica, sistema de color explicable, estados de carga/vacío/error y recorrido comprensible | P9a, P5–P9b | P6 adelanta P9a por petición del autor: tema daisyUI con tokens explicables, escala 13–28 px, Public Sans + Literata, respuesta como carta, severidad solo en rojo/ámbar/gris, 404 propia, 390 px verificado en Chrome. Pendiente P9b: carga/error y revisión con sellervate.com |
| Decisions document · Documento de decisiones | 8 | DECISIONS.md breve y defendible, con todos los apartados del brief | P10, actualizado con decisiones reales | Pendiente |
| Ground covered in six hours · Alcance en seis horas | 5 | Producto coherente de extremo a extremo dentro del límite, con estado y horas reales | Todos | P0–P6; tiempo efectivo acumulado sin confirmar |
| **Total** | **100** | | | |

Los dos primeros criterios suman 42 puntos: reservar tiempo para decidir, revisar y documentar. El brief considera suficientes cuatro o cinco PR reales; los once del pipeline son nuestra organización inicial, no una exigencia del evaluador. No se evalúan cobertura exhaustiva, despliegue, perfección de casos extremos ni ausencia total de asperezas. No gastar el presupuesto en esas áreas a costa del flujo principal.

## Restricciones técnicas y diseño

- [x] Base Next.js App Router + TypeScript y Tailwind; daisyUI elegido como complemento opcional.
- [x] Supabase local inicia y aplica las migraciones de P1/P2; falta su uso por el producto.
- [ ] Monorepo público en GitHub con historial, ramas y PR conservados. El repositorio público existe; el proceso de PR aún no está completado.
- [x] Datos inventados: mínimo dos marcas, tres especialistas, dos líderes y suficientes revisiones para que el promedio signifique algo. P3 en `feat/seed`: tres marcas, dos líderes, tres especialistas, 42 respuestas, 27 revisiones; verificado con `db reset` + seed y consultas SQL; integrado en main mediante PR #4.
- [x] Forma de entrar como cada rol. Login simulado permitido; autorización en servidor obligatoria. Selector «Viewing as» con sesión real de Supabase Auth y RLS, integrado mediante PR #5 y verificado por el autor; renovación con token caducado comprobada en P5.
- [ ] Respuestas creíbles, voces distintas por marca y al menos un caso claramente malo. P3 incluye tres voces y la devolución sin diagnóstico (puntaje 1); visibles completas en la cola y en el espacio de revisión (P6); corregido el recorte de la vista previa señalado por el autor.
- [ ] Diseño intencional: consultar sellervate.com como referencia, sin copiar; tipografía, color y estados explicables. La referencia visual se revisará en P9a.
- [x] Prompts y registros de P0–P6 incluidos; continuar conservando los siguientes.
- [ ] Recorrido de producto funcional de extremo a extremo y alcance recortado explícitamente cuando corresponda.

## DECISIONS.md · Máximo dos páginas

El archivo final aún no existe. Debe redactarse con hechos observados, sin atribuirle al usuario revisiones que no escribió:

- **Product:** problema real, qué se priorizó y por qué, qué se excluyó, dónde un modelo aportaría valor y qué habría que validar antes de confiar en él, preguntas previas a V2.
- **Architecture:** forma de la solución, modelo de datos, capa de autorización y motivo, qué requeriría la autenticación real, qué fallaría primero al crecer.
- **AI:** forma real de trabajar, aciertos del agente, decisiones que el autor corrigió, qué hizo falta para obtener un buen resultado y un prompt o fragmento de sesión concreto.
- **Status:** terminado, parcial, sin tocar, orden de retoma y **la objeción más importante que harías a tu propio repositorio, con el motivo de haberla dejado**.

Registrar las decisiones durante cada problema permite que P10 sea una síntesis. La versión final en inglés debe caber en dos páginas; el README es bilingüe por petición del autor.

## Before you send it · Comprobación de entrega

Todos los puntos siguientes requieren evidencia final; no basta con que haya instrucciones:

- [ ] Clonar **main** en un directorio limpio y comprobar instalación + Supabase + migraciones + seed + ejecución en menos de diez minutos. Registrar tiempo y prerrequisitos, sin prometerlo antes de medirlo.
- [ ] Verificar cuentas de demo y cambio de rol siguiendo solo el README, en español y en inglés.
- [ ] Confirmar que el README contiene las **horas efectivas reales** y que coinciden con la propuesta. El tiempo anterior a esta sesión aún es desconocido.
- [ ] Confirmar fecha de recepción y entregar dentro de una semana calendario; detener el trabajo al llegar a seis horas efectivas.
- [ ] Confirmar que **main** es la rama predeterminada de GitHub y contiene el resultado de los PR revisados.
- [ ] Abrir cada PR y comprobar revisión escrita del autor anterior al merge; preservar commits de corrección y merge, sin squash, rebase ni eliminación de ramas.
- [ ] Comprobar que DECISIONS.md existe, cumple los cuatro apartados y no supera dos páginas.
- [ ] Abrir el repositorio sin iniciar sesión para verificar que es público y que el código de entrega es accesible.
- [ ] Incluir el enlace del repositorio **en el texto** de la propuesta de Upwork y las horas reales. Enviar el ejercicio con la propuesta; no prometer enviarlo después.
- [ ] Identificar starter/boilerplate si lo hubiera. En P0 la configuración fue manual, sin starter kit.
- [ ] Indicar qué se probaría primero y por qué otras pruebas no fueron la mejor inversión del tiempo disponible; actualizar la explicación según lo realmente probado.

La evaluación lee PR y DECISIONS.md antes de ejecutar el producto. Si hay entrevista, dura 45 minutos, sin programación en vivo, y cubre decisiones, dos recortes y un PR en detalle. Conservar evidencia suficiente para explicar esas elecciones.

## Estado remoto y siguiente acción

Actualizado al iniciar P6: `git fetch origin` confirma `main` en el merge de P5 mediante GitHub PR #6 (`26f13f6`). `feat/review-workspace` se creó desde ese merge y contiene P6 y las correcciones de UI/UX pedidas, verificados localmente y en Chrome.

Siguiente acción: revisar el PR de P6 hacia `main`, con [descripción preparada](P6-pr.md), antes de integrar mediante merge commit. Usar exclusivamente Git por SSH en la terminal y la web de GitHub para revisar e integrar el PR. El procedimiento está en [el acuerdo de ejecución](implementation-plan.md#main-as-the-integration-and-delivery-branch). La comprobación final del contenido de las revisiones humanas sigue pendiente; un merge por sí solo no prueba esa revisión. P7 no se inicia en esta entrega.
