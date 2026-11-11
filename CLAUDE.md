# david-planner — cuadrante de turnos

> Si eres una IA que abre este proyecto: lee este archivo, `PLAN.md` y la última entrada de `SESSIONS.md`
> antes de nada. Las reglas generales de Nando (5 Tatuajes, metodología) están en `~/Nando.md` y `~/Metodologia.md`.

## Qué es
Un cuadrante de turnos semanal para un local de hostelería (lo usará David). **Sustituye al PDF colgado en la
pared**: se abre y se ve el cuadrante, se toca una casilla para cambiarla y se imprime o se guarda en PDF.
Nada más. Sin servidor, sin cuentas y sin base de datos: los datos viven en el navegador del aparato de David.
Con un añadido opcional: **Fervis**, un chat que contesta sobre los turnos con la clave de Groq que David ponga (paso 12).

Origen: las reglas del cuadrante (turnos que cruzan la medianoche, turno partido, copiar semanas, nombres fijos,
impresión A4) están probadas en `gestion-hosteleria` (WSL: `~/code/github/gestion-hosteleria`, app `scheduling`
y `core/static/core/app.css`). **Se trae la lógica, no el código**: allí es Django y aquí es JavaScript sin servidor.

## Decisiones que NO se tocan (Nando, 10-nov-2026)
| Tema | Decisión |
|---|---|
| Tipo de app | Página estática (HTML + CSS + JS), **PWA instalable**. Sin TWA (solo haría falta para Google Play). |
| Dónde vive | Primero en local (`python servidor.py` → `localhost:8731`); después **GitHub Pages** (repositorio público `fvilpaz/david-planner`). |
| Datos | Solo en el aparato (`localStorage`). En el repositorio **nunca** hay datos reales: solo datos de ejemplo inventados. |
| Almacenamiento compartido | `fvilpaz.github.io` es **un solo dominio** para todas las apps de Pages (health-tracker, nplayer, MasterMind…): comparten `localStorage` y cachés. Por eso: **todas las claves con el prefijo `dp_`** (como `ht_` y `np_`), **nunca `localStorage.clear()`**, cachés con el prefijo `david-planner-` y el service worker **solo borra sus propias cachés** (como `health-tracker/src/sw.js`). Lo mismo pasa en `localhost:8000` con otros proyectos. |
| Copia | Exportar e importar **JSON** (con número de versión del formato). Importar = sustituir todo, con confirmación y copia previa automática. |
| Sincronizar | **No.** El gist queda en «Aparcado» (token en el aparato, gist secreto ≠ privado, mezcla de cambios difícil). |
| Pantalla | Abre directamente en el cuadrante. Una sola pantalla; lo demás en ventanas encima. Móvil, tablet y PC, vertical y apaisado. |
| Cuadrante | Lunes a domingo. Nombres **fijos a la izquierda** y cabecera de días fija (sticky). Hoy, en un tono más oscuro. Sin columna de horas. |
| Navegar | ‹ **Hoy** › y un selector de fecha para ir a cualquier semana (el histórico se conserva). |
| Casilla | Tocar → estado, horario (inicio–fin; si el fin es menor, acaba al día siguiente), **segundo tramo** (turno partido), horas extra, vaciar. |
| Estados | **Editables** (como `gestion-hosteleria`): nombre, color, si cuenta como trabajo y orden. Al empezar: Trabajo, Libre, Vacaciones, Baja. Un estado **en uso** no se puede quitar **ni cambiar si cuenta como trabajo** (sus horarios dejarían de verse). Color de la casilla: si cuenta como trabajo, el de la persona (por eso su ficha no enseña paleta); si no, el del estado. **El primero de la lista es el que sale en una casilla vacía.** |
| Copiar a… (paso 13) | Idea de David. En la ventana de una casilla **con turno**, «📋 Copiar a…» y se tocan las casillas **libres** (el mismo aviso de abajo que Intercambiar, que sigue hasta «Hecho»): copia estado, los dos tramos y el sitio, **sin horas extra** (como copiar semanas); **nunca pisa** una casilla con algo; «Deshacer» quita la última. Funciona entre semanas. Todo en `swap.js` (modo `copy`) y `Schedule.copyShift`. |
| Intercambiar | «Intercambiar con…» y tocar otra casilla: misma persona en dos días, dos personas el mismo día o cualquier combinación. Dos toques, no arrastrar (se confunde con desplazar en el móvil). |
| Horas extra | Número y motivo opcional en la casilla. Se ve con **borde de aviso + texto «+2 h extra»** (nunca solo color). **Salen en el PDF.** No se copian al copiar semanas. |
| Puntos de venta | Lista editable (Chiringuito, Cafetería, Pub…). Un «Dónde» por tramo. Se ve como **texto pequeño debajo de la hora** (en blanco y negro el texto sigue ahí). Cada punto tiene su **color** (paleta de 20) y en Gestión → «Colorear por» se elige **Persona** (como siempre, por defecto) o **Punto de venta** (el tramo toma el color de su sitio; sin sitio, el de la persona); el ajuste es por aparato (`dp_color_by`) y solo sale si hay puntos de venta. Con la lista vacía no aparece nada. |
| Color por punto de venta (14a) | Cada punto tiene su color (paleta de 20). Gestión → «Colorear por»: **Persona** (por defecto) o **Punto de venta**; por aparato (`dp_color_by`), solo sale si hay puntos. |
| Clientes y camareros por día (14b) | **Segunda tabla** bajo el cuadrante (misma `.schedule-table`, mismas columnas por CSS, hueco de 4 px, se deslizan juntas): su cabecera son los **clientes previstos** (por fecha, `data.clients`, se guardan al escribir); debajo, **camareros** (total y etiqueta por sitio con su color; quien trabaja en dos sitios cuenta 1 vez en el total) y **clientes por camarero** (verde hasta el «Ideal», naranja hasta +25 %, rojo por encima; `data.ratioMax`, 20 por defecto, lo fija cada local). «Copiar semanas» no copia clientes. Entra en la copia de seguridad y en la impresión (una hoja). |
| Menú «Gestión» | Imprimir / PDF · Copiar la semana anterior (en 1–8 semanas) · Personal · Estados · Puntos de venta · Copia de seguridad · Colorear por · Tema. |
| Copiar semanas | Como `gestion-hosteleria`: la semana anterior a la que se ve se repite en esta y en las siguientes (1–8), **solo en casillas vacías** y sin quien esté de baja en la semana de destino. |
| Personal | La primera vez: **Camarero 1–4** sin turnos (se renombran tocando el nombre). Añadir, nombre, color (paleta de 20, sin rosas ni fucsias; un estado nuevo nace con uno que no lleve nadie), orden (número o arrastrar por ⠿). **Quitar**: sin ningún turno se borra del todo; con turnos, **se da de baja desde la semana que se ve** (sigue en las anteriores) y se puede volver a dar de alta. |
| Ejemplo | Los 8 inventados solo con **`?demo`** en la dirección, guardados aparte (`dp_demo_data`): nunca tocan los datos de verdad. El título dice «· ejemplo». |
| Temas | **Claro, Lino, Oscuro y Carbón** (colores de `gestion-hosteleria/app/core/static/core/themes.css`). |
| PDF | Imprimir del navegador («Guardar como PDF»), **A4 apaisado**, siempre en colores claros. Sin PNG ni jsPDF. |
| Footer | El de Nando, como en health-tracker: «David Planner © 2026 · Fernando Vilas Paz» + GitHub, LinkedIn y CV. |
| Fervis (pasos 12a–12c) | Asistente con la **clave gratuita de Groq de David** (Nando, 10-nov; como `Crypto_Portafolio/js/fervis.js`, más pequeño): sin servidor, el navegador habla con Groq. Clave solo en su navegador (`dp_groq_key`), **nunca** en el código ni en la copia. **Solo lee**. Al preguntar, los turnos y el personal que hagan falta **sí salen a Groq** (lo dice la ventana): única excepción a «Datos solo en el aparato». **Las funciones de la app calculan y el modelo solo las llama** (`runTool` en `js/fervis-datos.js`: `turnos_entre`, `resumen_entre` —con ranking y fines de semana completos—, `clientes_entre` y `manual_app`); el modelo no cuenta días a ojo y se le manda un mensaje pequeño. Para «cómo se hace…», **la app le pone delante los 2 temas de la guía que más coinciden** y le prohíbe decir que algo «no se puede» sin comprobarlo (`guideFor`). **La guía de la app** (`GUIDE`, `GUIDE_GROUPS`) es un **glosario** (botón «📖 Guía» y chip del saludo): tarjetas que se despliegan, sin chat, sin Groq y sin clave; si cambia algo de la app se cambia ahí, y una prueba exige que cada botón del menú Gestión y de la casilla salga. Arriba del glosario, «🖨️ Descargar guía (PDF)» (una hoja con todos los temas y el nombre del local, para entregarla tras la formación). Chips con preguntas de ejemplo; robot en la barra de arriba (blanco; centrado desde 900 px); lo de la clave vive en Ajustes (icono de tres barras), nunca en la conversación; etiqueta `groq · modelo` y «respaldo» si el primero falló; modelos pedidos a la cuenta de David (`/models`). |
| Librerías | Ninguna de fuera. Si alguna vez hiciera falta, copiada en el repo, nunca de un CDN. |

