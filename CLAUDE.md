# david-planner — cuadrante de turnos

> Si eres una IA que abre este proyecto: lee este archivo, `PLAN.md` y la última entrada de `SESSIONS.md`
> antes de nada. Las reglas generales de Nando (5 Tatuajes, metodología) están en `~/Nando.md` y `~/Metodologia.md`.

## Qué es
Un cuadrante de turnos semanal para un local de hostelería (lo usará David). **Sustituye al PDF colgado en la
pared**: se abre y se ve el cuadrante, se toca una casilla para cambiarla y se imprime o se guarda en PDF.
Nada más. Sin servidor, sin cuentas y sin base de datos: los datos viven en el navegador del aparato de David.

Origen: las reglas del cuadrante (turnos que cruzan la medianoche, turno partido, copiar semanas, nombres fijos,
impresión A4) están probadas en `gestion-hosteleria` (WSL: `~/code/github/gestion-hosteleria`, app `scheduling`
y `core/static/core/app.css`). **Se trae la lógica, no el código**: allí es Django y aquí es JavaScript sin servidor.

## Decisiones que NO se tocan (Nando, 10-nov-2026)
| Tema | Decisión |
|---|---|
| Tipo de app | Página estática (HTML + CSS + JS), **PWA instalable**. Sin TWA (solo haría falta para Google Play). |
| Dónde vive | Primero en local (`python -m http.server 8000`); después **GitHub Pages** (repositorio público `fvilpaz/david-planner`). |
| Datos | Solo en el aparato (`localStorage`). En el repositorio **nunca** hay datos reales: solo datos de ejemplo inventados. |
| Almacenamiento compartido | `fvilpaz.github.io` es **un solo dominio** para todas las apps de Pages (health-tracker, nplayer, MasterMind…): comparten `localStorage` y cachés. Por eso: **todas las claves con el prefijo `dp_`** (como `ht_` y `np_`), **nunca `localStorage.clear()`**, cachés con el prefijo `david-planner-` y el service worker **solo borra sus propias cachés** (como `health-tracker/src/sw.js`). Lo mismo pasa en `localhost:8000` con otros proyectos. |
| Copia | Exportar e importar **JSON** (con número de versión del formato). Importar = sustituir todo, con confirmación y copia previa automática. |
| Sincronizar | **No.** El gist queda en «Aparcado» (token en el aparato, gist secreto ≠ privado, mezcla de cambios difícil). |
| Pantalla | Abre directamente en el cuadrante. Una sola pantalla; lo demás en ventanas encima. Móvil, tablet y PC, vertical y apaisado. |
| Cuadrante | Lunes a domingo. Nombres **fijos a la izquierda** y cabecera de días fija (sticky). Hoy, en un tono más oscuro. Sin columna de horas. |
| Navegar | ‹ **Hoy** › y un selector de fecha para ir a cualquier semana (el histórico se conserva). |
| Casilla | Tocar → estado, horario (inicio–fin; si el fin es menor, acaba al día siguiente), **segundo tramo** (turno partido), horas extra, vaciar. |
| Estados | **Editables** (como `gestion-hosteleria`): nombre, color, si cuenta como trabajo y orden. Al empezar: Trabajo, Libre, Vacaciones, Baja. Un estado **en uso** no se puede quitar **ni cambiar si cuenta como trabajo** (sus horarios dejarían de verse). Color de la casilla: si cuenta como trabajo, el de la persona (por eso su ficha no enseña paleta); si no, el del estado. **El primero de la lista es el que sale en una casilla vacía.** |
| Intercambiar | «Intercambiar con…» y tocar otra casilla: misma persona en dos días, dos personas el mismo día o cualquier combinación. Dos toques, no arrastrar (se confunde con desplazar en el móvil). |
| Horas extra | Número y motivo opcional en la casilla. Se ve con **borde de aviso + texto «+2 h extra»** (nunca solo color). **Salen en el PDF.** No se copian al copiar semanas. |
| Puntos de venta | Lista editable (Chiringuito, Cafetería, Pub…). Un «Dónde» por tramo. Se ve como **texto pequeño debajo de la hora**, no con colores y leyenda (el color ya es la persona o el estado; en blanco y negro el texto sigue ahí). Con la lista vacía no aparece nada. |
| Menú «Gestión» | Imprimir / PDF · Copiar la semana anterior (en 1–8 semanas) · Personal · Estados · Puntos de venta · Tema · Copia de seguridad. |
| Copiar semanas | Como `gestion-hosteleria`: la semana anterior a la que se ve se repite en esta y en las siguientes (1–8), **solo en casillas vacías** y sin quien esté de baja en la semana de destino. |
| Personal | La primera vez: **Camarero 1–4** sin turnos (se renombran tocando el nombre). Añadir, nombre, color (paleta sin fucsia), orden (número o arrastrar por ⠿). **Quitar**: sin ningún turno se borra del todo; con turnos, **se da de baja desde la semana que se ve** (sigue en las anteriores) y se puede volver a dar de alta. |
| Ejemplo | Los 8 inventados solo con **`?demo`** en la dirección, guardados aparte (`dp_demo_data`): nunca tocan los datos de verdad. El título dice «· ejemplo». |
| Temas | **Claro, Lino, Oscuro y Carbón** (colores de `gestion-hosteleria/app/core/static/core/themes.css`). |
| PDF | Imprimir del navegador («Guardar como PDF»), **A4 apaisado**, siempre en colores claros. Sin PNG ni jsPDF. |
| Footer | El de Nando, como en health-tracker: «David Planner © 2026 · Fernando Vilas Paz» + GitHub, LinkedIn y CV. |
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
y abrir `http://localhost:8000` (con `?demo` al final, los datos de ejemplo). `servidor.py` es como
`python -m http.server 8000` pero le dice al navegador que **no guarde copias** (`Cache-Control: no-store`): con el
otro, Chrome usaba CSS viejos y parecía que faltaban cosas. (Con doble clic en `index.html` no funciona la parte
instalable: necesita `localhost` o `https`.)

## Estructura (prevista; se crea paso a paso)
`index.html` · `css/` (estilos y temas) · `js/` (app, datos de ejemplo) · `manifest.webmanifest` y `sw.js` (PWA, paso 10) · `icons/`.
