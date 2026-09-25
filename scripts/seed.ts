// P3: invented but credible demo data for the local Supabase stack.
// Run with `npm run seed` after `npm run db:reset` (Node >= 22.18 strips types natively).
//
// This is the ONLY place the service role key is used. It never runs inside a
// request: it talks to the local Auth admin and REST APIs over plain fetch.
// Every date is relative to the moment the script runs.

type BrandSlug = 'voltia' | 'caja-norte' | 'brisa-cafe';
type PersonKey = 'marta' | 'nuria' | 'dani' | 'lucia' | 'oscar';

type PersonSeed = {
  key: PersonKey;
  fullName: string;
  role: 'lead' | 'specialist';
  brands: BrandSlug[];
};

type TagSeed = {
  brand: BrandSlug | null;
  code: string;
  label: string;
  severity: 'critical' | 'major' | 'minor';
};

type ReviewSeed = {
  score: 1 | 2 | 3 | 4;
  comment: string;
  tags: string[];
  daysAgo: number;
  example?: boolean;
};

type ReplySeed = {
  brand: BrandSlug;
  specialist: PersonKey;
  daysAgo: number;
  at: string;
  firstResponseMinutes: number | null;
  customer: string;
  body: string;
  review?: ReviewSeed;
};

// ---------------------------------------------------------------------------
// Domain content
// ---------------------------------------------------------------------------

const brands: { slug: BrandSlug; name: string; voice: string; procedures: string }[] = [
  {
    slug: 'voltia',
    name: 'Voltia Scooters',
    voice:
      'Técnica y paciente. Diagnostica paso a paso antes de proponer una devolución, con instrucciones numeradas y tuteo. Firma «Equipo Voltia».',
    procedures: `## Antes de hablar de devolución o garantía
1. Abre el historial del pedido: modelo, fecha de entrega y tickets anteriores. No preguntes al cliente lo que ya está ahí.
2. Pide el código de error del display y la versión de firmware (app Voltia › Ajustes › Información).
3. Guía el diagnóstico: E10 protección de batería (BMS), E21 controlador, E30 sensor de freno. «No arranca» suele ser modo transporte o BMS tras descarga completa: carga de 6 h.
4. Solo con el fallo confirmado se abre una RMA. Nunca ofrezcas devolución en el primer mensaje sin diagnóstico, aunque esté dentro de los 30 días.

## Seguridad
- Batería hinchada, caliente al tacto, humo u olor a quemado: pedir que no la cargue ni la use y escalar a Técnico Nivel 2 el mismo día.

## Garantía
- 2 años en motor y batería; pastillas y neumáticos son consumibles salvo defecto en los primeros 3 meses.
- Daños por inmersión o lavado a presión no están cubiertos (IPX5).`,
  },
  {
    slug: 'caja-norte',
    name: 'Caja Norte',
    voice:
      'Rápida y exacta. Máximo tres líneas: dato confirmado, cifra exacta y siguiente paso. Trato de usted, sin emojis. Firma «— Caja Norte».',
    procedures: `## Formato
- Tres líneas como máximo: saludo + dato exacto · condición o plazo · siguiente paso.
- Medidas siempre interiores y en milímetros (largo × ancho × alto).

## Datos que se dan sin redondear
- Pedido mínimo: 250 uds por referencia.
- Plazo estándar: 5 días hábiles. Con impresión de logo: 12 días hábiles desde la aprobación del arte.
- Muestras gratuitas: hasta 3 modelos por cliente.

## Antes de responder
- Los clientes escriben desde su cuenta: busca el pedido CN-xxxxx en el historial antes de pedir el número.
- Errores de preparación: reenvío sin coste al día siguiente y se indica la cantidad exacta.`,
  },
  {
    slug: 'brisa-cafe',
    name: 'Brisa Café',
    voice:
      'Cálida y sensorial. Habla de origen, tueste y taza; resuelve la suscripción sin fricción. Tuteo. Firma «— Brisa».',
    procedures: `## Suscripción
- Tostamos los martes. Pausas, saltos y cambios de molienda aplican al siguiente envío si se hacen antes del lunes a las 23:59.
- Cancelación: ofrece una pausa una sola vez; si el cliente insiste, cancela sin más preguntas y confirma que no habrá más cargos.

## Incidencias
- Bolsa rota, abierta o café defectuoso: reposición del mismo lote sin pedir fotos ni devolución (primer incidente en 6 meses).
- Cobro duplicado: reembolso inmediato del duplicado, 3–5 días hábiles según el banco.

## Recomendaciones
- Recomienda por método: espresso, filtro, prensa francesa. Incluye molienda y temperatura (92–94 °C).`,
  },
];

const people: PersonSeed[] = [
  { key: 'marta', fullName: 'Marta Ibáñez', role: 'lead', brands: ['voltia', 'caja-norte'] },
  { key: 'nuria', fullName: 'Nuria Castells', role: 'lead', brands: ['brisa-cafe'] },
  { key: 'dani', fullName: 'Dani Ruiz', role: 'specialist', brands: ['voltia', 'caja-norte'] },
  { key: 'lucia', fullName: 'Lucía Ferrer', role: 'specialist', brands: ['caja-norte', 'brisa-cafe'] },
  { key: 'oscar', fullName: 'Óscar Medina', role: 'specialist', brands: ['voltia', 'brisa-cafe'] },
];

