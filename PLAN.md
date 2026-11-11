# PLAN — david-planner

Cada paso termina con algo que se ve en `http://localhost:8731` y un commit. Los pasos grandes se parten (1a, 1b…)
cuando lleguemos a ellos, no antes. 🔲 pendiente · ✅ hecho

| # | Paso | Se ve funcionando |
|---|---|---|
| 0 | ✅ Repositorio clonado, `CLAUDE.md`, `PLAN.md`, `SESSIONS.md` | Los tres archivos en el repo |
| 1 | ✅ Cuadrante de solo lectura con datos inventados: semana lunes–domingo, nombres y cabecera fijos, hoy marcado, ‹ Hoy ›, selector de fecha, footer | En localhost, en móvil (vertical y apaisado) y en PC |
| 2 | ✅ Menú «Gestión» con **Tema** (Claro, Lino, Oscuro, Carbón; se recuerda) e **Imprimir / PDF** (A4 apaisado, en claro) | Cambiar de tema; vista previa de impresión en una hoja |
| 2b | ✅ Nombre de la barra editable con un lápiz (`dp_name`; iniciales automáticas; sale en la pestaña y en el PDF) y barra de la semana limpia (el título abre el calendario; «Hoy» solo fuera de esta semana) | Cambiar el nombre, recargar y verlo; tocar el título y elegir otra semana |
| 2c | ✅ Barra como la de gestion-hosteleria: local + **ciudad** (un solo lápiz para los dos; `dp_city`) y **persona** a la derecha en un círculo (`dp_person`; en el móvil solo el círculo) | Poner local, ciudad y persona, recargar y verlos |
| 3 | ✅ Guardar en el navegador y **editar la casilla** (ventana de gestion-hosteleria mejorada): estado, horario, segundo tramo, vaciar; **un solo Guardar**; si el estado no cuenta como trabajo, el horario **se oculta al momento**; sin «Dónde» | Cambiar un turno, recargar y que siga ahí |
| 4 | ✅ **Horas extra** en la casilla: borde de aviso + «+2 h extra», motivo opcional; también en el PDF | Marcar extras y verlas en pantalla y en la impresión |
| 5 | ✅ **Intercambiar con…** (dos toques) | Cambiar dos días de una persona y dos personas el mismo día |
| 6a | ✅ **Personal**: la primera vez Camarero 1–4 (idea de Nando); ventana Personal (lista, añadir, nombre, color de una paleta **sin fucsia**); tocar un nombre del cuadrante abre su ficha; quitar (sin turnos se borra; con turnos, baja desde la semana que se ve) y volver a dar de alta; modo ejemplo con `?demo` en su propia clave | Dar de baja y ver que sigue en semanas anteriores |
| 6b | ✅ **Orden del personal** dentro de la misma ventana Personal (Nando: sin botón aparte como auryapp): en cada tarjeta, asa ⠿ para arrastrar y el número del puesto; se guarda al soltar o al escribir el número | Reordenar y que el cuadrante y el PDF salgan en ese orden |
| 7 | ✅ **Estados**: misma ventana que Personal (lista ordenable común en `lists.js`); nombre, color (solo los sin horario), si cuenta como trabajo; en uso no se quita ni cambia «cuenta como trabajo»; el primero es el de por defecto | Crear «Formación», usarlo y ver que no se deja borrar |
| 7b | ✅ **Puntos de venta** (Nando, 10-nov): lista editable en Gestión (Chiringuito, Cafetería, Pub…); en la ventana, un «Dónde» **por tramo**; en la casilla, el nombre pequeño **debajo de la hora** (como «Terraza» en gestion-hosteleria), no colores con leyenda. Con la lista vacía, «Dónde» no aparece | Crear 3 puntos, poner a cada camarero en uno y verlo en pantalla y en el PDF |
| 8 | ✅ **Copiar la semana anterior** en 1–8 semanas (solo vacías, sin extras, sin quien esté de baja) | Copiar a 4 semanas sin pisar lo puesto |
| 9a | ✅ **Copia de seguridad** (como health-tracker, `src/js/copia.js`): descargar JSON (`app`, `version`, `exportedAt`, `data` y la barra/tema); cargar revisando campo a campo (lo ilegible se descarta y se cuenta), con confirmación y **descarga previa de lo de antes**; **franja que no bloquea** si hace 7 días o más (no la primera semana, ni en `?demo`), con «Más tarde» | Exportar, borrar, importar y que todo vuelva; ver la franja y que desaparezca al descargar |
| 9b | ✅ **Copias automáticas** dentro del navegador (una por semana al abrir, las 5 últimas en `dp_copias`, con «Recuperar»). Revisar que el menú «Gestión» (ya largo) quepa en un móvil en horizontal | Ver la copia de la semana y recuperarla |
| 10 | ✅ **PWA**: manifiesto, iconos, service worker (funciona sin conexión) y `navigator.storage.persist()` (que el navegador no borre los datos por su cuenta) | Instalarla en el móvil y abrirla sin conexión |
| 11 | ✅ Publicar en **GitHub Pages** + `audit` (nando-toolkit) | Abrirla desde la dirección pública e instalarla |
| 12a | ✅ **Fervis** (Nando, 10-nov), ventana y clave (el robot de la cartera, en el acento del tema y con sus movimientos): botón que abre un chat; David pega **su** clave gratuita de Groq (`dp_groq_key`, fuera de la copia de seguridad; limpieza al pegar como en `Crypto_Portafolio/js/fervis.js`). Sin clave, solo explica cómo conseguirla | Pegar una clave, recargar y que siga; descargar copia y que la clave no salga |
| 12b | ✅ **Fervis contesta**: IA normal (charla general: «¿qué es un contrato fijo?») y además sabe de la app: un manual corto de cómo se usa + los datos (personal, estados, puntos de venta y turnos de esta semana y la siguiente; para otras fechas, una consulta). Reconoce a cada empleado (aunque se escriba «ana» o sin tilde) y sabe **quién está en turno ahora mismo** y con qué horario, quién libra y quién está de vacaciones o de baja: el «ahora» lo calcula la app (también los turnos que cruzan la medianoche), no la IA. **Solo lee, no cambia turnos.** Sin personal o sin turnos, lo dice y ofrece explicar cómo crearlos. Errores claros (clave mala, límite gratuito, sin internet) | Preguntar «¿quién cierra el sábado?» y «¿qué es un contrato fijo?» con una clave de verdad; en las pruebas, un Groq de mentira |
| 12c | ✅ **Fervis, la segunda vuelta** (Nando, 10-nov, tras probarlo con clave real): las **funciones de la app calculan y el modelo solo las llama** (`turnos_entre`, `resumen_entre` con fines de semana completos y ranking, `manual_app`; −65 % de tokens), chips de preguntas de ejemplo con el tono del tema, **guía de la app como glosario** (botón «📖 Guía»: tarjetas que se despliegan, sin chat, sin Groq y sin clave), guía relevante puesta por la app en las preguntas de «cómo se hace» (el modelo había contestado de memoria que algo «no se podía»), robot en la barra, papelera, saludo propio | Preguntar «quién libra los fines de semana», «cómo cambio el color de una persona» y abrir el 📖 Guía |
| 13 | ✅ **Copiar a…** (idea de David, vía Nando, 10-nov): en la ventana de una casilla con turno, «📋 Copiar a…» y se tocan las casillas LIBRES que se quieran (otras personas, otros días, otras semanas); copia estado, los dos tramos y el sitio, sin horas extra; no pisa lo ocupado; «Deshacer» la última y «Hecho» para terminar | Copiar un turno partido a tres días, ver que no pisa uno ocupado y deshacer |
| 14a | ✅ **Color por punto de venta** (idea de David, vía Nando, 11-nov): cada punto de venta tiene su color (paleta de 20) y Gestión → «Colorear por» elige **Persona** (como siempre) o **Punto de venta**; el tramo con sitio toma el color del sitio. Por aparato; solo sale si hay puntos de venta. | 4 pruebas nuevas, cada una vista fallar con el código roto (53 en total); probado en el navegador con la demo |

