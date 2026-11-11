# David Planner — especificación

Estado: **construida y verificada** (pasos 0–13, 10-nov-2026). Escrita al final, a partir de las decisiones de
`CLAUDE.md`, lo verificado en cada paso (`SESSIONS.md`) y las pruebas automáticas (`tests/tests.js`).
Las **decisiones y su porqué** están en `CLAUDE.md`; aquí, **qué tiene que pasar** y cómo se comprueba.

## Para qué
Sustituir el PDF de turnos colgado en la pared de un local de hostelería. Quien lleva el local (David) abre la app y
ve el cuadrante de la semana; toca una casilla para cambiarla; imprime o guarda en PDF. Sin servidor, sin cuentas:
los datos viven en el navegador del aparato y se guardan copias en un archivo.

## Reglas

**Cuadrante**
- Semana de lunes a domingo; se navega con ‹ ›, «Hoy» (solo fuera de esta semana) y tocando el título (calendario).
- Nombres fijos a la izquierda y fila de días fija arriba al deslizar, en móvil (vertical y apaisado), tablet y PC.
- Casilla: uno o dos tramos con su hora, o el nombre del estado. Con horario, el color de la persona; si no, el del
  estado. Debajo de cada hora, el punto de venta (si lo tiene). Horas extra: franja fucsia «+2 h / extra» a la derecha.
- Quien está de baja desde una semana no sale de esa semana en adelante; en las anteriores, sí.

**Casilla (ventana)**
- Estado; si cuenta como trabajo: inicio y fin (si el fin es menor, acaba al día siguiente), segundo tramo opcional,
  «Dónde» por tramo (solo si hay puntos de venta) y horas extra (0,5–16, con coma o punto, en medias horas) con motivo.
- Inicio = fin, horas vacías o extras fuera de rango → mensaje y no se guarda. Pasar a un estado sin horario borra
  horario y extras. Una casilla vacía se abre con el primer estado de la lista.
- «Intercambiar con…»: se toca otra casilla (cualquier persona y día, también en otra semana); se cambian las dos con
  sus extras y su sitio; con una vacía, el turno se mueve; «Deshacer» 8 s; se cancela con el botón, Escape o la misma
  casilla.
- «Copiar a…» (solo en una casilla con turno): se tocan las casillas **libres** (cualquier persona, día o semana) y cada
  una recibe el estado, los dos tramos y el sitio, **sin horas extra**; una casilla con algo no se pisa y lo dice; el
  aviso sigue hasta «Hecho» o Escape; «Deshacer» quita la última copia (no tras cambiar de semana). Sin espacio en el
  navegador, no copia y lo dice.

**Gestión**
- Imprimir / PDF: A4 apaisado, una hoja, siempre en colores claros, con «Turnos · local · semana». Rejilla con rayas
  de 0,5 mm, también en la cabecera, que sale clara con letras oscuras (siempre el mismo azul, sea cual sea el tema), contorno en cada casilla (en blanco y negro se lee igual; se pierde el color por
  persona) y **sin** encabezado ni pie del navegador (fecha, dirección, «1/1»).
- Copiar la semana anterior en 1–8 semanas: solo casillas vacías, sin horas extra, con su sitio, sin quien esté de
  baja en la semana de destino; todo o nada.
- Personal: la primera vez Camarero 1–4. Añadir, nombre, color (paleta de 20, sin rosa ni fucsia), orden (⠿ o número: la persona se
  cuela en ese puesto). Quitar: sin turnos se borra; con turnos, baja desde la semana que se ve; volver a dar de alta.