## Forma de trabajar
- Un paso de `PLAN.md` cada vez; cada paso termina con **algo que se ve en localhost** y **un commit**.
- Antes de escribir: qué, por qué y cuántas líneas. Lo no pedido va a «💡 Aparcado» de `PLAN.md`.
- Separar responsabilidades: HTML, CSS y JS en archivos distintos; nada de estilos ni scripts en línea; los datos de ejemplo en su propio archivo.
- Verificar en el navegador de verdad (móvil en vertical y apaisado, tablet, PC) antes de decir «hecho».
- `git diff --stat` y `git add` selectivo (nunca `git add .`). Proyecto personal: la IA puede hacer push tras cada commit verificado, **espaciando los pushes** cuando esté activado Pages (dos seguidos atascan la publicación).
- Cierre de sesión: `PLAN.md` (✅) y entrada en `SESSIONS.md`.

## Cómo verlo en local
```
python D:\Fernando\Coding\projects\david-planner\servidor.py
```
y abrir `http://localhost:8731` (con `?demo` al final, los datos de ejemplo). **Puerto propio: 8731, nunca el 8000**
(lo usa el ERP; un service worker abarca toda la dirección donde se instala y podría meterse en el ERP). Si está
ocupado, `servidor.py` avisa y para. Le dice al navegador que **no guarde copias** (`Cache-Control: no-store`): con
`python -m http.server`, Chrome usaba CSS viejos y parecía que faltaban cosas. (Con doble clic en `index.html` no funciona la parte
instalable: necesita `localhost` o `https`.)

