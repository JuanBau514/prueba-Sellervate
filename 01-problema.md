# 01 · El problema

> Documento de trabajo. Resume el contexto de Sellervate, el problema real detrás de las notas de la reunión y la decisión de producto que guía todo el pipeline (`02-pipeline.md`).

---

## 1. El negocio

Sellervate es un servicio de atención al cliente **tercerizado y en marca blanca** para marcas de ecommerce. La marca entrega su bandeja de soporte; un especialista de Sellervate responde **como si fuera la marca**, con su voz, sus procedimientos y desde su helpdesk. El cliente final nunca sabe que Sellervate existe.

Tres consecuencias que definen el proyecto:

1. **La calidad de las respuestas es el producto.** Es lo único del servicio que la marca ve.
2. **El riesgo de negocio es perder cuentas.** Cada marca es un contrato relativamente pequeño; un error grave sobre su producto basta para que se vaya.
3. **La confidencialidad es parte del modelo.** Cada marca es un cliente distinto. Mezclar sus datos rompe la promesa del servicio. Por eso el aislamiento entre marcas es un requisito, no un detalle.

---

## 2. Las personas

| Persona | Qué hace | Qué necesita de la herramienta |
|---|---|---|
| **Líder de equipo** (Marta, Nuria) | Supervisa varias marcas y a sus especialistas. Revisa ~5 respuestas al día de cientos. Responde a la marca cada trimestre. Entrena a los nuevos. | Revisar rápido y con consistencia, con el procedimiento de la marca a la vista. Ver tendencias y patrones por marca. |
| **Especialista** (Dani) | Atiende 2–3 marcas al día, cambiando de contexto. | Ver sus propias revisiones y lo que le escribieron. Que nadie más vea sus puntajes. |
| **Marca cliente** | No usa la herramienta (supuesto V1). | Evidencia de que la calidad mejora. Marta se la muestra. |
| **Nuevo integrante** | Aprende qué es una buena respuesta por marca. | Ejemplos buenos y malos con el razonamiento. (Fuera de V1, soportado por el modelo de datos.) |

---

## 3. El problema, por capas

**Síntoma:** la líder abre la bandeja compartida, lee algunas respuestas del día anterior y avisa por Slack si algo está mal. Deja de funcionar a partir de la cuarta marca y no deja registro.

Debajo del síntoma hay cinco problemas:

1. **Capacidad.** Dos líderes × 5 revisiones/día ≈ 50 revisiones semanales repartidas en seis marcas, contra cientos de respuestas diarias. Se revisa una fracción mínima, así que cada revisión tiene que valer mucho.
2. **Muestreo ciego.** Sin criterio para elegir qué leer, un especialista puede pasar semanas sin ser revisado. Así ocurrió el caso de quien cerraba tickets sin revisar el historial del pedido durante un mes: se enteraron porque la marca se enteró primero.
3. **La calidad es relativa a la marca.** Para la marca de scooters una buena respuesta diagnostica antes de ofrecer una devolución; para la de empaques una buena respuesta es rápida, exacta y de tres líneas. No hay rúbrica universal.
4. **No todos los errores pesan igual.** Un tono equivocado es molesto; información falsa sobre el producto hace perder la cuenta. Un promedio simple esconde justo lo que importa.
5. **El juicio no deja registro.** Es la raíz: sin registro no hay coaching, ni tendencia para la marca, ni detección de patrones.

### La raíz en una frase

> **Sellervate vende calidad pero no la registra.** El juicio experto existe, pero es efímero, no está estructurado y no escala más allá de la cabeza de cada líder.

### La idea central del producto

La herramienta no hace que Marta lea muchas más respuestas. Hace que **cada revisión se escriba una vez y se lea tres veces**:

- el especialista la lee como **feedback**;
- la vista de marca la usa como **dato de tendencia**;
- un nuevo integrante la usa como **ejemplo** (V2).

---

## 4. Las notas de la reunión, traducidas a requisitos