## Forma de los datos (la del código; `js/storage.js` completa `places` en los datos de antes del paso 7b)
```
{ version: 1,
  employees: [{ id, name, color, position, leftFrom: null | "AAAA-MM-DD" }],
  statuses:  [{ id, name, color, countsAsWork, position }],
  places:    [{ id, name, position }],
  shifts:    { "<employeeId>|AAAA-MM-DD": { statusId,
                                            slots: [{ start: "10:00", end: "18:00", placeId? }],
                                            overtime: { hours: 2, reason: "" } | null } } }
```
El tema va aparte, en `dp_theme`: es de cada aparato y se tiene que leer antes de pintar la página (si no, se ve
un parpadeo del tema por defecto).

## ❓ Para decidir (Nando) — clarificación del 10-nov, al cerrar
1. ✅ **Probado en el móvil por Nando (10-nov):** arrastrar ⠿ con el dedo funciona y, dice, «prácticamente todo». Queda
   sin confirmar al detalle: si el navegador acepta proteger los datos con la app instalada (`persist()`; en una
   pestaña de prueba lo rechaza) y abrirla sin conexión.
2. ✅ **«Baja» vs «Dar de baja» — decidido por Nando (10-nov): se queda como está.** El estado «Baja» es la baja médica
   (enfermedad o accidente, en una casilla: se **está** de baja); «Dar de baja» en Personal es cesar a la persona desde la
   semana que se ve (se la **da** de baja; vuelve con «Volver a dar de alta»). Son dos cosas distintas y los verbos lo
   dicen. No cambiar los textos.