const leadOf: Record<BrandSlug, PersonKey> = {
  voltia: 'marta',
  'caja-norte': 'marta',
  'brisa-cafe': 'nuria',
};

const tags: TagSeed[] = [
  { brand: null, code: 'sin-historial-pedido', label: 'No revisó el historial del pedido', severity: 'major' },
  { brand: null, code: 'no-resuelve', label: 'No resuelve lo que el cliente pregunta', severity: 'major' },
  { brand: null, code: 'dato-incorrecto', label: 'Da información incorrecta al cliente', severity: 'critical' },
  { brand: null, code: 'tono-fuera-de-marca', label: 'Tono fuera de la voz de la marca', severity: 'minor' },
  { brand: 'voltia', code: 'devolucion-sin-diagnostico', label: 'Ofrece devolución sin diagnosticar', severity: 'critical' },
  { brand: 'voltia', code: 'sin-codigo-error', label: 'No pidió código de error ni firmware', severity: 'major' },
  { brand: 'voltia', code: 'seguridad-bateria', label: 'Omite el aviso de seguridad de batería', severity: 'critical' },
  { brand: 'caja-norte', code: 'respuesta-larga', label: 'Más de tres líneas', severity: 'minor' },
  { brand: 'caja-norte', code: 'cifra-imprecisa', label: 'Plazo, medida o cantidad sin cifra exacta', severity: 'major' },
  { brand: 'brisa-cafe', code: 'sin-ajuste-suscripcion', label: 'No ofreció pausar o ajustar la suscripción', severity: 'major' },
  { brand: 'brisa-cafe', code: 'pide-devolver-cafe', label: 'Pide devolver café o fotos en una reposición', severity: 'minor' },
];