| Lo que dijo la líder | Requisito que implica |
|---|---|
| "Sé en tres respuestas si alguien leyó los procedimientos, pero reviso cinco al día" | Revisión rápida, con el procedimiento de la marca visible junto a la respuesta. |
| "Scooter: diagnosticar antes de devolver. Empaques: rápido y exacto" | Los criterios pertenecen a la marca: etiquetas de error globales **y** específicas por marca. |
| "Tono mal es molesto; información falsa nos cuesta la cuenta" | Las etiquetas tienen **severidad** (crítica, mayor, menor). Los errores críticos se ven aparte. |
| "Cerraba tickets sin revisar el historial un mes" | Patrones recurrentes en el tiempo y **cobertura**: quién lleva días sin ser revisado. |
| "Yo cubro cuatro de seis marcas y Nuria el resto" | Permisos por **marca asignada**. La visión transversal queda como pregunta para V2. |
| "Un especialista ve sus puntajes y mis comentarios, no los de otros" | Autorización real en el servidor. Privacidad entre especialistas. |
| "Cuando entra alguien nuevo le mostramos los buenos y los malos" | Una revisión puede marcarse como **ejemplo**. Sin pantalla en V1. |
| "Prefiero mostrar el número que decir la frase" | Tendencia por marca, **con el tamaño de muestra visible**. |
| "Algún día debería traer las respuestas del helpdesk solo" | La respuesta guarda `source` + `external_id`, únicos por marca. Importación futura idempotente. |

---

## 5. Qué es y qué no es

**Es:** una herramienta interna de evaluación retrospectiva de calidad (en la industria: *QA de atención al cliente*, como MaestroQA o Klaus). La diferencia con esas herramientas genéricas es que aquí la calidad es **relativa a cada marca** y la operación es **multi-marca en marca blanca**.

**No es:**

- un helpdesk, un inbox ni un sistema de tickets (las respuestas ya salieron);
- un producto de IA (nada en el loop necesita un modelo);
- un portal para la marca cliente (V1).

---

## 6. Decisión de producto

**Lectura elegida: revisión como núcleo, con prueba como vista delgada.**

| Lectura | Evaluación | En V1 |
|---|---|---|
| **Revisión** (el loop) | Ataca la raíz: crea el registro. Sin ella las otras dos no tienen datos. Es donde se demuestra la autorización. | **Completa** |
| **Prueba** (tendencia y evidencia) | Alto valor comercial, pero con ~8 revisiones por marca por semana necesita un buen loop detrás. | **Vista delgada:** tendencia con n, críticos, patrones, cobertura |
| **Coaching** (biblioteca) | Es un filtro sobre revisiones existentes más una pantalla. El más barato de dejar para después. | **Fuera.** Solo el campo `is_example` |

**La historia que se defiende:** *el problema es que el juicio no se registra; construí la forma más rápida de registrarlo bien, y todo lo demás son vistas sobre ese registro.*

### Supuestos explícitos (van a DECISIONS.md)

1. La marca cliente no entra al sistema en V1.
2. Una respuesta tiene como máximo una revisión en V1 (la calibración entre líderes queda para V2).
3. Cada líder ve y revisa solo sus marcas asignadas (mínimo privilegio).
4. Los especialistas no ven agregados de marca, solo lo suyo.
5. Los nombres del personal son visibles para todo el personal; los puntajes no.
6. El tiempo de respuesta es un dato medido, no un juicio del revisor.
7. Escala de puntaje 1–4, sin punto medio.

### Dónde sí tendría lugar un modelo (párrafo para DECISIONS.md, no feature)

Ordenar la cola: de las ~30 respuestas de ayer, sugerir cuáles leer primero (por ejemplo, "¿probablemente afirma algo que contradice el procedimiento de la marca?"). Antes de confiar en él:

- calibrarlo contra semanas de revisiones humanas hechas en esta misma herramienta;
- mantener una fracción aleatoria de la cola para no crear puntos ciegos;
- contar con un acuerdo de datos por marca antes de enviar respuestas a un tercero.

### Preguntas para Sellervate antes de V2

- ¿Las líderes necesitan ver a un especialista a través de todas sus marcas, aunque no lideren alguna?
- ¿La marca cliente debería ver algo directamente?
- ¿Una respuesta debería poder revisarse por dos líderes para calibrar criterios?
- ¿Qué helpdesks usan las marcas (Gorgias, Zendesk, Help Scout…)?
