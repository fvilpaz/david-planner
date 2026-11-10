# SESSIONS — david-planner

## 10-nov-2026 — Fervis: la guía, como glosario desplegable

**Hecho (en local; sin subir a GitHub: Nando pidió «no subas todavía, que GitHub vaya lanzándose solo; nosotros currando en local»)**
- Nando, con captura: el manual del modelo recitaba siete líneas («algo más estructurado y más interactivo, por módulos»). Primero,
  guía por temas y en pasos (`GUIDE`, 15 temas). Después Nando: «cada vez que le das se abre todas las opciones» → tres niveles
  (grupos → temas → pasos). Y por último: «que el botón, en vez de modo bot, se convierta en **glosario**: vas pulsando y va
  desplegando; no gasta tokens ni interactúa con el bot».
- **Resultado final:** el botón 📖 de la cabecera (y el chip «Guía de la app» del saludo) alterna el chat con una **vista aparte**: 3
  grupos (Turnos y casillas, Menú Gestión, Mi local la app y Fervis) que se despliegan (`<details>`) en sus temas y estos en sus
  pasos. No añade burbujas, no llama a Groq, no necesita clave. Se abre siempre en el chat; la papelera vuelve al chat.
- El modelo sigue consultando la guía con `manual_app(tema)` para los «cómo hago…»; para «la guía» en general remite al 📖.
- Un **guardián**: cada botón del menú Gestión y de la ventana de la casilla tiene que salir en la guía. Cubre botones y menús, no
  reglas ni gestos: eso depende de que quien cambie la app actualice `GUIDE`.
- Móvil: con cuatro botones arriba el título se partía; en ≤ 600 px «Cerrar» pasa a ser una ✕. Probado a 390 px.
- Pruebas 44 y 45 (glosario: grupos, temas, pasos, cubre todos los temas, no añade burbujas ni llama a Groq, vuelve al chat) y el
  guardián. **Controles:** el glosario sin esconder el chat → falla (y, en la versión de chips, no apilar el mismo mensaje).
  45/45.

- **Alucinación encontrada con la clave real:** a «cómo cambio el color de una persona» Fervis contestó de memoria que «no se puede»
  (sí se puede: Gestión → Personal). Arreglo de raíz: si la pregunta es de «cómo/dónde/se puede…», **la app busca en la guía los 2
  temas que más coinciden** (por las 4 primeras letras de las palabras: cambio/cambiar, copio/copiar) y se los pone delante al
  modelo, con la orden de no decir que algo no se puede si no lo ha visto ahí. Al final remite al glosario. Pruebas: qué tema sale
  para cada pregunta, que las de datos no lleven guía y que el mensaje de sistema la lleve. **Control:** sin la búsqueda → falla.
- Glosario: **flechita ▸ que gira** y **acordeón** (al abrir uno se pliegan los otros: no ocupa toda la pantalla). El botón de la
  cabecera lleva su nombre escrito, «📖 Guía» (en el móvil la cabecera pasa a dos filas); saludo nuevo: quién es, qué hace y que, si
  hay dudas, se pulse la guía. Nando: el chip «Guía de la app» del saludo «es perfecto»; pero el saludo largo («te digo quién trabaja, cuento
  turnos…») es **redundante con los chips**: vuelve al corto de antes («¿En qué te puedo ayudar?») y se queda solo la coletilla «Si tienes
  dudas, pulsa el botón «📖 Guía» de arriba». 46/46.

**Decidido (pendiente de Nando)**
- Pega de negocio que apunta Nando: una guía que enseña sola puede cerrar la vía de ir él a dar formación a los locales. Sin decidir;
  la guía está en un solo sitio (`GUIDE`, `GUIDE_GROUPS`), fácil de recortar o quitar. Opinión mía: la guía quita lo aburrido (dónde
  se pulsa); lo que él vale es cómo organizar los turnos de un local.

**Aprendido**
- Mezclar guía y chat llena la conversación de burbujas repetidas; una guía de consulta es mejor como vista aparte.
- `hidden` no gana a un `display:flex` propio: hace falta `[hidden] { display: none !important }` en la ventana.

**Siguiente**
- Que Nando mire el glosario y decida si sube. Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — Fervis: ranking, chips y color libre

**Hecho**
- Hallazgo de Nando (captura): «quién tiene más fines de semana libres desde el día 2 hasta hoy» → «Hugo, 1 fin de semana
  completo». Con los datos delante: del 2 al 10, nadie tuvo un fin de semana libre; Hugo estaba de **vacaciones** (no es
  librar) y Sara y Carmen libraron solo el sábado 7. El modelo soltó el motivo que la herramienta sí traía y omitió los
  sábados sueltos. Arreglo: `resumen_entre` trae **RANKING ya hecho por la app** (completos con su motivo; sueltos aparte, sin
  repetir los de un completo), y el mensaje dice que vacaciones o baja no es librar.
- Ejemplo (demo) con dos semanas distintas, a petición de Nando: Marcos libra 2 fines de semana, Lucía 1, Hugo de vacaciones
  las dos semanas (`js/demo-data.js`: patrón propio por semana). Aplicado también a los 6 días del ejemplo guardado en su
  navegador, sin tocar el resto (sus cambios, «Asuntos propios»…).
- Con clave real, del 2 al 15: «Marcos 2, Lucía 1, Hugo 0 (vacaciones, no cuenta), Iván 0 (baja)» y «turno partido: Ana 5,
  Sara 4, Carmen 4; seguido: Lucía 5, Marcos 3, Diego 5, Sara 1, Carmen 1, Iván 4»: **coincide con lo que cuenta la app**.
- Saludo con **chips** (idea de Nando): cuatro preguntas de ejemplo que se tocan y se mandan solas; sin clave abren Ajustes
  y dejan la pregunta escrita; desaparecen al mandar la primera; la papelera las devuelve. A 390 px, dentro de la ventana.
- **Color por defecto de un estado nuevo** = el primero de la paleta que no lleve ninguna persona ni otro estado (así no se
  repite lo de «Asuntos propios», naranja como Ana).
- Los chips, con el tono del tema (fondo 15 % y borde 55 % del color del tema) y un emoji delante (🕒 🌴 ✂️ 📋, por `data-icon`, así no
  forma parte de la pregunta que se manda). Nando: «mola mucho». Probado en claro y oscuro. Ojo: a la primera no se veía el color
  porque `button.secondary` pisaba el estilo; los chips ya no llevan esa clase.
- Pruebas 42 y 43; **controles** (uno a uno): ranking de sueltos que repite los completos, el color «siguiente por orden» y
  los chips que no desaparecen → falla justo cada uno. 43/43.

**Aprendido**
- Con la clave real, `gpt-oss-120b` dio error 400 dos veces seguidas y luego contestó bien: es intermitente (Groq al montar la
  llamada con herramientas). Se pasa al siguiente modelo y el motivo queda en `console.warn`.
- Las herramientas del navegador bloquean devolver textos con `?`, `=` o `&` que parecen un parámetro de dirección: para leer
  respuestas de Fervis hay que limpiarlas antes.

**Siguiente**
- Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — Fervis: las herramientas de la app calculan, el modelo solo las llama

