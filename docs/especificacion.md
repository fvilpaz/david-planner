# David Planner — especificación

Estado: **construida y verificada** (pasos 0–12, 10-nov-2026). Escrita al final, a partir de las decisiones de
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
- Estados y Puntos de venta: crear, renombrar, ordenar. En uso no se quitan; un estado en uso tampoco cambia «cuenta
  como trabajo». Los estados con horario no enseñan paleta (su color no se ve).
- Tema: Claro, Lino, Oscuro, Carbón; por aparato.
- Copia de seguridad: descargar `.json`; cargar revisando todo (lo ilegible se descarta y se cuenta), con
  confirmación y descarga previa de lo de antes; copias automáticas (una por semana, 5, con «Recuperar»); franja de
  aviso a los 7 días sin copia (no la primera semana ni en el ejemplo), con «Más tarde».

**Barra**: local y ciudad (un lápiz) y persona (círculo); iniciales automáticas solo con letras y números.

**Fervis** (paso 12): el robot, en la barra de arriba (blanco; centrado desde 900 px de ancho, y junto al círculo de la
persona en pantallas menores; el nombre del local se abrevia con «…» antes de llegar a él), hace un movimiento al azar, nunca el mismo dos veces seguidas (quieto
con «reducir movimiento») y abre el chat. Sin clave, lo dice y abre el campo; la clave pegada de un `.env` se limpia;
lo que no parece una clave no se guarda; «Quitar la clave» la borra. Lo de la clave vive en Ajustes (icono de tres
barras): el chat solo saluda, y preguntar sin clave abre Ajustes y deja la pregunta escrita. Contesta de lo general y
de la app. Recibe un mensaje pequeño (personal, estados, puntos de venta, quién trabaja ahora, las fechas de hoy, de
esta semana, la siguiente y el mes) y **pide lo demás a funciones de la app**, que le dan la respuesta ya calculada:
`turnos_entre` (turnos día a día, hasta 31 días, de todos o de una persona), `resumen_entre` (por persona y hasta 93
días: días de turno partido, seguido y de cada estado; **fines de semana completos** sin trabajar, con su motivo, aparte
de los sábados o domingos sueltos; un día sin nada puesto no cuenta como libre) y `manual_app` (cómo se usa la app).
Así gasta ~65 % menos de entrada y no cuenta a ojo; reconoce a las personas sin tildes ni mayúsculas; sin personal o sin
turnos, lo dice. Usa solo los modelos que tiene la cuenta; debajo de cada respuesta, `groq · modelo` (y «(respaldo)»
si el primero falló). Lo laboral es orientativo (nota en el pie). La papelera borra la conversación (y lo que Fervis recuerda de ella;
la clave no se toca) y no hace nada con una respuesta en marcha. Saluda con «Hola, soy Fervis, tu asistente personal. ¿En qué te puedo ayudar?» (no «de los turnos»: suena a que
no sirve para nada más) y debajo cuatro **chips** con preguntas de ejemplo que se tocan y se mandan solas (sin clave,
abren Ajustes y dejan la pregunta escrita); desaparecen al mandar la primera y la papelera las devuelve. Para «quién
tiene más…», `resumen_entre` trae un RANKING ya hecho por la app con el motivo (vacaciones o baja no es librar). La ventana es grande (hasta 860 px de ancho y el 92 % del alto), con los
mensajes ocupando lo que sobra. **Guía de la app como glosario** (botón 📖 de la cabecera y chip «Guía de la app» del saludo): una vista aparte, no el chat, con 3 grupos
(Turnos y casillas, Menú Gestión, Mi local la app y Fervis) que se despliegan en sus temas y estos en sus pasos. No añade
burbujas, no llama a Groq y **no necesita clave**; el 📖 alterna con el chat. El modelo la consulta por temas con `manual_app`
para los «cómo hago…» y, si piden «la guía» en general, remite al 📖. Una prueba exige que cada botón del menú Gestión y de la
ventana de la casilla salga en la guía. Solo lee los turnos.

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
`dp_theme`, `dp_copias`, `dp_last_export`, `dp_since`, `dp_groq_key` (la clave de Fervis: nunca en la copia); `dp_demo_data` para `?demo`; en `sessionStorage`, `dp_swap` y
`dp_backup_later`. Nunca `localStorage.clear()`.

## Seguridad y privacidad
- Ningún dato sale del aparato salvo el archivo que descarga David y, si pone su clave de Groq, lo que Fervis mande a
  Groq para contestar (paso 12b; la ventana lo avisa). Repositorio público: solo código y datos inventados.
- Todo se pinta con `textContent` (nunca `innerHTML`): un nombre con HTML se ve como texto.
- Un archivo cargado se revisa campo a campo y solo se copian los campos conocidos.
- Sin librerías de fuera. `audit` (nando-toolkit): git, python y semgrep limpios; 25 avisos de ESLint revisados,
  falsos positivos (referencia: 25).

## Qué queda fuera
Ver «💡 Aparcado» en `PLAN.md`: sincronizar entre aparatos, total de extras del mes, horarios rápidos, arrastrar para
intercambiar en PC, PNG/compartir, color propio por turno, juntar el esqueleto de las tres ventanas.
