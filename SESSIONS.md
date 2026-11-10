# SESSIONS — david-planner

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