- Un estado nuevo nace con el primer color de la paleta que no lleva ninguna persona ni otro estado.
- Puntos de venta con color (paso 14a): un punto nuevo nace con el primer color de la paleta que no lleva ninguna persona, estado ni otro punto; los de antes, sin color, lo reciben al abrir. El color se cambia aunque el punto esté en uso (quitarlo, no).
- Clientes y camareros por día (paso 14b), con las mismas columnas que los días: debajo del cuadrante va una segunda tabla (la misma clase `.schedule-table`, así hereda estilo y temas), con un hueco pequeño entre las dos: su cabecera son los «Clientes previstos» (cajitas translúcidas dentro del azul que se ven editables) y debajo «Camareros» y «Clientes por camarero». Las dos tienen las mismas columnas por CSS (primera fija, días a partes iguales) y en el móvil se deslizan juntas. Los camareros se muestran en etiquetas como las de las casillas, con el color del punto de venta (gris «sin sitio»); los cuatro temas se aplican. «Clientes previstos» (número entero de 0 a 99999; vacío quita el dato; lo no válido se descarta y se ve lo guardado), «Camareros» (cuenta solo: cada persona con un estado que cuenta como trabajo y algún tramo, UNA vez en el total y una vez por cada sitio donde trabaja ese día; no cuentan libres, vacaciones ni quien está de baja esa semana) y «Clientes por camarero» (clientes ÷ camareros: verde hasta el ideal, naranja hasta un 25 % más, rojo por encima; clientes sin camareros = rojo; «—» si no hay clientes). El ideal se escribe bajo el título de la fila, «Verde hasta [20]» (1–999, 20 por defecto; lo fija cada local: no es lo mismo un restaurante que un bufé o una barra), y debajo se lee «naranja hasta 25 · rojo más», recalculado al cambiarlo. Más clientes por camarero = más rojo. Al escribir un número válido en los clientes o en el ideal, se guarda y los colores cambian al momento; vaciar el campo solo quita el dato al salir de él. Los clientes van por FECHA (no por persona), entran en la copia de seguridad y «Copiar semana» no los copia.
- «Colorear por» (Gestión; solo con puntos de venta): Persona (por defecto) o Punto de venta; con el segundo, cada tramo con sitio toma el color del sitio, el que no lo tiene el de la persona, y los estados (Libre, Vacaciones, Baja…) conservan el suyo. Por aparato, en `dp_color_by`; va en la copia de seguridad.
- Estados y Puntos de venta: crear, renombrar, ordenar. En uso no se quitan; un estado en uso tampoco cambia «cuenta
  como trabajo». Los estados con horario no enseñan paleta (su color no se ve).
- Tema: Claro, Lino, Oscuro, Carbón; por aparato.
- Copia de seguridad: descargar `.json`; cargar revisando todo (lo ilegible se descarta y se cuenta), con
  confirmación y descarga previa de lo de antes; copias automáticas (una por semana, 5, con «Recuperar»); franja de
  aviso a los 7 días sin copia (no la primera semana ni en el ejemplo), con «Más tarde».

**Barra**: local y ciudad (un lápiz) y persona (círculo); iniciales automáticas solo con letras y números.

**Fervis** (pasos 12a–12c). Solo lee los turnos: no cambia nada.
- *Robot y ventana:* el robot va en la barra de arriba (blanco; centrado desde 900 px de ancho y junto al círculo de la
  persona en pantallas menores; el nombre del local se abrevia con «…» antes de llegar a él). Al tocarlo hace un
  movimiento al azar (nunca el mismo dos veces seguidas; quieto con «reducir movimiento») y abre el chat. Ventana grande
  (hasta 860 px de ancho y el 92 % del alto). En la cabecera: «📖 Guía» (con su nombre escrito), Ajustes (tres barras),
  papelera y Cerrar; en el móvil la cabecera pasa a dos filas.
- *Saludo y chips:* «¡Hola! Soy Fervis, tu asistente personal. Estoy aquí para ayudarte. Puedes escribirme tu consulta
  directamente aquí abajo o, si no sabes por dónde empezar, pulsar el botón «📖 Guía» de arriba.» Debajo, chips con el
  tono del tema y su emoji: 🕒 «¿Quién trabaja hoy?», 🌴 «¿Quién libra este fin de semana?», ✂️ «¿Quién tiene turno
  partido y quién seguido esta semana?», 📋 «¿Cómo copio un turno?» y 📖 «Guía de la app». Se tocan y se mandan solos;
  desaparecen al mandar la primera pregunta y la papelera los devuelve.
- *Clave de Groq:* vive en Ajustes, nunca en la conversación. Sin clave, el chat solo saluda y preguntar abre Ajustes
  dejando la pregunta escrita. La clave pegada de un `.env` se limpia; lo que no parece una clave no se guarda;
  «Quitar la clave» la borra; nunca va en la copia de seguridad.
