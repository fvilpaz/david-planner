# David Planner — especificación

Estado: **construida y verificada** (pasos 0–11, 10-nov-2026). Escrita al final, a partir de las decisiones de
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

**Gestión**
- Imprimir / PDF: A4 apaisado, una hoja, siempre en colores claros, con «Turnos · local · semana».
- Copiar la semana anterior en 1–8 semanas: solo casillas vacías, sin horas extra, con su sitio, sin quien esté de
  baja en la semana de destino; todo o nada.
- Personal: la primera vez Camarero 1–4. Añadir, nombre, color (paleta sin fucsia), orden (⠿ o número: la persona se
  cuela en ese puesto). Quitar: sin turnos se borra; con turnos, baja desde la semana que se ve; volver a dar de alta.
- Estados y Puntos de venta: crear, renombrar, ordenar. En uso no se quitan; un estado en uso tampoco cambia «cuenta
  como trabajo». Los estados con horario no enseñan paleta (su color no se ve).
- Tema: Claro, Lino, Oscuro, Carbón; por aparato.
- Copia de seguridad: descargar `.json`; cargar revisando todo (lo ilegible se descarta y se cuenta), con
  confirmación y descarga previa de lo de antes; copias automáticas (una por semana, 5, con «Recuperar»); franja de
  aviso a los 7 días sin copia (no la primera semana ni en el ejemplo), con «Más tarde».

**Barra**: local y ciudad (un lápiz) y persona (círculo); iniciales automáticas solo con letras y números.

**App instalable**: abre sin conexión; se actualiza sola con conexión; solo atiende y borra lo suyo.

## Criterios de aceptación
**[P]** = prueba automática en `tests/tests.js` · **[M]** = verificado a mano en el navegador (`SESSIONS.md`).

- [P] Lunes de la semana, fechas imposibles, cambio de hora y de año, fecha local a las 00:30.
- [P] Primera vez: Camarero 1–4 y nada guardado. [P] Datos ilegibles apartados, no pisados. [P] Datos de antes sin
  puntos de venta se abren. [P] `?demo` no toca los datos de verdad.
- [P] Guardar y recargar. [P] 22:00–02:00 vale; inicio = fin y sin horas, no. [P] Horas extra válidas e inválidas.
  [P] Libre limpia. [P] Sin espacio en el navegador no cambia nada. [P] Bajas por semana.
- [P] Intercambiar mueve extras y sitio; todo o nada. [M] Entre semanas, Deshacer, cancelar, aviso en el móvil.
- [P] Copiar semanas (vacías, sin extras, con sitio, varias, bajas, semana vacía). [M] Tecleando el número.
- [P] Personal: borrar sin turnos / baja con turnos; ordenar por número. [M] Arrastrar ⠿ con ratón.
- [P] Estado y punto de venta en uso. [M] Paleta oculta con horario.
- [P] Descargar; cargar (no JSON, otra app, sin estados, trampas con `__proto__`); copias automáticas; franja.
- [P] Iniciales y nombres como texto (no HTML).
- [M] Nombres y días fijos al deslizar (390 px, 800×390, PC). [M] PDF en una hoja (Claro y Carbón en pantalla).
- [P] Todo lo que pide la página y los iconos del manifiesto están en la lista `ESSENTIAL` de `sw.js`.
- [M] Sin conexión con el servidor apagado; versión nueva borra solo cachés propias; lo ajeno no se guarda.
- [M] Contraste de las horas extra ≥ 4,5 en los 4 temas.
- **Sin comprobar:** arrastrar ⠿ con el dedo en un móvil real; el calendario del título (es del navegador);
  `navigator.storage.persist()` con la app instalada.

## Datos
En `localStorage` con prefijo `dp_` (el dominio `fvilpaz.github.io` lo comparten varias apps):
`dp_data` (personas, estados, puntos de venta y turnos; forma en `PLAN.md`), `dp_name`, `dp_city`, `dp_person`,
`dp_theme`, `dp_copias`, `dp_last_export`, `dp_since`; `dp_demo_data` para `?demo`; en `sessionStorage`, `dp_swap` y
`dp_backup_later`. Nunca `localStorage.clear()`.

## Seguridad y privacidad
- Ningún dato sale del aparato salvo el archivo que descarga David. Repositorio público: solo código y datos inventados.
- Todo se pinta con `textContent` (nunca `innerHTML`): un nombre con HTML se ve como texto.
- Un archivo cargado se revisa campo a campo y solo se copian los campos conocidos.
- Sin librerías de fuera. `audit` (nando-toolkit): git, python y semgrep limpios; 25 avisos de ESLint revisados,
  falsos positivos (referencia: 25).

## Qué queda fuera
Ver «💡 Aparcado» en `PLAN.md`: sincronizar entre aparatos, total de extras del mes, horarios rápidos, arrastrar para
intercambiar en PC, PNG/compartir, color propio por turno, juntar el esqueleto de las tres ventanas.