3. **Refactor de las tres ventanas** (Personal, Estados, Puntos de venta comparten esqueleto): ¿se junta ahora, con
   las 47 pruebas de red, o se deja? Funciona igual; solo quitaría repetición.
4. **¿Qué ve David la primera vez?** Hoy, Camarero 1–4 sin turnos. ¿Le preparas tú su personal y le pasas el
   archivo de copia para que lo cargue, o lo rellena él?
5. **Saltos de línea (CRLF):** git avisa en cada commit («LF will be replaced by CRLF»). Un `.gitattributes` con
   `* text=auto eol=lf` lo dejaría fijo para Windows y WSL. No lo he añadido: es configuración del repo.
6. **Cierra cualquier pestaña en `localhost:8000`** para que termine de irse el service worker de las pruebas.
7. **La cuenta de Groq de David (para Fervis).** Tiene que ser **suya** (el límite gratuito es de la cuenta, no de la
   clave): en su móvil, con su correo y tú al lado; el enlace de acceso de Groq solo vale una vez y en el navegador
   donde se pidió (no reenviarlo por WhatsApp). La clave se pega en Ajustes (icono de tres barras) del chat.
8. **Probar Fervis en el móvil** con su clave: el chat a 390 px, el teclado y el robot con el dedo. Y ver cuánto aguanta
   el límite gratuito con uso normal (seis preguntas seguidas dieron 429).

## 💡 Aparcado
- Sincronizar entre aparatos con un gist de GitHub (ver «Decisiones» en `CLAUDE.md` por qué no ahora).
- Total de horas extra del mes por persona (sumar las marcas de las casillas).
- Botones con los horarios más usados (p. ej. 10–18, 18–02) para poner un turno de un toque.
- Arrastrar para intercambiar en PC (en móvil se confunde con desplazar).
- Avisar si los dos tramos de un turno partido se pisan (10–14 y 12–16); ahora no se comprueba.
- En el móvil, abrir la semana actual desplazada hasta hoy (ahora empieza siempre en el lunes).
- Color libre para personas y estados (un selector de cualquier color); hoy hay una paleta de 20 (Nando, 10-nov).
- Guía: repasar los textos con ojos de quien no sabe de apps (frases como «la ventana de la casilla» o «Cuenta como trabajo»), con David.
- Sitio por defecto de cada persona (que «Dónde» se rellene solo al poner un turno); hoy se elige en cada casilla
  (el copiar semanas lo arrastra).
- Exportar el cuadrante como imagen PNG / botón «Compartir» a WhatsApp.
- **Paso 14b (decidido con Nando, 11-nov, sin empezar):** debajo del cuadrante, una tabla de 2 filas × 7 días: «Clientes previstos» (se escribe) y «Camareros» (se calcula: total del día y, debajo, el desglose por punto de venta con sus colores; solo cuentan los estados que cuentan como trabajo). Aviso de proporción clientes por camarero (verde/naranja/rojo según un umbral). Sale en la impresión y Fervis lo sabe. «Copiar semana» copia solo los turnos (no los clientes). El desglose por mañana/tarde queda aparcado.
- Móvil: en la demo (título largo) el menú «Gestión» se sale por la izquierda; arreglo aparte (ver SESSIONS.md 11-nov).
- Nombre de producto si se vende a otros locales (Nando, 11-nov): hoy «David Planner», y así sale en el CV y en freeCodeCamp; cambiarlo sería de una vez en título, icono instalable, pie y vídeos. La dirección /david-planner/ puede quedarse.
- Juntar el esqueleto de las listas (Personal, Estados y Puntos de venta repiten abrir, cerrar, volver y guardar):
  **solo si aparece una cuarta lista**. Nando, 10-nov: mejor tres con el mismo molde; cada una tiene sus excepciones
  y lo común ya está en `lists.js` (composición: cada ventana coge las piezas que le sirven).
- Color propio por turno (en gestion-hosteleria existe; aquí la casilla toma el color de la persona o del estado).
- Para Crypto_Portafolio (no es de este repo): que su Fervis, sin activos o sin cartera, lo diga y ofrezca explicar cómo
  se montaría una cartera de forma segura (qué es un ETF, un bono, la estructura habitual) sin recomendar compras.
- Para gestion-hosteleria (no es de este repo): en la ventana de la casilla, la casilla de marcar «color propio» parece un segundo selector de color roto.