## Pruebas automáticas
Con el servidor encendido, abrir **`http://localhost:8731/tests/`**: carga la app de verdad en un marco y pasa las
pruebas (`tests/tests.js`, sacadas de las reglas de este archivo). Verde = todo bien; en rojo, cada fallo dice qué
esperaba y qué salió. **Pasarlas antes de cada commit** y añadir la prueba de cada regla nueva. Guardan los datos
`dp_*` del navegador y los devuelven al terminar; en la web publicada no se ejecutan (podrían tocar datos de David).
Hoy: **67 pruebas**. Un test nuevo se da por bueno solo tras verlo **fallar** con el código roto a propósito (control).
**Archivo nuevo que carga la página → apuntarlo en `ESSENTIAL` de `sw.js`**: si no, con internet va bien y sin
internet la app instalada se abre rota, sin avisar. Lo vigila la prueba «Todo lo que pide la página… está en ESSENTIAL».

## Estructura
`index.html` · `css/` (estilos y temas) · `js/` (un archivo por pieza: `app.js` cuadrante, `cell.js` casilla,
`swap.js` intercambiar, `staff.js`/`states.js`/`places.js` ventanas con `lists.js` común, `backup.js` copias, Fervis en tres: `fervis-datos.js`
lo que calcula la app, `fervis-guia.js` la guía y el glosario, `fervis.js` el chat —se cargan en ese orden—,
`pwa.js` instalable…) · `manifest.webmanifest` y `sw.js` (PWA: solo atiende sus archivos y solo borra cachés
`david-planner-`) · `icons/` (generados con Chrome sin ventana desde un HTML de diseño) · `servidor.py` (local, 8731).
