# PLAN — david-planner

Cada paso termina con algo que se ve en `http://localhost:8000` y un commit. Los pasos grandes se parten (1a, 1b…)
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
| 11 | 🔲 Publicar en **GitHub Pages** + `audit` (nando-toolkit) | Abrirla desde la dirección pública e instalarla |

## Propuesta de datos (a confirmar en el paso 3; código en inglés)
```
{ version: 1,
  employees: [{ id, name, color, position, leftFrom: null | "AAAA-MM-DD" }],
  statuses:  [{ id, name, color, countsAsWork, position }],
  shifts:    { "<employeeId>|AAAA-MM-DD": { statusId,
                                            slots: [{ start: "10:00", end: "18:00", placeId? }],  // placeId: paso 7b
  places:    [{ id, name, position }],  // paso 7b; los datos de antes sin «places» se completan al cargar
                                            overtime: { hours: 2, reason: "" } | null } } }
```
El tema va aparte, en `dp_theme`: es de cada aparato y se tiene que leer antes de pintar la página (si no, se ve
un parpadeo del tema por defecto).

## ❓ Para decidir (Nando) — clarificación del 10-nov, al cerrar
1. **Probar en tu móvil** (yo solo puedo simular ratón): arrastrar ⠿ con el dedo, el calendario al tocar el título,
   instalarla y ver que abre sin conexión. Con la app instalada, mirar si el navegador acepta proteger los datos
   (`persist()`); en una pestaña de prueba lo rechaza.
2. **«Baja» significa dos cosas:** el estado «Baja» (baja médica, en una casilla) y «Dar de baja» en Personal (dejar
   de trabajar aquí). Propuesta: en Personal, «Ya no trabaja aquí desde el…» / «Vuelve a trabajar aquí». Decides tú.
3. **Refactor de las tres ventanas** (Personal, Estados, Puntos de venta comparten esqueleto): ¿se junta ahora, con
   las 26 pruebas de red, o se deja? Funciona igual; solo quitaría repetición.
4. **¿Qué ve David la primera vez?** Hoy, Camarero 1–4 sin turnos. ¿Le preparas tú su personal y le pasas el
   archivo de copia para que lo cargue, o lo rellena él?
5. **Saltos de línea (CRLF):** git avisa en cada commit («LF will be replaced by CRLF»). Un `.gitattributes` con
   `* text=auto eol=lf` lo dejaría fijo para Windows y WSL. No lo he añadido: es configuración del repo.
6. **Cierra cualquier pestaña en `localhost:8000`** para que termine de irse el service worker de las pruebas.

## 💡 Aparcado
- Sincronizar entre aparatos con un gist de GitHub (ver «Decisiones» en `CLAUDE.md` por qué no ahora).
- Total de horas extra del mes por persona (sumar las marcas de las casillas).
- Botones con los horarios más usados (p. ej. 10–18, 18–02) para poner un turno de un toque.
- Arrastrar para intercambiar en PC (en móvil se confunde con desplazar).
- Avisar si los dos tramos de un turno partido se pisan (10–14 y 12–16); ahora no se comprueba.
- En el móvil, abrir la semana actual desplazada hasta hoy (ahora empieza siempre en el lunes).
- Exportar el cuadrante como imagen PNG / botón «Compartir» a WhatsApp.
- Refactor (solo si Nando lo pide): las ventanas Personal, Estados y Puntos de venta repiten el esqueleto de abrir,
  cerrar, volver y guardar (la lista ordenable y la paleta ya son comunes en `lists.js`). Regla de tres: a la tercera
  se podría sacar; no se hace por no tocar dos ventanas que funcionan.
- Color propio por turno (en gestion-hosteleria existe; aquí la casilla toma el color de la persona o del estado).
- Para gestion-hosteleria (no es de este repo): en la ventana de la casilla, la casilla de marcar «color propio» parece un segundo selector de color roto.