// Mandatory P3 cases:
// - clearly bad reply: Voltia return offered without diagnosis (Óscar, 20 days ago);
// - recurring pattern: Dani tagged «sin-historial-pedido» across three weeks and two brands;
// - coverage gap: Lucía has replies but no review in the last 10 days;
// - the queue is never empty: replies from yesterday and the day before are unreviewed.
const replies: ReplySeed[] = [
  // --- Voltia Scooters (reviews by Marta) ---
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 27, at: '09:14', firstResponseMinutes: 42,
    customer: 'Hola, mi S2 se apaga de golpe cuando subo la cuesta de mi calle. La batería marca 60 % y al rato vuelve a encender. ¿Es normal?',
    body: `Hola Andrea:

No es normal, pero en la mayoría de casos tiene arreglo. Vamos a comprobarlo paso a paso:

1. ¿Qué código aparece en el display justo antes de apagarse? (por ejemplo E10 o E21)
2. En la app Voltia, entra en Ajustes › Información y dime la versión de firmware.
3. ¿Qué modelo tienes y en qué fecha lo recibiste?

Con eso sabré si es la protección de la batería o el controlador.

Un saludo,
Equipo Voltia`,
    review: {
      score: 2, daysAgo: 26, tags: ['sin-historial-pedido'],
      comment: 'El diagnóstico está bien planteado, pero el punto 3 le pide datos que ya estaban en su pedido (S2, entregado hace tres semanas). Revisa el historial antes de preguntar: cada pregunta de más es un día más de ticket.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 26, at: '16:40', firstResponseMinutes: 25,
    customer: 'El freno trasero de mi Voltia Urban hace un chirrido horrible desde ayer.',
    body: `Hola Marcos:

Un chirrido en el freno trasero suele ser el disco contaminado o las pastillas desalineadas. Prueba esto antes de nada:

1. Limpia el disco con alcohol isopropílico y un paño limpio (nada de aceite ni desengrasante).
2. Frena suave diez veces a baja velocidad para asentar las pastillas.
3. Si sigue sonando, mándanos un vídeo de 10 segundos con la rueda girando.

Veo en tu pedido que el Urban tiene dos meses, así que si hace falta cambiar pastillas entra en garantía.

Equipo Voltia`,
    review: {
      score: 4, daysAgo: 25, tags: [], example: true,
      comment: 'Así se responde en Voltia: diagnóstico antes que envío, pasos concretos, y comprobó el pedido antes de hablar de garantía. La marco como ejemplo para formación.',
    },
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 24, at: '11:05', firstResponseMinutes: 55,
    customer: 'Me llegó el cargador del S2 y no enciende la luz. Pedido VT-20533.',
    body: `Hola Irene:

Siento el problema con el cargador. ¿Puedes decirme qué modelo de patinete tienes y cuándo lo compraste? Así compruebo si está en garantía.

Mientras tanto, prueba otro enchufe y revisa que el conector esté bien encajado.

Equipo Voltia`,
    review: {
      score: 2, daysAgo: 23, tags: ['sin-historial-pedido'],
      comment: 'Te dio el número de pedido en el primer mensaje: ahí estaban el modelo (S2) y la fecha (hace diez días). Volver a preguntarlo la obliga a esperar otra ronda. Faltó además pedir si el LED del cargador parpadea, que es el primer paso del procedimiento.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 23, at: '18:22', firstResponseMinutes: 31,
    customer: 'La app no encuentra el patinete por Bluetooth desde que actualicé el móvil.',
    body: `Hola Beatriz:

Tras actualizar el móvil suele cambiar algún permiso. Prueba en este orden:

1. En Ajustes del móvil › Bluetooth, olvida el dispositivo «Voltia-S2».
2. Da a la app permiso de ubicación y de dispositivos cercanos (Android lo exige para Bluetooth).
3. Apaga el patinete manteniendo el botón 10 segundos y vuelve a encenderlo.
4. Abre la app y busca de nuevo.

Equipo Voltia`,
    review: {
      score: 3, daysAgo: 22, tags: [],
      comment: 'Pasos correctos y en buen orden. Le faltó cerrar con el siguiente paso si no funciona (reinstalar el firmware desde la app de taller), para que no tenga que volver a escribir.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 20, at: '10:12', firstResponseMinutes: 18,
    customer: 'Mi patinete no arranca. Lo compré hace dos semanas y ya está roto. Quiero devolverlo.',
    body: `Hola Sergio:

Sentimos mucho las molestias. Te acabo de generar la etiqueta de devolución, la tienes en tu correo. En cuanto recibamos el patinete te devolvemos el importe en 5-7 días.

¡Gracias por tu paciencia!
Equipo Voltia`,
    review: {
      score: 1, daysAgo: 19, tags: ['devolucion-sin-diagnostico', 'sin-codigo-error'],
      comment: 'Devolución ofrecida en el primer mensaje, sin un solo paso de diagnóstico. La mayoría de «no arranca» son modo transporte o BMS en protección tras una descarga completa, y se resuelven con una carga de 6 horas. No pediste código de error ni revisaste tickets previos. Esto cuesta la logística inversa de un patinete de 600 € y la marca lo va a ver. Lo repasamos juntos hoy.',
    },
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 19, at: '13:47', firstResponseMinutes: 37,
    customer: 'Me sale E10 en la pantalla y no pasa de 15 km/h.',
    body: `Hola Tomás:

El E10 es la protección de la batería: el patinete limita la velocidad para cuidarla. Normalmente pasa por temperatura.

1. Déjalo apagado 30 minutos a temperatura ambiente.
2. Cárgalo al 100 % sin interrumpir la carga.
3. Enciende y prueba en llano.

Si vuelve a salir, dime la versión de firmware y lo miramos.

Equipo Voltia`,
    review: {
      score: 2, daysAgo: 18, tags: ['seguridad-bateria'],
      comment: 'El significado del E10 y el orden de los pasos son correctos. Pero con un E10 hay que dar siempre el aviso de seguridad: si la batería está caliente al tacto o abombada, no cargarla y escribirnos. Le pediste justo cargarla. Es el punto crítico del procedimiento.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 15, at: '09:30', firstResponseMinutes: 22,
    customer: 'El patinete hace un ruido metálico en la rueda delantera cuando paso por baches.',
    body: `Hola Nerea:

Gracias por el detalle de los baches, ayuda mucho. Veo que es tu primer ticket y que el Urban tiene cinco meses.

1. Con el patinete plegado, mueve la rueda delantera de lado a lado: ¿tiene holgura?
2. Revisa que las dos tuercas del eje estén apretadas (llave de 15 mm).
3. ¿Aparece algún código en el display?

Si hay holgura con las tuercas apretadas, es el rodamiento y lo cambiamos en garantía.

Equipo Voltia`,
    review: {
      score: 3, daysAgo: 14, tags: [],
      comment: 'Revisó el historial, pidió código y dejó clara la condición para la garantía. Para ser un 4 le faltó pedir un vídeo del ruido, que nos ahorra una ronda si hay que escalar.',
    },
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 13, at: '12:18', firstResponseMinutes: 29,
    customer: 'Mi S2 no carga. El cargador tiene la luz verde todo el rato aunque lo enchufe.',
    body: `Hola Álvaro:

Veo en tu historial que este ya es tu segundo cargador (el primero lo cambiamos hace dos meses), así que el problema probablemente no es el cargador sino la toma del patinete.

1. Con el patinete apagado, revisa si la clavija de carga tiene suciedad o algún pin doblado.
2. Si ves suciedad, límpiala con un bastoncillo seco.
3. Dime qué código aparece al encenderlo.

Si la toma está dañada, te la cambiamos en garantía sin que tengas que enviar el patinete.

Equipo Voltia`,
    review: {
      score: 4, daysAgo: 12, tags: [],
      comment: 'Mejora clara: abriste el historial, viste que era el segundo cargador y fuiste directo a la toma. Menos idas y vueltas para el cliente. Así sí.',
    },
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 10, at: '17:05', firstResponseMinutes: 48,
    customer: 'Tengo un pinchazo en la rueda trasera, ¿me podéis enviar una cámara?',
    body: `Hola Paula:

¡Claro! ¿Qué modelo tienes? Las cámaras del S2 y del Urban son distintas (10" y 8,5").

En cuanto me lo digas te la envío.

Equipo Voltia`,
    review: {
      score: 2, daysAgo: 9, tags: ['sin-historial-pedido'],
      comment: 'Tercera semana con la misma etiqueta: el modelo estaba en su pedido (Urban, comprado hace cinco meses) y podías enviar la cámara en el primer mensaje. Hagamos 15 minutos de repaso sobre cómo abrir el historial desde el helpdesk.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 8, at: '11:40', firstResponseMinutes: 9,
    customer: 'La carcasa de abajo de la batería está abombada y huele un poco raro. ¿Es grave?',
    body: `Hola Iván:

Gracias por avisar tan rápido. Por seguridad, ahora mismo:

1. No cargues el patinete ni lo uses.
2. Déjalo en un espacio ventilado, lejos de cosas inflamables.

He escalado tu caso a nuestro técnico de Nivel 2, que te llamará hoy. Nosotros nos encargamos de la recogida; no tienes que llevarlo a ningún sitio.

Equipo Voltia`,
    review: {
      score: 4, daysAgo: 7, tags: [], example: true,
      comment: 'Perfecto: seguridad primero, escalado el mismo día y sin prometer plazos que no controlamos. Otro ejemplo para formación.',
    },
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 6, at: '15:15', firstResponseMinutes: 34,
    customer: 'Quiero devolverlo. Solo hago 18 km y se queda sin batería, anuncian 35.',
    body: `Hola Clara:

Entiendo la decepción; 18 km es menos de lo que debería. Antes de decidir, comprobemos tres cosas que cambian mucho la autonomía:

1. Presión de los neumáticos: debe ser 50 psi. Con 35 psi se pierde hasta un 30 %.
2. Modo de conducción: los 35 km se miden en modo Eco.
3. Firmware: la versión 2.4 mejora el consumo; dime cuál tienes.

Si tras esto no pasas de 25 km, tu patinete sigue dentro de los 30 días y tramitamos la devolución sin problema.

Equipo Voltia`,
    review: {
      score: 4, daysAgo: 5, tags: [],
      comment: 'Diagnosticó y dejó la devolución como una opción real, sin empujarla ni negarla. Justo lo que pide Voltia, y en contraste directo con el caso de hace tres semanas.',
    },
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 3, at: '10:02', firstResponseMinutes: 26,
    customer: 'El manillar tiene holgura desde que lo pliego y despliego cada día.',
    body: `Hola Rubén:

Es un ajuste habitual con el uso diario. Veo que tu S2 tiene ocho meses:

1. Despliega el patinete y localiza el tornillo del cierre de plegado (llave Allen de 5 mm).
2. Dale un cuarto de vuelta en sentido horario y prueba.
3. Si sigue con holgura, mándanos un vídeo corto moviendo el manillar.

Equipo Voltia`,
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 2, at: '19:26', firstResponseMinutes: 40,
    customer: '¿El S2 se puede usar con lluvia?',
    body: `Hola Julia:

El S2 tiene protección IPX5: aguanta salpicaduras y lluvia ligera. Evita charcos profundos y no lo laves con manguera ni a presión, porque los daños por entrada de agua no los cubre la garantía.

Después de usarlo mojado, sécalo con un paño antes de cargarlo.

Equipo Voltia`,
  },
  {
    brand: 'voltia', specialist: 'dani', daysAgo: 1, at: '09:48', firstResponseMinutes: 33,
    customer: 'Lavé el patinete con la manguera y ahora me sale E21 y no acelera.',
    body: `Hola Diego:

El E21 indica un fallo en el controlador, probablemente por humedad.

1. No lo cargues ni lo enciendas durante 48 horas.
2. Déjalo en un lugar seco, con la plataforma hacia arriba.

Si tras 48 horas sigue el E21, te abro la reparación en garantía.

Equipo Voltia`,
  },
  {
    brand: 'voltia', specialist: 'oscar', daysAgo: 1, at: '16:55', firstResponseMinutes: 21,
    customer: 'No me llega el código para desbloquear el patinete en la app.',
    body: `Hola Samuel:

El código llega por SMS al número de tu cuenta. Prueba esto:

1. Revisa que el número de Ajustes › Cuenta sea el correcto.
2. Espera 2 minutos y pulsa «Reenviar código».
3. Si no llega, dime los cuatro últimos dígitos del número y lo reviso desde aquí.

Equipo Voltia`,
  },

  // --- Caja Norte (reviews by Marta) ---
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 25, at: '08:52', firstResponseMinutes: 12,
    customer: 'Buenos días, necesito saber si la caja K-30 sirve para enviar 2 botellas de vino de 75 cl.',
    body: `Buenos días, Jorge: la K-30 (interior 350 × 110 × 100 mm) aloja dos botellas de 75 cl con el separador SEP-2.
Pedido mínimo 250 uds; plazo estándar 5 días hábiles.
¿Le enviamos una muestra gratuita a la dirección de su cuenta? — Caja Norte`,
    review: {
      score: 4, daysAgo: 24, tags: [], example: true,
      comment: 'Tres líneas, medida interior exacta, mínimo, plazo y siguiente paso. Es la plantilla de Caja Norte.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 23, at: '12:30', firstResponseMinutes: 20,
    customer: '¿Cuánto tarda un pedido con impresión de logo? Pedido CN-11872.',
    body: `¡Hola! Muchas gracias por escribirnos 😊

Normalmente los pedidos con impresión personalizada tardan un poquito más que los estándar, porque primero tenemos que preparar el arte y después pasar por la imprenta.

Depende un poco de la carga de trabajo que tengamos, pero suele ser unas dos semanas o así.

Si tienes cualquier otra duda, aquí estamos para lo que necesites.

¡Un saludo!`,
    review: {
      score: 2, daysAgo: 22, tags: ['respuesta-larga', 'cifra-imprecisa', 'tono-fuera-de-marca'],
      comment: 'Siete líneas, un emoji y tuteo para dar un plazo que además quedó vago («dos semanas o así»). En Caja Norte son 12 días hábiles desde la aprobación del arte. Tres líneas, cifra exacta, usted.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 19, at: '09:10', firstResponseMinutes: 9,
    customer: 'Me han llegado 500 cajas M-20 pero pedí 600.',
    body: `Buenos días, Ana: en el pedido CN-11904 constan 600 uds facturadas y 500 enviadas.
Las 100 restantes salen mañana sin coste; recibirá el seguimiento por correo.
Disculpe el error de preparación. — Caja Norte`,
    review: {
      score: 4, daysAgo: 18, tags: [],
      comment: 'Revisó el pedido antes de responder y dio cantidad, fecha y coste. Nada que corregir.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 17, at: '11:44', firstResponseMinutes: 15,
    customer: '¿Me confirman si mi pedido ya salió?',
    body: `Buenos días: ¿me indica su número de pedido para comprobarlo?
Gracias. — Caja Norte`,
    review: {
      score: 2, daysAgo: 16, tags: ['sin-historial-pedido', 'no-resuelve'],
      comment: 'Escribe desde su cuenta y tiene un único pedido abierto (CN-11931, enviado ayer con GLS). Con abrir el historial respondías en una línea; en cambio el ticket se alarga un día. Segunda semana con esta etiqueta, ahora también en Caja Norte.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 14, at: '10:26', firstResponseMinutes: 14,
    customer: '¿Tienen cajas que cierren con solapa, sin cinta?',
    body: `Sí: la serie Z (Z-10 a Z-40) cierra con solapa autoadhesiva, sin cinta.
Mínimo 250 uds por referencia; plazo 5 días hábiles.
Medidas interiores de cada modelo en el catálogo adjunto. — Caja Norte`,
    review: {
      score: 3, daysAgo: 13, tags: [],
      comment: 'Correcta y breve. Faltó ofrecer muestras, que es el siguiente paso natural cuando alguien pregunta por una serie nueva.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 12, at: '13:03', firstResponseMinutes: 11,
    customer: 'Necesito 300 cajas K-30 para el viernes de la semana que viene. ¿Llegan?',
    body: `Buenos días, Carlos: con pedido hoy antes de las 14:00, 300 uds de K-30 salen en 5 días hábiles y llegan el jueves.
Llegarían con un día de margen.
¿Le preparo el pedido con la dirección de su cuenta? — Caja Norte`,
    review: {
      score: 4, daysAgo: 11, tags: [],
      comment: 'Tres líneas, fecha concreta y siguiente paso. Muy buena mejora respecto a hace dos semanas.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 9, at: '09:37', firstResponseMinutes: 16,
    customer: 'Las cajas llegaron húmedas por un lado, unas 40 no se pueden usar.',
    body: `Buenos días, Rosa: repondremos 40 uds de M-20 del pedido CN-11988, sin coste, con salida mañana.
No es necesario devolver las dañadas.
Le enviamos el seguimiento por correo en cuanto salgan. — Caja Norte`,
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 8, at: '15:50', firstResponseMinutes: 17,
    customer: '¿Pueden emitir factura sin IVA con nuestro número intracomunitario?',
    body: `Sí, siempre que su NIF-IVA esté validado en VIES.
Añádalo en Cuenta › Facturación antes de confirmar el pedido.
— Caja Norte`,
    review: {
      score: 3, daysAgo: 7, tags: [],
      comment: 'Correcto y en formato. Faltó decir qué pasa con pedidos ya facturados (rectificativa en 48 h), que es casi siempre la siguiente pregunta.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 6, at: '12:12', firstResponseMinutes: 13,
    customer: 'Solo necesitamos 150 cajas M-20, ¿es posible?',
    body: `El mínimo es de 250 uds por referencia.
Para 150 uds le proponemos el pack mixto de 250 (150 M-20 + 100 M-10) al mismo precio unitario.
¿Le enviamos la proforma? — Caja Norte`,
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 4, at: '10:41', firstResponseMinutes: 21,
    customer: 'El seguimiento de GLS no se actualiza desde hace tres días.',
    body: `Buenos días: ¿me facilita el número de seguimiento para reclamarlo a GLS?
— Caja Norte`,
    review: {
      score: 2, daysAgo: 3, tags: ['sin-historial-pedido'],
      comment: 'Cuarta vez en tres semanas, en las dos marcas: el seguimiento estaba en el pedido CN-12010. Ya no es un descuido puntual; lo tratamos en el 1:1 del lunes.',
    },
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 3, at: '11:18', firstResponseMinutes: 10,
    customer: '¿Qué grosor de cartón tiene la K-30? Enviamos botellas de cristal.',
    body: `La K-30 es de canal doble (BC), 7 mm de grosor.
Para cristal recomendamos añadir el separador SEP-2.
¿Le enviamos muestra de ambos? — Caja Norte`,
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 2, at: '16:04', firstResponseMinutes: 24,
    customer: 'Queremos cambiar el logo del pedido con impresión que hicimos ayer.',
    body: `Buenos días: el pedido CN-12044 aún no ha pasado a imprenta, puede enviar el nuevo arte hoy.
El plazo de 12 días hábiles empieza al aprobar el nuevo arte.
Adjunte el archivo en PDF vectorial respondiendo a este correo. — Caja Norte`,
  },
  {
    brand: 'caja-norte', specialist: 'lucia', daysAgo: 1, at: '09:05', firstResponseMinutes: 8,
    customer: '¿Hacen envíos a Canarias?',
    body: `Sí, con salida en 5 días hábiles y entrega en 3–4 días más.
Los envíos a Canarias incluyen el DUA, sin coste para usted.
— Caja Norte`,
  },
  {
    brand: 'caja-norte', specialist: 'dani', daysAgo: 1, at: '13:32', firstResponseMinutes: 19,
    customer: 'Me han cobrado el transporte y pensaba que era gratis.',
    body: `Buenos días: ¡perdona la confusión! El envío es gratis a partir de un importe, pero no recuerdo exactamente cuál, lo consulto y te digo.
— Caja Norte`,
  },

  // --- Brisa Café (reviews by Nuria) ---
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 27, at: '10:20', firstResponseMinutes: 35,
    customer: 'Me llegó la bolsa rota y medio café esparcido por la caja.',
    body: `¡Hola Laura!

Qué rabia abrir la caja y encontrarte eso. Mañana sale otra bolsa del mismo lote, el Huila de tueste medio, así que no te quedas sin tu café de la semana.

No hace falta que devuelvas nada ni que nos mandes fotos. Que la disfrutes con calma cuando llegue.

— Brisa`,
    review: {
      score: 4, daysAgo: 26, tags: [],
      comment: 'Justo el procedimiento: reposición del mismo lote sin pedir fotos ni devolución, y con la voz cálida de Brisa.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 22, at: '18:02', firstResponseMinutes: 28,
    customer: 'Me voy tres semanas de vacaciones, ¿puedo pausar la suscripción?',
    body: `¡Hola Miguel!

Claro que sí, y qué buen plan. Ya he pausado tus próximos tres envíos; el siguiente café saldrá del tueste del martes posterior a tu vuelta, recién hecho.

Si cambias de planes, puedes reactivarla desde tu cuenta hasta el lunes antes de cada tueste.

¡Buen viaje!
— Brisa`,
    review: {
      score: 4, daysAgo: 21, tags: [],
      comment: 'Pausa aplicada en el mismo mensaje, fecha del siguiente tueste y cómo cambiarlo. Cercana sin exagerar.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 21, at: '14:15', firstResponseMinutes: 44,
    customer: 'Quiero cancelar la suscripción.',
    body: `Hola Pedro:

Tu suscripción ha sido cancelada.

Saludos.`,
    review: {
      score: 2, daysAgo: 20, tags: ['sin-ajuste-suscripcion', 'tono-fuera-de-marca'],
      comment: 'En Brisa ofrecemos una pausa una sola vez antes de cancelar, y si insiste se cancela sin más. Aquí no hubo ni esa pregunta ni confirmación de que no habrá más cargos. Suena a sistema, no a Brisa.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 18, at: '09:45', firstResponseMinutes: 31,
    customer: 'El café de este mes me sabe muy amargo, ¿es normal?',
    body: `¡Hola Carmen!

El de este mes es un Etiopía natural de tueste claro: debería saber a frutos rojos, no a amargo. Casi siempre es cuestión de extracción:

· Si lo preparas en cafetera italiana, prueba una molienda algo más gruesa y retírala del fuego en cuanto empiece a borbotear.
· Agua a 92–94 °C, nunca hirviendo.

Si aun así no te convence, dime y a partir del próximo envío te pasamos a un tueste medio.

— Brisa`,
    review: {
      score: 3, daysAgo: 17, tags: [],
      comment: 'Buena explicación del origen y la extracción, muy en voz de Brisa. Le faltó preguntar el método que usa antes de dar la receta de la italiana.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 15, at: '11:33', firstResponseMinutes: 27,
    customer: '¿Puedo cambiar de café en grano a molido para espresso?',
    body: `¡Hola Hugo!

Claro. Ya he cambiado tu suscripción a molienda fina para espresso. Te va a encantar con el Brasil de este mes, que tiene mucho cuerpo.

— Brisa`,
    review: {
      score: 3, daysAgo: 14, tags: [],
      comment: 'Correcto y en tono. Faltó confirmar desde qué envío aplica: el cambio entra si se hace antes del lunes previo al tueste.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 11, at: '17:20', firstResponseMinutes: 22,
    customer: 'Quiero regalar tres meses de suscripción a mi hermana, ¿cómo lo hago?',
    body: `¡Hola Inés!

Qué regalo tan bonito. Desde brisa › Regalar eliges tres meses, el método de tu hermana y la fecha del primer envío; ella recibe una tarjeta con una nota tuya.

Si quieres, dime el método que usa y te recomiendo por dónde empezar.

— Brisa`,
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 10, at: '08:58', firstResponseMinutes: 19,
    customer: 'Me habéis cobrado dos veces este mes.',
    body: `Hola Elena:

Tienes razón, veo dos cargos del día 1. Ya he emitido el reembolso del duplicado; lo verás en tu cuenta en 3–5 días hábiles, según tu banco.

Perdona el susto.
— Brisa`,
    review: {
      score: 4, daysAgo: 9, tags: [],
      comment: 'Reconoce, resuelve y da plazo real. Breve y amable.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 7, at: '12:40', firstResponseMinutes: 38,
    customer: 'El paquete de café me llegó abierto, ¿me lo cambiáis?',
    body: `Hola Raúl:

Claro. Para tramitar el cambio necesito que nos devuelvas el paquete y que nos envíes fotos de cómo llegó.

Gracias.
— Brisa`,
    review: {
      score: 2, daysAgo: 6, tags: ['pide-devolver-cafe', 'tono-fuera-de-marca'],
      comment: 'En Brisa no se pide devolver café abierto ni fotos en un primer incidente: se repone del mismo lote. Le hiciste ir a correos por un paquete de 12 € y el tono quedó frío.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 5, at: '10:08', firstResponseMinutes: 26,
    customer: '¿El café de este mes tiene cafeína? Estoy embarazada y quiero descafeinado.',
    body: `¡Hola Sara, enhorabuena!

El de este mes sí tiene cafeína. Tenemos un Colombia descafeinado por agua (sin químicos) con notas de caramelo; ya he cambiado tus próximos envíos a ese café.

Cuando quieras volver al de temporada, avísame.

— Brisa`,
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 4, at: '16:12', firstResponseMinutes: 29,
    customer: '¿Qué café me recomendáis para prensa francesa?',
    body: `¡Hola Andrés!

Para prensa francesa te recomiendo el Brasil Cerrado: cuerpo alto, notas de cacao y avellana, perfecto para una infusión larga.

Molienda gruesa, tipo sal marina; 4 minutos de infusión con agua a 93 °C y presiona despacio. Si te gusta más ligero, prueba 30 g por medio litro.

— Brisa`,
    review: {
      score: 3, daysAgo: 3, tags: [],
      comment: 'Buena recomendación con método, molienda y temperatura. Un poco larga, pero sin salirse de la voz de Brisa.',
    },
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 2, at: '09:22', firstResponseMinutes: 17,
    customer: 'No me ha llegado el café de esta semana.',
    body: `¡Hola Lorena!

Tu café salió el martes con el tueste de la semana; según el seguimiento, está en tu oficina de correos desde ayer. Te dejo el enlace para ver el horario de recogida.

Si prefieres que te lo volvamos a enviar a casa, dímelo y lo gestiono.

— Brisa`,
  },
  {
    brand: 'brisa-cafe', specialist: 'oscar', daysAgo: 1, at: '11:11', firstResponseMinutes: 33,
    customer: 'Quiero cancelar, el café es demasiado caro para mí ahora.',
    body: `¡Hola Mónica!

Te entiendo perfectamente. Antes de cancelar: ¿te vendría bien pausar un par de meses o pasar a un envío cada tres semanas? Así el gasto baja sin perder tu café.

Si prefieres cancelar, dímelo y lo hago al momento, sin más cargos.

— Brisa`,
  },
  {
    brand: 'brisa-cafe', specialist: 'lucia', daysAgo: 1, at: '18:47', firstResponseMinutes: 24,
    customer: 'La molienda de este mes es muy gruesa para mi cafetera de espresso.',
    body: `¡Hola Víctor!

Uy, tu suscripción figura con molienda para filtro; puede que se cambiara al renovar. Ya la he puesto en fina para espresso a partir del próximo tueste, y mañana te sale una bolsa del café de este mes molida para espresso, sin coste.

— Brisa`,
  },
];

const brandChanges: { brand: BrandSlug; daysAgo: number; note: string }[] = [
  {
    brand: 'voltia', daysAgo: 16,
    note: 'Sesión de 30 min con Dani y Óscar: diagnóstico antes de devolución y aviso de seguridad de batería, tras la devolución sin diagnóstico del patinete que no arrancaba.',
  },
  {
    brand: 'caja-norte', daysAgo: 10,
    note: 'Plantilla de tres líneas fijada en el helpdesk (dato exacto · condición o plazo · siguiente paso).',
  },
];

// ---------------------------------------------------------------------------
// Mechanics
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const demoPassword = process.env.DEMO_PASSWORD ?? '';
const emailDomain = 'demo.sellervate.test';

function fail(message: string): never {
  console.error(`seed: ${message}`);
  process.exit(1);
}

function checkEnvironment() {
  if (!supabaseUrl || !serviceKey || !demoPassword) {
    fail(
      'faltan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY o DEMO_PASSWORD en .env.local ' +
        '(copia los valores locales de `npm run db:status`).',
    );
  }
  const host = new URL(supabaseUrl).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    fail(`solo siembra la base local; ${host} no es local.`);
  }
}

/** Local wall-clock time `daysAgo` days before now, e.g. at('09:14', 3). */
function at(time: string, daysAgo: number): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function dateOnly(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    fail(`${init.method ?? 'GET'} ${path} → ${response.status}: ${text}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

function insert<T>(table: string, rows: object[]): Promise<T[]> {
  return request<T[]>(`/rest/v1/${table}`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  });
}

async function ensureEmptyDatabase() {
  const existing = await request<unknown[]>('/rest/v1/brands?select=id&limit=1', { method: 'GET' });
  if (existing.length > 0) {
    fail('la base ya tiene datos. Ejecuta `npm run db:reset` (borra la base local) y vuelve a sembrar.');
  }
}

async function createUsers(): Promise<Record<PersonKey, string>> {
  const ids = {} as Record<PersonKey, string>;
  for (const person of people) {
    const user = await request<{ id: string }>('/auth/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: `${person.key}@${emailDomain}`,
        password: demoPassword,
        email_confirm: true,
        user_metadata: { full_name: person.fullName },
      }),
    });
    ids[person.key] = user.id;
  }
  return ids;
}

function checkContent() {
  const tagScope = new Map(tags.map((tag) => [tag.code, tag.brand]));
  for (const reply of replies) {
    const author = people.find((person) => person.key === reply.specialist);
    if (author?.role !== 'specialist' || !author.brands.includes(reply.brand)) {
      fail(`${reply.specialist} no es especialista asignado a ${reply.brand}.`);
    }
    const review = reply.review;
    if (!review) continue;
    if (review.daysAgo >= reply.daysAgo || review.daysAgo < 0) {
      fail(`revisión fuera de orden en ${reply.brand} (${reply.daysAgo} días).`);
    }
    for (const code of review.tags) {
      const scope = tagScope.get(code);
      if (scope === undefined || (scope !== null && scope !== reply.brand)) {
        fail(`la etiqueta ${code} no aplica a ${reply.brand}.`);
      }
    }
  }
}

async function main() {
  checkEnvironment();
  checkContent();
  await ensureEmptyDatabase();

  const personIds = await createUsers();

  await insert('people', people.map((person) => ({
    id: personIds[person.key],
    full_name: person.fullName,
    role: person.role,
  })));

  const brandRows = await insert<{ id: string; slug: BrandSlug }>('brands', brands.map((brand) => ({
    slug: brand.slug,
    name: brand.name,
    voice_summary: brand.voice,
    procedures_md: brand.procedures,
  })));
  const brandIds = Object.fromEntries(brandRows.map((row) => [row.slug, row.id])) as Record<BrandSlug, string>;

  await insert('brand_memberships', people.flatMap((person) =>
    person.brands.map((brand) => ({ person_id: personIds[person.key], brand_id: brandIds[brand] })),
  ));

  const tagRows = await insert<{ id: string; brand_id: string | null; code: string }>('issue_tags', tags.map((tag) => ({
    brand_id: tag.brand ? brandIds[tag.brand] : null,
    code: tag.code,
    label: tag.label,
    severity: tag.severity,
  })));
  const tagId = (code: string, brand: BrandSlug) =>
    tagRows.find((row) => row.code === code && (row.brand_id === null || row.brand_id === brandIds[brand]))!.id;

  const sequence: Record<BrandSlug, number> = { voltia: 0, 'caja-norte': 0, 'brisa-cafe': 0 };
  const replyRows = await insert<{ id: string }>('replies', replies.map((reply) => ({
    brand_id: brandIds[reply.brand],
    specialist_id: personIds[reply.specialist],
    customer_message: reply.customer,
    body: reply.body,
    sent_at: at(reply.at, reply.daysAgo),
    first_response_minutes: reply.firstResponseMinutes,
    source: 'seed',
    external_id: `${reply.brand}-${String(++sequence[reply.brand]).padStart(3, '0')}`,
  })));

  const reviewed = replies
    .map((reply, index) => ({ reply, replyId: replyRows[index].id }))
    .filter((entry): entry is { reply: ReplySeed & { review: ReviewSeed }; replyId: string } => !!entry.reply.review);

  const reviewRows = await insert<{ id: string; reply_id: string }>('reviews', reviewed.map(({ reply, replyId }) => {
    const createdAt = at('10:30', reply.review.daysAgo);
    return {
      reply_id: replyId,
      reviewer_id: personIds[leadOf[reply.brand]],
      score: reply.review.score,
      comment: reply.review.comment,
      is_example: reply.review.example ?? false,
      created_at: createdAt,
      updated_at: createdAt,
    };
  }));

  const reviewTagRows = reviewed.flatMap(({ reply }, index) =>
    reply.review.tags.map((code) => ({ review_id: reviewRows[index].id, tag_id: tagId(code, reply.brand) })),
  );
  if (reviewTagRows.length > 0) await insert('review_tags', reviewTagRows);

  await insert('brand_changes', brandChanges.map((change) => ({
    brand_id: brandIds[change.brand],
    author_id: personIds[leadOf[change.brand]],
    happened_on: dateOnly(change.daysAgo),
    note: change.note,
  })));

  console.log(
    `seed: ${people.length} personas, ${brands.length} marcas, ${replies.length} respuestas, ` +
      `${reviewRows.length} revisiones, ${reviewTagRows.length} etiquetas aplicadas.`,
  );
  console.log(`seed: cuentas ${people.map((person) => `${person.key}@${emailDomain}`).join(', ')} (contraseña: DEMO_PASSWORD).`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));

export {};