**Hecho**
- Hallazgos de Nando con capturas: (1) «dime quién tiene turno seguido y quién partido» → «(sin respuesta)»; (2) con la
  pregunta de un solo asunto sí contestaba bien; (3) «este mes quién ha librado los fines de semana y cuántos» → «2 días
  libres» sin decir si eran días sueltos o fines de semana enteros, y miraba solo 2 semanas.
- Causa de (1), medida con la petición real: `finish: "length"`, 700 de salida y 0 de contenido: `gpt-oss` gasta el tope
  pensando. Arreglo: `max_tokens` 1500, `reasoning_effort: "low"` solo en gpt-oss, y una respuesta vacía **pasa al siguiente
  modelo** (nunca «(sin respuesta)»). Pero con poco razonamiento contaba mal (decía que Diego trabajaba lunes a viernes cuando
  libraba jueves y viernes).
- Nando: «la app o las funciones que tenemos son las que tendrían que pasar la info al modelo; además así quitamos gasto de
  tokens». **Rediseño:** el mensaje de datos baja a lo mínimo (personal, estados, sitios, quién trabaja ahora y las fechas de
  hoy, esta semana, la siguiente y este mes) y el modelo pide el resto con tres herramientas: `turnos_entre` (con filtro
  `persona`), `resumen_entre` (cuenta la app: partido, seguido, estados, **fines de semana completos** con su motivo y
  sábados o domingos sueltos; un día sin nada puesto no es libre) y `manual_app` (el manual sale del mensaje). Medido con
  clave real: entrada **1.035** (antes ~2.900, −65 %); «este mes» pide `resumen_entre` del 1 al 30; separa a Hugo (3 fines de
  semana completos, de vacaciones) de «algunos sábados sueltos».
- Un error 400 de Groq con `gpt-oss-120b` apareció una vez y no se repitió: se pasa al siguiente modelo, y ahora el motivo se
  guarda en la consola (`console.warn`).
- Pruebas 39–41: respuesta vacía → siguiente modelo y `reasoning_effort`; resumen contado por la app (completos frente a
  sueltos, período que acaba en sábado, filtro por persona sin tildes, persona inexistente, límites de 31 y 93 días,
  manual); mensaje pequeño. **Controles:** un día sin planificar como libre, y el filtro que no filtra → fallan justo esas.
  41/41.

**Decidido**
- «Sin nada puesto» (día sin planificar) no se cuenta como libre ni como fin de semana libre: se dice aparte.
- Fines de semana: SIEMPRE los completos y los sueltos por separado, con el motivo (libre, vacaciones, baja).

**Aprendido**
- Dos preguntas en una frase («seguido Y partido») obligan al modelo a pensar más. Mejor que la app dé los datos mascados.
- Un tope bajo de `max_tokens` en un modelo que razona deja respuestas vacías sin ningún error: hay que mirar `finish_reason`.

**Siguiente**
- Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — El robot de Fervis, a la barra de arriba

**Hecho**
- Idea de Nando: robot «entre los iconos de nombre y establecimiento» (la barra). Medido antes: hueco libre de 774 px en
  PC, 140 px en móvil con nombre normal, 23 px con nombre largo (aprieta). Primero junto al círculo de la persona;
  Nando lo vio («me gusta») y pidió **centrado en pantalla grande**, y en el móvil como estaba.
- Ahora: en la barra (`.topbar-right`, blanco sobre el color del tema, ya no el acento del tema); desde 900 px,
  `position: absolute` en el centro exacto (con `left`, no con `transform`: los movimientos del robot lo usan) y el
  nombre del local limitado al 50 % − 48 px para que se abrevie con «…»; por debajo de 900 px, junto a la persona. La ciudad
  también se abrevia con «…».
- Medido en 1707, 1100, 900, 899 y 390 px (con nombre largo en la mitad): el centro del robot coincide con el de la
  barra, sin solapes ni desbordes. Capturas en el escritorio. 38/38.
- Medir con nombre largo: primero escribí nombre y ciudad en el almacenamiento (el del origen real) y los borré; en las
  capturas de Nando el local salía siempre sin ciudad y con «David Planner», o sea sin valores previos. Después, para
  medir, se cambia el texto de la página, sin tocar el almacenamiento.

**Siguiente**
- Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — Saludo de Fervis

**Hecho / Decidido**
- Nando: «el asistente de los turnos suena a que no lo saques de ahí». Saludo: «Hola, soy Fervis, tu asistente personal.
  ¿En qué te puedo ayudar?» (`js/fervis.js` y sus dos pruebas). Lo que sabe y lo que hace no cambia: sigue contestando de lo
  general y de la app, y solo lee los turnos. 38/38.

## 10-nov-2026 — Paleta de colores de 10 a 20

**Hecho**
- Nando: «igual podríamos meter más opciones en la paleta de colores» (tras chocar el naranja de «Asuntos propios» con el
  de Ana). `PALETTE` (`js/demo-data.js`) pasa de 10 a 20: los 10 primeros no se mueven (Camarero 1–4 y lo guardado
  dependen del orden) y 10 nuevos al final (cian, lima, marrón, índigo, oliva, lila, verde oscuro, granate, azul acero,
  arena). Ninguno rosa ni fucsia (el fucsia es del aviso de horas extra).
- Prueba 38: 20 distintos y válidos, ninguno con tono rosa/fucsia (se calcula el tono), los cuatro primeros fijos, el
  selector de Personal los pinta todos. **Control:** un fucsia en la paleta → falla justo esa. Vista la ficha: 20 en 3
  filas. 38/38.

**Decidido**
- Sin cambiar el color por defecto de un estado nuevo (sigue siendo el siguiente de la paleta): Nando no lo pidió.

**Siguiente**
- Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — Decidido: «Baja» y «Dar de baja» se quedan como están

**Hecho / Decidido**
- Nando preguntó dónde estaba lo de cesar (con captura de Estados y de la ficha de Marcos Otero) y decidió: «una cosa es
  dar de baja y otra estar de baja». Estado «Baja» = baja médica; «Dar de baja desde el…» (Personal) = cesar desde la
  semana que se ve. **No se cambian los textos** (descartada la propuesta de «Cesar»). Punto 2 de «Para decidir» cerrado.
- Aclarado también que «Asuntos propios» (estado sin horario) llevaba su propio color, un naranja casi igual al de Ana
  (`#e67e22` frente a `#d35400`): no era un fallo. Sin hacer: que el color por defecto de un estado nuevo no coincida con el
  de ninguna persona (pendiente de que Nando diga que sí).

**Siguiente**
- Cuenta de Groq de David y probar en su móvil.

## 10-nov-2026 — Paso 13: «Copiar a…»

**Hecho**
- Idea de David (vía Nando): copiar un turno y pegarlo en casillas libres. Opción A elegida por Nando: botón
  «📋 Copiar a…» en la ventana de la casilla (solo con turno) y se tocan las casillas libres; **mismo aviso y mismo modo
  de elegir casilla que Intercambiar** (`swap.js`, modo `copy`), sin archivos nuevos. `Schedule.copyShift` copia estado,
  los dos tramos y el sitio, sin horas extra; nunca pisa lo ocupado; «Deshacer» quita la última; «Hecho» o Escape
  termina. El modo sobrevive al cambiar de semana (la casilla de origen está en `sessionStorage`).