- *Qué contesta:* de lo general (lo laboral, orientativo: nota en el pie) y de la app. Recibe un mensaje pequeño
  (personal, estados, puntos de venta, quién trabaja ahora y las fechas de hoy, esta semana, la siguiente y el mes) y
  **pide lo demás a funciones de la app**, que le dan la respuesta ya calculada: `turnos_entre` (día a día, hasta 31
  días, de todos o de una persona), `clientes_entre` (paso 14b: por día, hasta 31, los clientes previstos, los camareros con sus sitios y los clientes por camarero con su aviso; los datos salen a Groq solo al preguntar por ellos, como los turnos), `resumen_entre` (por persona, hasta 93 días: días de turno partido, seguido y de
  cada estado; **fines de semana completos** sin trabajar, con su motivo, aparte de los sábados o domingos sueltos; un
  RANKING ya hecho para «quién tiene más…»; un día sin nada puesto no cuenta como libre) y `manual_app` (la guía, por
  temas). Así gasta ~65 % menos de entrada y no cuenta a ojo. Para «cómo se hace…», la app le pone delante los 2 temas
  de la guía que más coinciden con la pregunta y le prohíbe decir que algo «no se puede» sin comprobarlo; al explicar
  cómo se hace algo, termina remitiendo al glosario, y si piden «la guía» en general, remite al 📖. Reconoce a las
  personas sin tildes ni mayúsculas; sin personal o sin turnos, lo dice.
- *Modelos:* solo los que tiene la cuenta (`/models`); debajo de cada respuesta, `groq · modelo` (y «(respaldo)» si el
  primero falló); una respuesta vacía o un error pasan al siguiente modelo, nunca sale «(sin respuesta)». La papelera
  borra la conversación (y lo que Fervis recuerda de ella; la clave no se toca) y no hace nada con una respuesta en marcha.
- *Guía de la app (glosario):* con el botón «📖 Guía» o el chip, una vista aparte (no el chat): no añade burbujas, no
  llama a Groq y **no necesita clave**; el 📖 alterna con el chat. Tres grupos (Turnos y casillas, Menú Gestión, Mi
  local la app y Fervis) que se despliegan en sus temas, y estos en sus pasos. Cada fila es una tarjeta (círculo con el
  emoji, título y subtítulo: «5 temas», «6 pasos») con el triangulito ▼ suelto a su derecha; acordeón (al abrir uno se
  pliegan los demás); los temas cuelgan de su grupo con sangría y línea guía, con hueco entre filas. Arriba,
  **«🖨️ Descargar guía (PDF)»**: una hoja con todos los temas abiertos, el nombre del local arriba y la dirección de la
  app abajo; A4 vertical, a dos columnas, unas 2 hojas, sin encabezado ni pie del navegador. Todo sale de los mismos
  textos (`GUIDE`); una prueba exige que cada botón del menú Gestión y de la ventana de la casilla salga en la guía.

**App instalable**: abre sin conexión; se actualiza sola con conexión; solo atiende y borra lo suyo.

## Criterios de aceptación
**[P]** = prueba automática en `tests/tests.js` · **[M]** = verificado a mano en el navegador (`SESSIONS.md`).

- [P] Lunes de la semana, fechas imposibles, cambio de hora y de año, fecha local a las 00:30.
- [P] Primera vez: Camarero 1–4 y nada guardado. [P] Datos ilegibles apartados, no pisados. [P] Datos de antes sin
  puntos de venta se abren. [P] `?demo` no toca los datos de verdad.
- [P] Guardar y recargar. [P] 22:00–02:00 vale; inicio = fin y sin horas, no. [P] Horas extra válidas e inválidas.
  [P] Libre limpia. [P] Sin espacio en el navegador no cambia nada. [P] Bajas por semana.
- [P] Copiar a…: tramos y sitio sin extras, no pisa, Deshacer, Hecho, sin espacio. [M] Entre semanas (turno partido a
  una semana vacía).
