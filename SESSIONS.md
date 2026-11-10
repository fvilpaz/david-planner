# SESSIONS — david-planner

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