- Pruebas 36 y 37. **Controles** (uno a uno, porque una prueba se para en el primer fallo): copiar las horas extra, pisar
  una ocupada y «Deshacer» que no quita → falla justo cada una. 37/37.
- A mano en Chrome (ejemplo): copiar el turno partido de Ana a dos casillas de una semana vacía (marzo de 2027) → 2 y 2
  tramos con su Pub; en la semana siguiente (ya llena) avisa «ya tiene algo»; deshecho y estado como antes.

**Decidido**
- La B (fila de días dentro de la ventana) se queda sin hacer: la A cubre más casos con un gesto que David ya conoce.

**Aprendido**
- `app.js` mezcla finales de línea CRLF y LF: para editarlo con scripts hay que tener cuidado con `
`.

**Siguiente**
- Cuenta de Groq de David y probar en su móvil (lista «Para decidir»).

## 10-nov-2026 — Arreglo: bordes del PDF

**Hecho**
- Nando: «cuando pasas a PDF no se ven los bordes» (captura de la tabla vacía de la primera vez: rayas muy claras y
  sueltas). Generado el PDF yo mismo (Chrome sin ventana `--print-to-pdf` + `pypdfium2` para verlo como imagen) con el
  ejemplo y con la tabla vacía: sin marco por fuera, rayas claras (#cfcfcf) y, en el ejemplo, **faltaban las rayas del
  nombre de Diego y de Sara** (con bordes unidos el PDF perdía rayas sueltas).
- Arreglo solo en `@media print` (`css/app.css`): rejilla propia con bordes separados (marco arriba/izquierda en la
  tabla y derecha/abajo en cada celda, #8f959c), sin «sticky» ni sombra en la columna de nombres (que dibujaba una raya
  doble). Verificado con los dos PDF: todas las rayas, marco por los cuatro lados, una hoja. 35/35.
- Nando: «¿estás seguro que se ha arreglado?» (PDF `David Planner.pdf` del escritorio, 15:38). Lo abrí: tenía todas las
  rayas y el marco, pero **a poco zoom** (como un visor normal, 842 × 595 px) las rayas finas se ven flojas y pueden
  perderse otra vez. Engrosadas a 0,4 mm y más oscuras (#6f757c); vistos de nuevo el del ejemplo y el vacío a 1× y a 4×.
  Lo que parecía una raya «doble» en la ampliación era una sola línea sólida (medido píxel a píxel).
- Nando, con otra captura: «en las celdas de lunes, martes, miércoles, jueves no tiene bordes» = las de la **cabecera
  azul** (sus rayas eran azul sobre azul, y la de debajo también). Medida su captura: sus rayas eran ya las del último
  arreglo (gris 111 = #6f757c). En impresión la cabecera lleva ahora las mismas rayas que el resto; vistos los PDF del
  ejemplo y el vacío. 37/37.
- Nando: «si no tienen impresora a color, ¿se vería bien en blanco y negro?» → PDF pasado a grises: textos legibles, cabecera
  gris oscuro, horas extra con borde oscuro y «+2 h extra»; se pierde el color por persona/estado (todas las casillas, el
  mismo gris claro). «Sí, arréglalo y deja copia en el escritorio en b/n»: rayas de 0,5 mm (#4f545a), contorno más
  marcado en cada casilla de turno (`color-mix` del tono con gris oscuro, solo en impresión) y **sin encabezado ni pie del
  navegador** (`@page { margin: 0 }` y el margen de 10 mm en el `body`: sin margen de página Chrome no tiene dónde
  ponerlos; comprobado generando el PDF SIN la opción que los oculta). Una hoja, ejemplo y vacío. Copia de prueba en b/n
  en el escritorio (`David Planner - blanco y negro (prueba).pdf`: es una imagen en grises, solo para verlo).
- Todo lo del PDF está dentro de `@media print`: la pantalla no cambia (comprobado en el diff).
- Nando: «intenta que en la impresión el azul sea más claro… pero sigue sin verse» (las divisiones de la cabecera: gris
  oscuro sobre el azul del tema no se distinguía). **Cabecera clara en papel** (#d9e6fb, letras #0f2a52; hoy, #aac6f3), el
  mismo azul sea cual sea el tema de la pantalla; las rayas se ven y se gasta menos tinta. Vista a 3×; copia en b/n del
  escritorio rehecha. 37/37.

**Decidido**
- Rayas más oscuras en papel que en pantalla: en pantalla acompañan el diseño; en papel son lo que separa a las personas.

**Aprendido**
- Con `border-collapse: collapse` las rayas finas de un PDF pueden desaparecer sueltas; con bordes separados no.
- Para ver un PDF sin poppler: `pypdfium2` (ya instalado) lo pasa a imagen.

**Siguiente**
- Paso 13: «Copiar a…» un turno a casillas libres (idea de David, vía Nando).

## 10-nov-2026 — Paso 12b: Fervis contesta

**Hecho**
- `js/fervis.js`: Groq con la clave de David; modelos `MODELS` filtrados por los que tiene la cuenta (`/models`, una vez por
  clave) y, si uno falla (429, 5xx), el siguiente; etiqueta `groq · modelo` debajo de cada respuesta («(respaldo)» solo
  si falló el primero disponible); `console.warn` con el motivo. El mensaje de sistema lleva un manual corto de la app y
  los datos como texto (personal, estados, puntos de venta, **quién trabaja ahora**, esta semana y la siguiente, avisos
  si no hay personal o turnos); otras fechas, con la herramienta `turnos_entre` (hasta 31 días). Solo lee.
- «Ahora» lo calcula la app (también el turno de ayer que cruza la medianoche). Historia de la conversación en memoria.
- Ajustes como en la cartera (idea de Nando): icono de tres barras que abre el panel de la clave; el chat no habla de la
  clave (sin ella, preguntar abre Ajustes y deja la pregunta escrita). Nota laboral orientativa en el pie.
- Papelera para empezar una conversación nueva (Nando, como la cartera; prueba 33, control: sin el olvido, la prueba
  falla). Saludo: «¿En qué te puedo ayudar?».
- Ventana del chat más grande (Nando, con un vídeo de su pantalla de 2560 px: con 480 px y la lista a media altura, el
  chat se quedaba «super justo»): `.fervis-dialog`, hasta 860 px de ancho y 92 % del alto, mensajes ocupando lo que sobra.
  Verificado en PC (860 × 735 en una ventana de 1707 × 799) y a 390 px (ventana 28–671, casilla dentro, sin
  desplazamiento lateral). Para ver el vídeo: `ffmpeg` saca un fotograma cada 4 s.
- Menú «Gestión» con más espacio **solo en el PC** (≥ 900 px; Nando, con una captura: columna estrecha y con barra de
  desplazamiento al abrir «Copia de seguridad»): 420 px de ancho, más margen y filas de 52 px, y los botones Descargar y
  Cargar lado a lado. Móvil sin cambios (menú de 260 px, botones de 48: medido). En una ventana de 799 px de alto aún
  desplaza 26 px con la copia abierta; en la de Nando (1126) cabe entera.
- Ayuda en la ventana de la casilla mientras no haya puntos de venta («Crea los puntos de venta en Gestión → Puntos de
  venta»): Nando preguntó dónde se añadían y «Dónde» no sale hasta crear el primero (7b), así que no se descubría solo.
  Prueba 35 con control. 35/35.
- Pruebas 30–34 (quién trabaja ahora, avisos, Groq de mentira con 429/401, solo modelos de la cuenta). **Controles:** turno
  de la medianoche, «ya no trabaja aquí» y salto de modelo (fallan justo esos); luego chat con aviso de clave y lista de
  modelos ignorada (fallan justo esos). Un primer control rompió el archivo (sed mal): no valía, rehecho. 33/33.
- **Con una clave real** (la de Nando, en el ejemplo con nombres inventados): quién trabaja ahora (Diego, 14:07 ✔),
  vacaciones (Hugo ✔), «lucia» sin tilde (jueves 10:00–18:00 ✔), baja (Iván desde el domingo ✔), charla general.

**Decidido**
- La clave y sus explicaciones, en Ajustes y no en el chat (Nando, como la cartera).
- Lo que Groq ofrece depende de la cuenta: `llama-3.3-70b-versatile` no está en la de Nando; antes salía «(respaldo)» en
  cada respuesta.

**Aprendido**
- Seis preguntas seguidas dan 429 (cada una manda el manual y dos semanas de turnos); una de vez en cuando, no. Sin medir
  aún con uso real. El modelo pequeño explicó mal el fijo discontinuo («tiempo completo»): por eso la nota del pie.
- El límite gratuito de Groq es por organización (cuenta), no por clave: la clave de David tiene que ser de SU cuenta.

**Siguiente**
- Probar con David en su móvil (cuenta propia con su correo; el enlace de acceso de Groq solo vale una vez y en el
  mismo navegador donde se pidió). Luego la lista «❓ Para decidir» de `PLAN.md`.

## 10-nov-2026 — Paso 12a: Fervis, la ventana y la clave

**Hecho**
- `js/fervis.js` (nuevo), ventana en `index.html`, estilos en `css/app.css`, `js/fervis.js` en `ESSENTIAL` de `sw.js`.
  Robot de `Crypto_Portafolio` (mismo dibujo y los 7 movimientos: pulso, hunde, gesto, bote, giro, asoma, balón; al azar,
  nunca el mismo dos veces; quieto con «reducir movimiento») en `--primary-text` de cada tema; al acabar el movimiento
  se abre el chat. Clave de Groq de David en `dp_groq_key` (limpieza al pegar de la cartera; se ve enmascarada
  `gsk_…1234`; campo de texto con puntos para que el navegador no la ofrezca guardar). Sin clave, lo dice y abre el
  campo. Con clave, por ahora contesta que las respuestas llegan en el 12b.
- Robot y «Gestión» en un mismo grupo (`.section-actions`): con el título largo del ejemplo, en 375 px «Gestión» bajaba
  solo; ahora bajan juntos. Con el título normal caben en una línea.
- Pruebas 28 y 29. **Controles reales**: (1) antes de apuntar `js/fervis.js` en `sw.js`, la prueba 27 lo señaló sola;
  (2) clave añadida a `SETTINGS` de `backup.js` y limpieza del `NOMBRE=` desactivada → fallan justo la 28 y la 29;
  devueltos los archivos (copias previas) → 29/29.
- Verificado en Chrome: robot en Claro, Lino, Oscuro y Carbón; ventana en PC y a 390 px (marco: la ventana de Chrome
  maximizada no se deja estrechar), sin desplazamiento lateral.

**Decidido**
- Clave de David, no de Nando, y sin servidor (Nando, como en la cartera). Solo lee. Los datos salen a Groq solo al
  preguntar (12b) y la ventana lo avisa: excepción apuntada en `CLAUDE.md` y en la especificación.
- No se trae el efecto de «el chat nace del robot» de la cartera: aquí la ventana es un `<dialog>` del navegador.

**Aprendido**
- Las herramientas de Chrome bloquean la salida si lleva algo con forma de clave (`gsk_…`), aunque sea inventada: para
  leer los fallos de las pruebas, sacar solo el título y el motivo.

**Siguiente**
- 12b: que conteste (manual corto de la app + datos de esta semana y la siguiente + una consulta para otras fechas;
  quién está en turno ahora lo calcula la app). Para probarlo de verdad, Nando pega su clave.

## 10-nov-2026 — Prueba 27: la lista de `sw.js`

**Hecho**
- Nota lateral: la lista `ESSENTIAL` de `sw.js` se escribe a mano y el service worker solo atiende lo que hay en ella.
  Un archivo nuevo sin apuntar → con internet todo va bien; sin internet, la app instalada se abre rota y nada avisa.
  Hoy no faltaba ninguno.
- Prueba 27 en `tests/tests.js`: los `link`/`script` de la página (sin los enlaces a otras webs) y los iconos del
  manifiesto tienen que estar en `ESSENTIAL`. Regla en `CLAUDE.md` («Pruebas automáticas») y [P] en la especificación.
- **Control**: quitado `js/pwa.js` de la lista → «faltan en ESSENTIAL de sw.js: … ["js/pwa.js"]», 1 de 27 en rojo;
  devuelto `sw.js` (copia previa) → 27/27.

**Decidido**
- Vigilarlo con una prueba y no con memoria (Nando): se pasa antes de cada commit, así el olvido no llega a GitHub.
  Lo que la página no carga no se mira: tampoco hace falta sin conexión.

**Aprendido**
- Una lista escrita a mano en dos sitios (la página y `sw.js`) se desincroniza sin ruido; una prueba que las compara
  convierte el olvido en un aviso rojo.

**Siguiente**
- La lista «❓ Para decidir» de `PLAN.md`.

## 10-nov-2026 — Paso 11: publicado y auditado

**Hecho**
- Publicado en GitHub Pages por Nando: `https://fvilpaz.github.io/david-planner/` responde con el último commit
  (comprobado: `pwa.js`, `sw.js`, manifiesto con `application/manifest+json`, iconos).
- `audit` (nando-toolkit), en primer plano, desde WSL, con `< /dev/null` (HALLAZGOS nº 11 y 2-nov). **Control antes**:
  copia del proyecto con `innerHTML = location.hash` → ESLint lo caza (error). Resultado real: git ✅, python
  (`servidor.py`) ✅, semgrep ✅, ESLint **25 avisos y 0 errores**.
- **Los 25 revisados a mano, todos falsos positivos:** `data.shifts[key]` (clave `persona|fecha` hecha por la app),
  `data[name]` (solo «employees», «statuses», «places»), `settings[key]` (lista fija `SETTINGS`), claves de un archivo
  cargado (solo se guardan con forma `persona|fecha` válida: un `__proto__` se descarta) y la regex de horas extra
  (anclada, limitada, campo de 5 letras). **Referencia: 25.** Si otra auditoría da más, el nuevo es el que se mira.
- `audit` creó `.gitignore` con `docs/audit-*` (el repo es público: el informe no se sube).

### Pruebas automáticas (Nando se fue a dormir: «dale a lo que te dé tiempo»)
- `tests/index.html` + `tests/tests.js` (26 pruebas) + `tests/tests.css`. Página en el navegador y no Node: la lógica
  vive en la página (DOM, `localStorage`, ventanas) y simularla obligaba a cambiar el código antes de tener tests.
  Cargan la app de verdad en un marco, con datos conocidos y semana fija (9 nov 2026).
- Cubren: fechas (lunes, imposibles, cambio de hora y de año, hora local), datos (arranque, ilegibles apartados,
  datos de antes sin `places`, `?demo` aparte), casilla (guardar y recargar, medianoche, inicio = fin, horas extra,
  Libre limpia, sin espacio no cambia nada, bajas), intercambiar (extras y sitio viajan, todo o nada), copiar semanas
  (vacías, sin extras, con sitio, varias semanas, bajas, semana vacía), Personal (borrar/baja, ordenar por número),
  Estados y Puntos de venta en uso, copia de seguridad (descargar, cargar con trampas incluida una clave
  `__proto__`, copias automáticas, franja) y la barra (iniciales, HTML como texto).
- Verificado: 26/26; **control**: rotas a propósito tres reglas (extras al copiar, revisión de horas al cargar,
  filtro de iniciales) → fallan exactamente esas 3 con su explicación; devuelto el código → 26/26. Un centinela en
  `dp_name` demuestra que la página devuelve los datos del navegador.
- Fallos míos cazados al repasar antes de lanzar: `obj.__proto__ = …` no crea una clave (cambia el prototipo) y
  los eventos se crean con el `Event` del marco.

### Arreglo: el hueco del turno partido (venía del paso 1)
- En una fila con turno partido, una casilla de un solo tramo («Libre») medía 40 px en una fila de 75. Arreglo de
  una línea: `.cell { min-height: 100% }` (antes 40 px). «min» y no «height»: gestion-hosteleria probó
  `td{height:1px}` + `height:100%` y en Firefox el 2.º tramo pisaba la fila de abajo; con `min-height`, en el peor
  caso la casilla crece con su contenido (no pisa nada). No se usa posición absoluta: la columna dejaría de
  ensancharse con el contenido.
- Verificado en Chrome: «Libre» de Ana pasa de 40 a 68 px (como sus turnos partidos), ninguna casilla se sale de su
  fila, filas normales iguales; PDF en una hoja sin huecos; 26/26 pruebas. **Firefox, sin probar** (no está en
  este PC): lo esperado es que se quede como antes, sin romperse.
- **No hecho:** juntar el esqueleto de las tres ventanas (refactor): pendiente de que Nando decida (PLAN, ❓ 3).

## 10-nov-2026 — Paso 10: instalable (PWA) y puerto propio

**Hecho**
- `manifest.webmanifest`, iconos «DP» blanco sobre azul (192, 512, maskable 512 y 180 de iPhone), `sw.js` (como
  health-tracker: red primero con tope de 3 s y `cache: "no-cache"`; caché de nombre fijo `david-planner-v1`; solo
  borra cachés `david-planner-`; **solo atiende sus propios archivos**) y `js/pwa.js` (registro y `storage.persist()`
  solo cuando ya hay datos).
- **Puerto propio 8731** (nota lateral + Nando): el service worker se había instalado en `localhost:8000`, el puerto
  del ERP; un service worker abarca toda la dirección. Dado de baja allí y cachés borradas. `servidor.py` en 8731 y
  sin `allow_reuse_address`.
- Verificado: 23 archivos guardados; `/api/v1/docs` y `/otra-cosa/` pasan sin guardarse; versión nueva simulada →
  borra sus cachés viejas y respeta una de «otra app»; **con el servidor apagado** la app abre con estilos, datos y
  otra semana; dos servidores en 8731 → el segundo avisa y para. `persist()`: el navegador no lo concede en una
  pestaña de prueba (sin instalar); queda por ver instalada.

**Decidido**
- Icono sin dibujo (Nando): solo «DP».
- Nombre de caché fijo: con la red primero, lo guardado se renueva solo; no hace falta el proceso de GitHub que usa
  health-tracker para cambiarlo en cada subida.

**Aprendido**
- **Un service worker abarca toda la dirección (origen)** y se queda instalado aunque se apague el servidor: nunca
  probarlo en un puerto que use otra app.
- **En Windows, `allow_reuse_address` deja a dos programas escuchar en el mismo puerto:** el control (arrancar un
  segundo servidor) lo destapó; sin el control, el «avisa si está ocupado» habría parecido funcionar.
- **Chrome sin ventana no hace ventanas pequeñas:** los iconos de 180 y 192 salieron rotos (letra gigante); se
  dibujan a 512 y se capturan a escala (`--force-device-scale-factor`). Se vio mirando las imágenes, no por el tamaño.
- **Una prueba que da de baja y registra el service worker en la misma página no lo reinstala** (recupera el que
  está «a medio irse»): la limpieza se prueba simulando una versión nueva.

**Siguiente**
- Paso 11: publicar en GitHub Pages, `audit` e instalar en el móvil (y ver si `persist()` se concede instalada).

## 10-nov-2026 — Paso 9b: copias automáticas y menú en el móvil

**Hecho**
- En `backup.js`: `autoCopy()` al abrir (si hay datos guardados y la última tiene 7 días o más; las 5 últimas en
  `dp_copias`), lista en «💾 Copia de seguridad» con «Recuperar» (doble toque; antes guarda lo de ahora como otra
  copia; la copia pasa el mismo filtro `clean()` que un archivo). Al cargar un archivo también se hace copia
  automática de lo de antes. Menú Gestión con alto máximo y desplazamiento por dentro.
- Verificado: sin datos no copia; al abrir con datos, 1; misma semana no repite; 8 días después, 2; con 5 viejas se
  queda en 5 (entra la de hoy); recuperar devuelve el turno y guarda lo de antes; copia estropeada → mensaje y nada
  cambia. Menú: cabe en 800×390, 390×700 y 1280×720 (primero se salía 3 px en horizontal: corregido). Nando: le
  gusta el fucsia en la franja de aviso.

**Aprendido**
- **Copiar el filtro, no la confianza:** una copia automática vive en el mismo navegador, pero podría venir de una
  versión anterior o estar a medias; pasa por el mismo `clean()` que un archivo de fuera.

**Siguiente**
- Paso 10: PWA (manifiesto, iconos, service worker sin conexión, `navigator.storage.persist()`).

## 10-nov-2026 — Paso 9a: descargar y cargar la copia, franja de aviso

**Hecho**
- `js/backup.js`: descargar (`david-planner-copia-AAAA-MM-DD.json`), cargar con revisión campo a campo
  (`clean()`: ids, nombres, colores, horas, estados y sitios que existan, horas extra 0,5–16; lo demás se descarta y
  se cuenta), confirmación con resumen, descarga previa `…antes-de-cargar-…` y recarga. Franja de aviso
  (`dp_last_export`, `dp_since`, «Más tarde» en `sessionStorage`). Apartado «💾 Copia de seguridad» en Gestión.
- Verificado (descargas interceptadas, sin tocar la carpeta de Descargas): sin datos y el primer día no hay franja;
  a los 10 días sí; descargar genera el archivo con todo y la quita; «Hace 9 días…» y «Más tarde» aguanta al recargar;
  no-JSON, copia de health-tracker y copia sin estados → mensaje claro; copia con 3 trampas → «se descartan 3 datos»;
  Cancelar no cambia nada; cargar descarga antes lo de ahora y sustituye. Consola limpia.
- La prueba de cargar cambió el nombre del local de Nando («Bar Importado»): devuelto a «Hotel Monarque».

**Decidido**
- Presupuesto de ~110 a ~170 líneas: la revisión del archivo es imprescindible (un archivo roto no puede romper el
  cuadrante; health-tracker se congeló con una fecha «0001-01-01»).
- La franja no sale la primera semana: pedir copia el primer día sería molestar.

**Aprendido**
- **Un archivo de fuera es dato no fiable:** se revisa todo antes de guardarlo y se copian solo los campos
  conocidos (así no se cuela nada que la app no espera).

**Siguiente**
- Paso 9b: copias automáticas y revisar el menú en el móvil.

## 10-nov-2026 — Paso 8: copiar la semana anterior

**Hecho**
- `copyPreviousWeek()` en `app.js` (regla de gestion-hosteleria/scheduling/week.py) y el apartado plegable
  «📋 Copiar la semana anterior» en Gestión: dice qué semana copia, número de semanas (1–8) y el resultado ahí mismo.
- Verificado con `?demo` (semana del 16): 2 semanas → 112 turnos; sin horas extra (Diego, sábado 21) y con su sitio;
  turno partido entero; repetir → «No había casillas vacías»; Lucía de baja desde el 23 no recibe turnos esa semana
  y Marcos sí; semana anterior vacía → aviso; sin espacio → aviso y nada copiado. Tecleando de verdad «3» → 168.

**Decidido**
- Todo o nada: si no se puede guardar, no se copia ninguna semana.

**Aprendido**
- **El mismo fallo en otra cajita:** un campo de 1 cifra con un «1» dentro no deja escribir otro número si no se
  selecciona al tocarlo (como el «13» del paso 6b). Lo vi en la captura antes de que llegara a Nando.

**Siguiente**
- Paso 9: copia de seguridad (exportar e importar JSON, copias automáticas y franja de aviso).

## 10-nov-2026 — Paso 7b: puntos de venta

**Hecho**
- `js/places.js` (ventana con la misma forma, solo nombre y orden), lista `places` en los datos, «Dónde» por tramo en
  la ventana de la casilla (oculto si no hay puntos), el nombre pequeño bajo la hora en el cuadrante y el PDF,
  `savePlaces()` y `placeUses()` en `app.js`. `storage.js` completa al cargar los datos de antes (sin `places`).
  Ejemplo (`?demo`) con Chiringuito, Cafetería y Pub.
- Verificado: datos con la forma de antes → se abren con su turno y `places: []`; sin puntos no sale «Dónde»; crear
  tres; turno partido con Chiringuito y Pub (guardado y leído para el lector de pantalla: «10:00–18:00 en
  Chiringuito, 20:00–02:00 en Pub»); en uso → sin «Quitar» y su explicación; renombrar se ve en la casilla; quitar
  uno sin usar; «Dónde: —» quita el sitio del tramo; móvil; PDF del ejemplo en una hoja. Consola limpia.

**Decidido**
- Un punto de venta en uso no se quita (sus tramos se quedarían sin sitio); renombrar sí.
- No se junta todavía el esqueleto de las tres ventanas (regla de tres cumplida, pero tocaría dos que funcionan):
  apuntado en «Aparcado».

**Aprendido**
- **Datos que crecen:** al añadir algo nuevo a los datos (aquí `places`), lo ya guardado no lo tiene. Se completa al
  cargar (`complete()` en `storage.js`) en vez de romper o borrar.

**Siguiente**
- Paso 8: copiar la semana anterior en 1–8 semanas.

## 10-nov-2026 — Paso 7: Estados

**Hecho**
- Primero, en commit aparte y sin cambiar nada: la lista ordenable (⠿ + número) y la paleta, sacadas de `staff.js` a
  `js/lists.js`; Personal probado otra vez con clics y teclas de verdad. Clases comunes `sort-list`, `sort-row`,
  `dialog-view`.
- `js/states.js` (ventana Estados con la misma forma), `saveList()` común en `app.js` (`saveEmployees` y
  `saveStatuses`) y `statusUses()`.
- Verificado: crear «Formación» con horario y usarla en una casilla; en uso → sin «Quitar», casilla de marcar
  bloqueada y la explicación; renombrar y recolorear sin tocar «cuenta como trabajo»; quitar uno sin usar con doble
  toque; nombre vacío; orden tecleando de verdad (Libre al 1) y el desplegable de la casilla lo sigue; sin espacio
  → aviso y nada cambia; consola limpia.

**Decidido**
- En uso tampoco se cambia «cuenta como trabajo»: si Trabajo dejara de contar, sus horarios dejarían de verse.
- Los estados con horario no enseñan paleta: su color no se ve (la casilla lleva el de la persona); antes la ficha
  decía «Color en el cuadrante» y engañaba.
- Ayuda en la lista: el primero es el de por defecto en una casilla vacía (lo vi al poner Libre la primera).

**Aprendido**
- **Mover antes de reutilizar, en un commit aparte:** sacar código común cambia archivos que ya funcionaban; se
  prueba de nuevo lo de antes y se sube solo, para que si algo falla se sepa si fue el movimiento o lo nuevo.

**Siguiente**
- Paso 7b: puntos de venta (texto pequeño bajo la hora; «Dónde» por tramo).

## 10-nov-2026 — Paso 6b: orden del personal (y servidor sin caché)

**Hecho**
- `servidor.py`: como `python -m http.server` pero con `Cache-Control: no-store` (tercera vez que Chrome usaba un CSS
  viejo: a Nando le salía la lista de Personal sin estilos y parecía que se había borrado algo).
- Orden en la misma ventana Personal (Nando: no como el «Ordenar» aparte de auryapp): cada tarjeta lleva el asa ⠿, el
  nombre y el número del puesto, en el hueco que sobraba a la derecha (idea de Nando). Arrastrar: la lógica de
  gestion-hosteleria (`setPointerCapture`, `elementFromPoint`). Se guarda al soltar o al escribir el número.
- Verificado: arrastrando **con el ratón de verdad** (Camarero 1 al 3.º), tecleando de verdad «1» + Intro (Camarero 2
  al 1.º; Intro no cierra ni abre la ficha), número fuera de rango (99 → al final), sin espacio → aviso visible y
  orden sin cambiar; el cuadrante sale en el orden. Consola limpia. **Sin probar: arrastrar con el dedo en un móvil
  de verdad** (la herramienta solo simula ratón).

- **Fallo que vio Nando:** al hacer clic en el número el cursor quedaba al principio; escribir «1» sobre «3» daba
  «13» (= último puesto) y, si ya era el último, no se movía nada. Mi prueba lo tapó porque seleccioné con triple
  clic. Arreglo: al tocar la cajita se selecciona el número entero (en `click`, no solo en `focus`: al soltar el
  ratón el navegador quitaba la selección) y máximo 2 cifras. Repetido con un clic normal: Camarero 3 → 1.
- Mecánica (pregunta de Nando): escribir un puesto **cuela** a la persona ahí y las demás bajan uno (no intercambia).

**Aprendido**
- **Probar como lo haría una persona, también el clic:** un triple clic en la prueba escondió un fallo real.
- **Un valor puesto por código no dispara `change`:** la primera prueba de «escribir un número» no hizo nada y
  parecía un fallo; tecleando de verdad funciona. Otra herramienta que miente: probar como lo haría una persona.

**Siguiente**
- Paso 7: Estados (crear, nombre, color, si cuenta como trabajo, orden; uno en uso no se borra).

## 10-nov-2026 — Paso 6a: Personal

**Hecho**
- `js/staff.js` (ventana Personal: lista y ficha con nombre y paleta), `PALETTE` y `STARTER_DATA` en `demo-data.js`,
  `storage.js` con modo ejemplo (`?demo` → `dp_demo_data`), en `app.js` nombres que se tocan, filtro de bajas,
  `saveEmployees()` (deshace si no se puede guardar), `hasShifts()` y enlaces de semana que conservan `?demo`.
- Verificado: arranque con Camarero 1–4 y casillas vacías; renombrar tocando el nombre (espacios de sobra limpios,
  color cambiado, guardado); nombre vacío → aviso; añadir desde Gestión; `<b>Pedro</b>` se ve como texto; quitar sin
  turnos pide segundo toque y borra; con turnos → «Dar de baja desde el 9 nov 2026», desaparece esta semana y sigue
  en la anterior con su turno; en la lista, atenuado «de baja desde…»; volver a dar de alta; sin espacio → nada
  cambia; `?demo`: 8 personas, «· ejemplo», datos reales intactos, sigue en ejemplo al pasar de semana. Móvil: lista
  y ficha bien. Consola limpia.

**Decidido**
- La primera vez, Camarero 1–4 (Nando): David ve la forma del cuadrante y solo cambia nombres.
- Quitar sin turnos = borrar del todo (no hay histórico); con turnos = baja desde la semana que se ve.
- El ejemplo, solo con `?demo` y en su propia clave: enseñar la app nunca toca los datos de verdad.
- Paso 6 partido en 6a (esto) y 6b (orden).

**Aprendido**
- **El foco solo se puede dar a algo visible:** `input.focus()` antes de `dialog.showModal()` no hace nada.

**Siguiente**
- Paso 6b: orden del personal (número y ⠿).

## 10-nov-2026 — Paso 5: «Intercambiar con…»

**Hecho**
- Botón «⇄ Intercambiar con…» en la ventana; `js/swap.js` (aviso abajo, casilla de origen con borde discontinuo,
  `dp_swap` en `sessionStorage` para cruzar semanas, «Deshacer» 8 s); `Schedule.swap()` cambia las dos casillas a la
  vez (si no se puede guardar, ninguna). Con una casilla vacía, el turno se mueve.
- Verificado: misma persona en dos días; dos personas el mismo día (turno partido); las horas extra viajan con el
  turno (con su motivo); mover a una vacía; cancelar con la misma casilla, Escape y el botón (y no se abre la
  ventana); Deshacer; navegador sin espacio → nada cambia; **entre semanas** (jueves 12 ↔ martes 3, recargando);
  móvil: aviso dentro de pantalla y botones de la ventana sin salirse. Consola limpia.

**Decidido**
- «Deshacer» (no pedido, pero 5 líneas): en el móvil es fácil tocar la casilla de al lado.
- Dos toques y no arrastrar (ya decidido): en el móvil arrastrar se confunde con desplazar.

**Aprendido**
- **`sessionStorage` vs `localStorage`:** el primero es solo de esta pestaña y se borra al cerrarla (ideal para
  algo «a medias», como el intercambio); el segundo se queda para siempre.

**Siguiente**
- Paso 6: Personal (decidir si la primera vez se abre vacía o con el ejemplo).

## 10-nov-2026 — Paso 4: horas extra

**Hecho**
- En la ventana: «Horas extra» y «Motivo» (solo con un estado que cuenta como trabajo). En la casilla: borde ámbar
  (`--warning`, en los 4 temas) y «+2 h extra»; el motivo en `title` y en la descripción para lectores de pantalla.
  Ejemplo inventado en los datos de prueba (Diego, sábado, +2 h «Cierre tarde»).
- Verificado: «1,5» → 1,5; «1.3» → 1,5 (medias horas); «16» vale; «0,2», «abc», «17» → aviso; vacío → sin extras;
  pasar a Libre las oculta y las borra; se ve en Claro y en Carbón; PDF real con el borde y el texto.

**Decidido**
- Puntos de venta (Nando): texto pequeño debajo de la hora, un «Dónde» por tramo, lista editable; paso 7b.
- Las horas extra van con el trabajo: un estado que no cuenta como trabajo no las lleva.

**Aprendido**
- **`type="number"` y la coma:** algunos navegadores no aceptan «1,5». Campo de texto con `inputmode="decimal"`
  (teclado numérico en el móvil) y se cambia la coma por punto al leerlo.

**Retoque (Nando eligió entre tres):** debajo de la hora / en vertical con la letra girada / **franja a la derecha
con la letra derecha («+2 h» / «extra») y su propio borde** ← la elegida. La fila no crece y en el móvil cabe; las
horas ya no se parten en dos líneas (`white-space: nowrap`: si no cabe, la columna se ensancha).

**Color del aviso:** el ámbar oscuro (`#b45309`) parecía marrón y, medido, se quedaba en contraste 4,2 sobre el
fondo de la franja (hace falta 4,5 para letra pequeña): fallo mío, no lo había medido. Comparadas en pantalla
naranja y fucsia; elegido **fucsia** (`#be185d` en claros, `#f472b6` en oscuros, contraste 4,5–4,9 medido en los 4
temas): no se confunde con los colores cálidos del personal (con naranja, el aviso se perdía sobre las horas de Ana).

**Siguiente**
- Paso 5: «Intercambiar con…» (dos toques).

## 10-nov-2026 — Paso 3: editar la casilla

**Hecho**
- `js/storage.js` (`dp_data`; la primera vez, los de ejemplo; si lo guardado no se puede leer, se aparta a
  `dp_data_broken` y no se pisa), `js/cell.js` (ventana: estado, uno o dos tramos, Guardar, Vaciar), casillas como
  botones en `app.js`, colores de error en los 4 temas (exactos de gestion-hosteleria).
- Verificado en Chrome: abrir; estado a Trabajo y el horario aparece, a Libre y se oculta al momento; sin horas,
  inicio = fin y segundo tramo a medias → error en castellano; 22:00–02:00 guardado y sigue al recargar; turno partido
  leído y quitado; Vaciar deja «+» y borra la casilla de los datos; casilla vacía abre con «Trabajo» y sin Vaciar;
  foco vuelve a la casilla al cerrar; móvil: editar el viernes no te devuelve al lunes (520 px antes y después);
  navegador sin espacio (simulado) → aviso y nada cambia; otra pestaña guarda → esta se pone al día; datos
  estropeados → apartados, cuadrante pintado, consola limpia.

**Decidido**
- Si el navegador no deja guardar, se deshace el cambio en pantalla: nunca se ve algo que desaparecería al recargar.
- Escuchar el evento `storage`: con la app abierta en dos sitios, la otra se pone al día y no pisa con datos viejos.

**Aprendido**
- **La caché del navegador engaña en local:** `python -m http.server` no dice «no guardes copia» y Chrome usó un
  `themes.css` viejo (sin `--error`): «Vaciar» salía sin rojo con el archivo bien en disco. Ctrl+F5 al probar; en
  Pages lo resolverá el service worker con caché por versión (paso 10).
- **El aviso `close` de un `<dialog>` llega un instante después de `close()`:** una prueba que mira en el mismo
  momento da un «falso fallo» (el foco sí volvía a la casilla). Una herramienta que falla puede parecer un fallo… o
  un «todo bien».

**Siguiente**
- Paso 4: horas extra en la casilla. Pendiente de Nando: puntos de venta (chiringuito, cafetería, pub).

## 10-nov-2026 — Paso 2: menú «Gestión», temas e imprimir

**Hecho**
- `js/theme.js` (tema en `dp_theme`, aplicado en el `<head>`), menú «Gestión» con Imprimir / PDF y Tema (4 fichas,
  plegado), cierre al tocar fuera o con Escape, CSS de impresión.
- Verificado: Carbón se aplica, se marca y se recuerda al recargar; el menú se cierra al tocar fuera; consola limpia.
  Impresión: PDF real con Chrome sin ventana (`--headless --print-to-pdf`): A4 apaisado, una hoja, en claro, sin
  barra ni botones. Con Carbón en pantalla, las reglas de impresión ponen el fondo en blanco.

**Decidido**
- Copias (paso 9): automáticas dentro del navegador como health-tracker **y** franja que no bloquea para descargar
  el archivo si hace 7 días o más. Sin dominio propio (Nando): el aviso y el archivo son la protección real.
- El tema va en su propia clave (`dp_theme`) y no dentro de los datos: es de cada aparato.

**Aprendido**
- **Copias automáticas ≠ copia de seguridad**: las de health-tracker viven en el mismo navegador (borradores en el
  mismo cajón); solo el archivo descargado sobrevive a «borrar datos del sitio» o a perder el móvil.
- **El tema se aplica en el `<head>`** para que no se vea un parpadeo del tema por defecto al cargar.
- Probar la impresión sin pulsar «Imprimir»: el cuadro del navegador bloquea la herramienta; Chrome sin ventana
  genera el PDF con las mismas reglas.

**Siguiente**
- Paso 3: editar la casilla.

### Paso 2b (mismo día): nombre editable y barra de la semana
- Lápiz ✏️ en la barra (idea de Nando): el nombre se guarda en `dp_name`; iniciales automáticas («Beach Club
  Marea» → BC), solo con letras y números (`\p{L}`, `\p{N}`); probado que `<b>…</b>` se ve como texto (no se cuela HTML).
- Barra de la semana (a Nando no le gustaba el campo de fecha blanco y la fecha repetida): el título es el botón que
  abre el calendario (`showPicker()`), «Hoy» solo fuera de esta semana, título con `Intl…formatRange`
  («9–15 nov 2026», «28 dic 2026 – 3 ene 2027»).
- **Aprendido:** `formatRange` del navegador junta solo lo que se repite (mes, año) en un rango de fechas.

### Paso 2c (mismo día): local, ciudad y persona en la barra
- Idea de Nando, como la barra de gestion-hosteleria: a la izquierda el local y debajo la **ciudad** («Cuadrante de
  turnos» sobraba con «Cuadrante semanal» debajo), con **un solo lápiz** para los dos; a la derecha la persona en un
  círculo con sus iniciales (👤 si no hay nombre). La lógica del lápiz es una pieza común (`editor()` en `brand.js`).
- Verificado: guardar, Escape, recargar, iniciales, móvil (solo el círculo, la barra no se sale), consola limpia.

## 10-nov-2026 — Paso 1: cuadrante de solo lectura

**Hecho**
- `index.html`, `css/themes.css` (Claro, Lino, Oscuro, Carbón), `css/app.css`, `js/dates.js`, `js/demo-data.js`
  (8 personas inventadas, esta semana y la anterior) y `js/app.js`. 375 líneas (previstas ~300: comentarios y
  `dates.js`, que no estaba previsto).
- Verificado en Chrome con `python -m http.server 8000`: PC, móvil vertical (390 px) y apaisado (800 × 390). Nombres
  fijos a la izquierda y fila de días fija arriba al deslizar en los dos sentidos; la página no se sale de lado;
  consola sin errores. Primer intento de prueba en móvil falló en silencio (la ventana no cambió de tamaño: seguía
  en 1707 px); repetido con marcos del tamaño de un móvil.

**Decidido**
- La caja del cuadrante tiene como alto máximo la pantalla y se desliza por dentro: así la fila de días sigue fija
  al bajar (en gestion-hosteleria la caja solo deslizaba de lado y eso no estaba asegurado).
- Un tramo llena la casilla con flexbox, sin el truco de posición absoluta de gestion-hosteleria.
- Prefijo `dp_` para todo lo guardado: `fvilpaz.github.io` lo comparten todas las apps de Pages (ver `CLAUDE.md`).

**Aprendido**
- **Las apps de un mismo dominio comparten el almacenamiento** (`localStorage` y cachés), aunque estén en carpetas
  distintas: el navegador separa por dominio, no por ruta. De ahí los prefijos y no usar nunca `localStorage.clear()`.
- **`append()` no devuelve nada; `appendChild()` devuelve el nodo añadido**: por eso solo el segundo se puede encadenar.
- **Fechas en hora local**: `toISOString()` da la fecha en UTC y, de madrugada en España, sería el día anterior.

**Siguiente**
- Paso 2: menú «Gestión» con Tema (los 4, se recuerda) e Imprimir / PDF (A4 apaisado, siempre en claro).

## 10-nov-2026 — Arranque

**Hecho**
- Analizado `gestion-hosteleria` para ver qué se puede traer: el turno depende de la persona (`Shift.employee`),
  y las dos cuelgan de `core`, que está atado a eventos, pedidos, planos… No se copia código: se trae la lógica.
- Repositorio `fvilpaz/david-planner` creado (público) y clonado en `D:\Fernando\Coding\projects\david-planner`.
- `CLAUDE.md` (decisiones), `PLAN.md` (pasos 0–10) y este diario.

**Decidido**
- Página estática + PWA, datos en el navegador y copia en JSON: David solo quiere sustituir el PDF de la pared;
  un servidor con base de datos sería mantener mucho para poco.
- PDF con la impresión del navegador (sin jsPDF ni PNG): el CSS de impresión de gestion-hosteleria ya funciona.
- Intercambiar en dos toques y no arrastrando: en el móvil arrastrar dentro de una tabla que se desliza se
  confunde con desplazar.
- Dar de baja en vez de borrar: el histórico de semanas se conserva.
- Estados editables desde el principio (Nando): dejarlos fijos solo aplazaba el trabajo, y la lógica ya está
  probada en gestion-hosteleria (color de persona o de estado, un estado en uso no se borra).
- Sin gist de sincronización por ahora (token en el aparato, gist secreto no es privado, mezclar cambios es difícil).

**Aprendido**
- **PWA vs TWA:** la PWA es la web instalable (manifiesto + service worker); la TWA es esa PWA envuelta para
  Google Play. Sin tienda, basta la PWA.
- **El service worker solo arranca en `https` o `localhost`**: por eso se prueba con `python -m http.server` y no
  abriendo el archivo con doble clic.

**Siguiente**
- Paso 1: cuadrante de solo lectura con datos inventados, nombres y cabecera fijos y el footer.