- [P] Intercambiar mueve extras y sitio; todo o nada. [M] Entre semanas, Deshacer, cancelar, aviso en el móvil.
- [P] Copiar semanas (vacías, sin extras, con sitio, varias, bajas, semana vacía). [M] Tecleando el número.
- [P] Personal: borrar sin turnos / baja con turnos; ordenar por número. [M] Arrastrar ⠿ con ratón.
- [P] Estado y punto de venta en uso. [M] Paleta oculta con horario.
- [P] Descargar; cargar (no JSON, otra app, sin estados, trampas con `__proto__`); copias automáticas; franja.
- [P] Iniciales y nombres como texto (no HTML).
- [M] Nombres y días fijos al deslizar (390 px, 800×390, PC). [M] PDF en una hoja (Claro y Carbón en pantalla).
- [P] Fervis: quién trabaja ahora (también turnos que cruzan la medianoche), vacaciones, bajas; avisos sin personal o sin
  turnos; con un Groq de mentira: datos y clave en la petición, consulta de otras fechas, 429 → siguiente modelo con su
  etiqueta, 401 → aviso, solo modelos de la cuenta. [M] Con una clave real (10-nov): personas sin tildes, vacaciones,
  baja, charla general; tamaño de la ventana en PC (vídeo de Nando) y a 390 px. **Sin comprobar:** cuánto aguanta el límite gratuito con uso diario real.
- [P] Fervis: el robot se mueve y luego abre; el chat no habla de la clave (va en Ajustes); clave limpia, rechazada y
  quitada. [P] La clave no sale en la
  copia descargada ni en las automáticas. [M] Robot en los 4 temas; 390 px (robot y «Gestión» juntos, sin desplazar).
- [P] Todo lo que pide la página y los iconos del manifiesto están en la lista `ESSENTIAL` de `sw.js`.
- [M] Sin conexión con el servidor apagado; versión nueva borra solo cachés propias; lo ajeno no se guarda.
- [M] Contraste de las horas extra ≥ 4,5 en los 4 temas.
- [M] Arrastrar ⠿ con el dedo en un móvil real (Nando, 10-nov: funciona, y «prácticamente todo» lo demás).
- **Sin confirmar al detalle:** el calendario del título (es del navegador); `navigator.storage.persist()` con la app
  instalada.

## Datos
En `localStorage` con prefijo `dp_` (el dominio `fvilpaz.github.io` lo comparten varias apps):
`dp_data` (personas, estados, puntos de venta y turnos; forma en `PLAN.md`), `dp_name`, `dp_city`, `dp_person`,
`dp_theme`, `dp_color_by`, `dp_copias`, `dp_last_export`, `dp_since`, `dp_groq_key` (la clave de Fervis: nunca en la copia); `dp_demo_data` para `?demo`; en `sessionStorage`, `dp_swap` y
`dp_backup_later`. Nunca `localStorage.clear()`.

## Seguridad y privacidad
- Ningún dato sale del aparato salvo el archivo que descarga David y, si pone su clave de Groq, lo que Fervis mande a
  Groq para contestar (paso 12b; la ventana lo avisa). Repositorio público: solo código y datos inventados.
- Todo se pinta con `textContent` (nunca `innerHTML`): un nombre con HTML se ve como texto.
- Un archivo cargado se revisa campo a campo y solo se copian los campos conocidos.
- Sin librerías de fuera. `audit` (nando-toolkit), 10-nov tras Fervis, con control antes (un `innerHTML` metido a
  propósito → error): git (sin secretos, tampoco en el historial), python y semgrep limpios; ESLint 0 errores y 40
  avisos, revisados uno a uno: 39 falsos positivos (claves `persona|fecha` hechas por la app, constantes fijas, claves
  `dp_` en las pruebas) y 1 fallo pequeño de verdad (el recuento por estado de Fervis usaba un objeto normal: un estado
  llamado «constructor» o «__proto__» se perdería del recuento). **Referencia: 40.** Solo se conecta a `api.groq.com`.

## Qué queda fuera
Ver «💡 Aparcado» en `PLAN.md`: sincronizar entre aparatos, total de extras del mes, horarios rápidos, arrastrar para
intercambiar en PC, PNG/compartir, color propio por turno, juntar el esqueleto de las tres ventanas.
