# Glosario — David Planner

Vocabulario de la app en los dos idiomas y cómo funciona la traducción. **Los textos viven en `js/lang-es.js` y `js/lang-en.js`**
(una clave por texto; el motor es `js/i18n.js`) y la guía de Fervis en `js/guide-es.js` y `js/guide-en.js`. Si cambia un nombre,
se cambia en los dos archivos de textos y aquí.

Código y claves en inglés. Textos de pantalla en castellano (por defecto) e inglés **británico** (`en-GB`).

## Vocabulario (el que se eligió; cámbialo en los dos archivos de idioma a la vez)

| Español | Inglés | Nota |
|---|---|---|
| Gestión | Manage | El menú |
| Personal | Staff | Ventana y menú. «Dar de baja» → *Deactivate*; «Volver a dar de alta» → *Reactivate* |
| Estados | Status | Propuesta de Nando: «Status» y no «Statuses» |
| Puntos de venta | Outlets | Elección de Nando. «Dónde» → *Where* |
| Camareros | Waiters | El ratio solo tiene sentido para camareros (decisión de Nando: se adapta si llega otro puesto) |
| Clientes previstos | Expected clients | |
| Clientes por camarero | Clients per waiter | |
| Turno partido / turno seguido | Split shift / straight shift | Un tramo = *period* |
| Horas extra | Overtime | La franja de la casilla sigue diciendo «+2 h extra» / «+2 h extra» |
| Copia de seguridad | Backup | «Copias automáticas» → *Automatic backups* |
| Tema / Color de las etiquetas | Theme / Label colour | *Colour* con «u» (inglés británico) |
| Claro, Lino, Oscuro, Carbón | Light, Linen, Dark, Charcoal | |
| Trabajo, Libre, Vacaciones, Baja | Work, Off, Holiday, Sick leave | Los 4 estados de fábrica. «Baja» (estado) ≠ «Dar de baja» (cesar a la persona) |
| Chiringuito, Cafetería, Pub | Beach bar, Café, Pub | Los puntos de venta de la demo |
| Camarero 1…4 | Waiter 1…4 | Lo que trae la app la primera vez |

## Qué se traduce y qué no

- **Se traduce al MOSTRARLO** lo que trae la app de fábrica: «Camarero N», los cuatro estados (por su id: `work`, `off`,
  `vacation`, `sick`) y los puntos de venta de la demo (`p1`, `p2`, `p3`). Solo si nadie les ha cambiado el nombre: lo que escribe
  el usuario, o lo de fábrica que renombró, se ve **tal cual**. Lo guardado no cambia nunca (`I18n.displayName`, `displayStatus`,
  `displayPlace`).
- **No se traduce**: nombres de personas, y todo lo que escribe el usuario; los nombres de archivo de las copias
  (`david-planner-copia-…`); los nombres de las herramientas de Fervis (`turnos_entre`…) ni los ids de la guía (son para el modelo).
- **Fechas y números** siguen el idioma (`I18n.formatter`): «lunes 9» / «Monday 9», «1,5» / «1.5». Inglés británico y no
  americano: con `en-US` saldría «9 Monday». La meta `og:locale:alternate` es `en_GB` por lo mismo.
- **Fervis**: lo que ve el usuario (chat, ajustes, demo, errores, guía) sale en el idioma elegido. A la IA se le dice en qué idioma
  contestar (`fervis.replyLanguage`); su mensaje de sistema sigue en castellano (es su idioma de trabajo; las pruebas lo vigilan).

## Cómo se añade o cambia un texto

1. Una clave nueva en `js/lang-es.js` **y** en `js/lang-en.js` (las dos, con las mismas `{variables}`). Si el texto se repite en
   varias ventanas, va en `common.*` y se reutiliza: no se copia.
2. En el HTML: `data-i18n="clave"` (texto), `data-i18n-html` (si lleva negrita o un enlace), `data-i18n-aria`,
   `data-i18n-placeholder` o `data-i18n-title`. En JavaScript: `window.I18n.t("clave", { variable: valor })`; con singular y
   plural: `I18n.tn("clave", n)` busca `clave.one` y `clave.other`.
3. Lo que escribe JavaScript (no el HTML) tiene que volver a escribirse al cambiar de idioma: escuchar el evento `i18n-change`
   (o marcar el elemento con `data-i18n`, que `apply()` reescribe solo).
4. Las pruebas de «Idioma» (en `tests/tests.js`) vigilan que las claves coincidan, que las que pide el código existan y que las dos
   guías tengan los mismos temas.

## Cómo se añadiría un idioma

Un archivo `js/lang-xx.js` y otro `js/guide-xx.js` con las mismas claves; darlos de alta en `index.html`, en `sw.js` (`ESSENTIAL`),
en `LOCALES` y en `readSaved()` de `js/i18n.js`, y un botón en el selector del menú Gestión.

## Lo que NO sigue el idioma (limitaciones conocidas)

- `manifest.webmanifest` (descripción al instalar), `<meta name="description">` y las etiquetas Open Graph: son fijas por página,
  están en castellano. Para que cada idioma tenga su tarjeta al compartir haría falta una dirección por idioma (`/en/`).
- Los mensajes que ya se escribieron en el chat de Fervis (se quedan en el idioma en que se escribieron; los chips sí se rehacen).
