// Fervis — la GUÍA de la app (refactor de la auditoría, 10-nov; antes dentro de fervis.js): los temas y sus pasos (GUIDE), la guía
// para el modelo (manual, y guideFor: los temas que tocan en una pregunta de «cómo se hace…»), el glosario desplegable (botón
// «📖 Guía») y «Descargar guía (PDF)». Nada de esto llama a Groq ni necesita clave. Se carga después de fervis-datos.js (usa su
// norm) y antes de fervis.js (que usa GUIDE, manual, guideFor y showGuide).
window.FervisGuide = (function () {
  "use strict";
  const norm = window.FervisData.norm;
  // Piezas de la ventana del chat que el glosario esconde o enseña (showGuide)
  const messages = document.getElementById("fervis-messages");
  const chat = document.getElementById("fervis-form");
  const keyForm = document.getElementById("fervis-key-form");

  // La guía de la app, por temas y en pasos. Sale de dos formas: el botón 📖 y los chips la enseñan SIN el modelo (la responde la
  // app: instantánea, gratis y sin clave de Groq), y el modelo la consulta con manual_app para los «cómo hago…». Si cambia algo de
  // la app, se cambia aquí: una prueba comprueba que cada botón del menú y de la casilla sale en la guía. Cada tema: id, emoji,
  // título y pasos.
  const GUIDE = [
    ["empezar", "🧭", "Moverse por el cuadrante", [
      "El cuadrante muestra una semana, de lunes a domingo.",
      "‹ y › cambian de semana.",
      "Toca el título (con el 📅) para abrir un calendario y saltar a cualquier fecha.",
      "«Hoy» vuelve a esta semana (solo sale si estás en otra).",
      "Los nombres y los días se quedan fijos al deslizar.",
      "Toca una casilla para editarla y un nombre para abrir la ficha de esa persona."]],
    ["casilla", "✏️", "Poner o cambiar un turno", [
      "Toca la casilla del día y la persona.",
      "Elige el Estado (Trabajo, Libre, Vacaciones, Baja…).",
      "Si es de trabajo: pon inicio y fin (si el fin es antes que el inicio, acaba al día siguiente: 22:00–02:00).",
      "«+ Segundo tramo» para un turno partido.",
      "«Dónde» elige el punto de venta (si los has creado).",
      "Guardar. «Vaciar» deja la casilla en blanco."]],
    ["clientes_camareros", "👥", "Clientes previstos y camareros", [
      "Debajo del cuadrante, separado por un pequeño hueco, hay otra tabla con tres filas y la misma columna por día.",
      "«Clientes previstos» (la fila azul, como la cabecera): escribe cuántos clientes esperas ese día (un número entero; vacío lo quita). Cámbialo cuando haga falta, por ejemplo si llega un vuelo.",
      "«Camareros»: lo cuenta la app sola (quien tiene un estado con horario y algún tramo): el total y, debajo, una etiqueta por punto de venta con su color («2 Cafetería»). Quien trabaja en dos sitios el mismo día cuenta una vez en el total y en los dos sitios.",
      "«Clientes por camarero»: los clientes entre los camareros. Verde hasta el «Ideal», naranja hasta un 25 % más y rojo por encima. El «Ideal» (20 al principio) es el número de clientes por camarero que te parece bien: lo cambias en esa misma fila según tu local (no es lo mismo un restaurante que un bufé o una barra) y los colores cambian en cuanto lo escribes. Aparece cuando escribes los clientes.",
      "Los clientes van por fecha: al repetir una semana entera, los clientes no se repiten (hay que escribirlos). Entran en la copia de seguridad y salen al imprimir."]],
    ["horas_extra", "⏱️", "Horas extra", [
      "En la ventana de la casilla, en «Horas extra», pon cuántas: de 0,5 a 16, con coma o punto, en medias horas.",
      "Si quieres, escribe el motivo.",
      "En el cuadrante, la casilla lleva una franja fucsia a la derecha con «+2 h extra»; también sale al imprimir.",
      "Vacío = sin horas extra."]],
    ["intercambiar", "⇄", "Intercambiar dos turnos", [
      "Abre una casilla y pulsa «⇄ Intercambiar con…».",
      "Toca la otra casilla: de otra persona, otro día o incluso otra semana.",
      "Se cambian los dos turnos, con sus horas extra y su sitio. Si la otra está vacía, el turno se mueve.",
      "«Deshacer» unos segundos; «Cancelar» o tocar la misma casilla lo anula."]],
    ["copiar_turno", "📋", "Copiar un turno a otras casillas", [
      "Abre una casilla con turno y pulsa «📋 Copiar a…».",
      "Toca las casillas libres donde lo quieras (de cualquier persona, día o semana).",
      "Cada una recibe el estado, el horario y el sitio, sin horas extra.",
      "Lo que ya tiene algo no se pisa.",
      "«Deshacer» quita la última copia; «Hecho» termina."]],
    ["copiar_semanas", "🗓️", "Copiar semanas", [
      "Gestión → «Copiar la semana anterior».",
      "Elige en cuántas semanas (de 1 a 8) y pulsa Copiar.",
      "La semana anterior a la que ves se repite en esta y en las siguientes.",
      "Solo en casillas vacías, sin horas extra y sin quien ya no trabaje aquí; el sitio sí se copia."]],
    ["personal", "👥", "Personal", [
      "Gestión → «Personal»: la lista. «+ Añadir persona».",
      "Toca a alguien para cambiar su nombre y su color (hay 20).",
      "El orden: arrastra el ⠿ o escribe el número del puesto.",
      "«Quitar»: sin turnos se borra; con turnos, «Dar de baja desde el…» (la semana que ves): deja de salir desde entonces y se conserva el histórico. «Volver a dar de alta» la recupera.",
      "La primera vez salen «Camarero 1» a «Camarero 4»: renómbralos tocando el nombre."]],
    ["estados", "🏷️", "Estados (Libre, Vacaciones, Baja…)", [
      "Gestión → «Estados»: los tipos de casilla.",
      "Vienen Trabajo, Libre, Vacaciones y Baja (baja médica). Puedes crear más, como «Asuntos propios».",
      "Cada estado tiene nombre, color y si «Cuenta como trabajo» (lleva horario y horas extra y usa el color de la persona; los demás usan su propio color).",
      "El primero es el que sale al abrir una casilla vacía.",
      "Uno que ya se usa no se puede quitar ni cambiar si cuenta como trabajo."]],
    ["puntos_de_venta", "📍", "Puntos de venta", [
      "Gestión → «Puntos de venta»: crea los sitios (Chiringuito, Cafetería, Pub…).",
      "Hasta que no haya uno, «Dónde» no sale en la casilla.",
      "Con puntos creados, cada tramo tiene su «Dónde» y el nombre sale pequeño debajo de la hora.",
      "Cada punto tiene su color (hay 20), como las personas: se elige al crearlo o al tocarlo.",
      "Gestión → «Colorear por»: «Persona» (cada tramo lleva el color de quien trabaja, como siempre) o «Punto de venta» (el color del sitio: ves de un vistazo dónde va cada uno). Solo sale si hay puntos creados.",
      "Uno en uso no se puede quitar, pero su nombre y su color sí se pueden cambiar."]],
    ["imprimir", "🖨️", "Imprimir o guardar en PDF", [
      "Gestión → «Imprimir / PDF» abre la impresión del navegador con la semana que ves.",
      "Sale en una hoja A4 apaisada y siempre en colores claros.",
      "Para guardar un PDF, elige «Guardar como PDF» como destino.",
      "También se lee bien en blanco y negro (se pierde el color por persona)."]],
    ["copia_seguridad", "💾", "Copia de seguridad", [
      "Gestión → «Copia de seguridad».",
      "«Descargar copia» guarda un archivo con todo: guárdalo también fuera del móvil (Drive, correo, el PC).",
      "«Cargar una copia…» la recupera y pide confirmación; antes guarda lo que había como copia automática (se recupera en «Copias automáticas»), sin descargar nada.",
      "Hay copias automáticas dentro del navegador: una por semana, las 5 últimas, con «Recuperar».",
      "Si pasan 7 días sin descargar copia, sale un aviso arriba.",
      "Los datos viven solo en el navegador de ese aparato: si se borran, se pierden."]],
    ["temas", "🎨", "Temas de color", [
      "Gestión → «Tema»: Claro, Lino, Oscuro y Carbón.",
      "Se recuerda en cada aparato.",
      "Al imprimir siempre sale en claro."]],
    ["local_y_persona", "🏢", "Nombre del local y de la persona", [
      "Arriba a la izquierda, el cuadrado con el lápiz cambia el nombre del local y la ciudad (las iniciales salen solas).",
      "Arriba a la derecha, el círculo con el lápiz cambia el nombre de quien usa la app."]],
    ["instalar", "📲", "Instalar la app y usarla sin conexión", [
      "Se puede instalar como una aplicación: en el navegador, menú → «Instalar aplicación» o «Añadir a la pantalla de inicio» (depende del navegador).",
      "Una vez instalada, abre sin conexión.",
      "Fervis es lo único que necesita internet."]],
    ["fervis", "🤖", "Qué puede hacer Fervis", [
      "Se abre con el robot de arriba.",
      "Dice quién trabaja ahora o cualquier día y qué turno tiene cada persona.",
      "Cuenta: turnos partidos o seguidos, fines de semana libres, vacaciones, bajas.",
      "Explica cómo se usa la app y charla de cosas generales (contratos, descansos…), siempre orientativo.",
      "Solo lee los turnos: no cambia nada.",
      "Necesita la clave gratuita de Groq: icono de tres barras → Ajustes (se crea en console.groq.com).",
      "La papelera borra la conversación. Con muchas preguntas seguidas, el plan gratuito puede pedir esperar un minuto."]],
  ];

  // Para el modelo (manual_app): el tema como texto seguido, o el índice si no hay tema o no existe
  function manual(topic) {
    const wanted = norm(topic).replace(/[^a-z_]/g, "_");
    const found = GUIDE.find(function (item) { return item[0] === wanted; });
    if (found) { return found[2] + ": " + found[3].join(" "); }
    return "Temas de la guía (pídelos uno a uno con manual_app y «tema»): " + GUIDE.map(function (item) { return item[0] + " (" + item[2] + ")"; }).join("; ") + ".";
  }

  // Cuando la pregunta es de «cómo se hace…», la APP busca en la guía los temas que tocan y se los pone delante al modelo (el modelo, solo,
  // contestó de memoria que «no se puede cambiar el color de una persona», y sí se puede). Se comparan las palabras de la pregunta con las
  // de cada tema (por sus 4 primeras letras: cambio/cambiar, copio/copiar, persona/personal) y salen los 2 que más coinciden.
  const HOW_TO = /\b(como|donde|se puede|puedo|puede|manual|guia|ayuda|funcion|opcion|para que sirve|que hace|que puedes)\b/;
  const STOP = ["para", "como", "donde", "puedo", "puede", "quiero", "tengo", "hacer", "esta", "este", "esto", "unas", "unos", "tiene", "tienen", "sobre", "desde", "hasta"];
  const stems = function (text) {
    return norm(text).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && !STOP.includes(w); }).map(function (w) { return w.slice(0, 4); });
  };
  function guideFor(asked) {
    if (!HOW_TO.test(norm(asked))) { return ""; }
    const words = stems(asked);
    const scored = GUIDE.map(function (item) {
      const own = stems(item[0].replace(/_/g, " ") + " " + item[2] + " " + item[3].join(" "));
      return { item: item, score: words.filter(function (w) { return own.includes(w); }).length };
    }).filter(function (x) { return x.score >= 2; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2);
    return scored.map(function (x) { return x.item[2] + ": " + x.item[3].join(" "); }).join("\n");
  }

  // La guía como GLOSARIO (Nando: «que el botón, en vez de modo bot, se convierta en glosario: vas pulsando y va desplegando»): una
  // vista aparte dentro de la ventana, con grupos y temas que se despliegan. No es el chat: no añade burbujas, no llama a Groq y no
  // necesita clave. El botón 📖 (y el chip «Guía de la app» del saludo) alterna entre el chat y el glosario.
  const GUIDE_GROUPS = [
    ["turnos", "📅", "Turnos y casillas", ["empezar", "casilla", "clientes_camareros", "horas_extra", "intercambiar", "copiar_turno"]],
    ["gestion", "🛠️", "Menú Gestión", ["copiar_semanas", "personal", "estados", "puntos_de_venta", "imprimir", "copia_seguridad", "temas"]],
    ["app", "🏢", "Mi local, la app y Fervis", ["local_y_persona", "instalar", "fervis"]],
  ];
  const guideView = document.getElementById("fervis-guide-view");
  const guideButton = document.getElementById("fervis-guide");

  // Cada fila es una tarjeta como las de health-tracker (Nando: «me mola más cómo has puesto los botones»): círculo con el emoji a la izquierda,
  // el título con su subtítulo («5 pasos», «3 temas») y el triangulito de desplegable a la derecha (lo pone el CSS).
  function guideSummary(icon, title, subtitle) {
    const summary = document.createElement("summary");
    const card = summary.appendChild(document.createElement("span"));  // la tarjeta; el triangulito queda fuera, a su derecha (CSS)
    card.className = "fervis-guide-card";
    card.appendChild(document.createElement("span")).className = "fervis-guide-badge";
    card.lastChild.textContent = icon;
    const text = card.appendChild(document.createElement("span"));
    text.className = "fervis-guide-text";
    text.appendChild(document.createElement("strong")).className = "fervis-guide-title";
    text.lastChild.textContent = title;
    text.appendChild(document.createElement("small")).className = "fervis-guide-sub";
    text.lastChild.textContent = subtitle;
    return summary;
  }

  // «Descargar guía (PDF)» (idea de Nando, para entregarla tras la formación): una hoja de impresión con TODOS los temas abiertos y seguidos y el
  // nombre del local arriba. Sale de los mismos textos (GUIDE), así que no se desfasa de la app. Abre la impresión del navegador («Guardar como PDF»).
  // Con «#guia-imprimible» en la dirección, la hoja ya viene preparada (para ver el PDF sin pulsar nada, y para las pruebas).
  function siteInfo() {
    try { return { name: localStorage.getItem("dp_name") || "David Planner", city: localStorage.getItem("dp_city") || "" }; }
    catch (error) { return { name: "David Planner", city: "" }; }
  }

  function prepareGuideSheet() {
    const old = document.getElementById("guide-print");
    if (old) { old.remove(); }
    const info = siteInfo();
    const sheet = document.body.appendChild(document.createElement("section"));
    sheet.id = "guide-print";
    sheet.className = "guide-print";
    const add = function (parent, tag, text, className) {
      const el = parent.appendChild(document.createElement(tag));
      el.textContent = text;
      if (className) { el.className = className; }
      return el;
    };
    add(sheet, "h1", "Guía de uso");
    add(sheet, "p", info.name + (info.city ? " · " + info.city : ""), "guide-print-site");
    add(sheet, "p", "Cómo se usa la app, paso a paso. Si tienes dudas, pregunta a Fervis (el asistente de la app) o abre su botón «Guía».", "guide-print-intro");
    GUIDE_GROUPS.forEach(function (group) {
      add(sheet, "h2", group[1] + " " + group[2]);
      group[3].forEach(function (topicId) {
        const item = GUIDE.find(function (it) { return it[0] === topicId; });
        const topic = sheet.appendChild(document.createElement("div"));
        topic.className = "guide-print-topic";
        add(topic, "h3", item[1] + " " + item[2]);
        const steps = topic.appendChild(document.createElement("ul"));
        item[3].forEach(function (step) { add(steps, "li", step); });
      });
    });
    add(sheet, "p", "David Planner · fvilpaz.github.io/david-planner", "guide-print-foot");
    document.body.classList.add("printing-guide");
    return sheet;
  }

  function printGuide() {
    const sheet = prepareGuideSheet();
    const cleanup = function () {
      document.body.classList.remove("printing-guide");
      sheet.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  if (location.hash === "#guia-imprimible") { prepareGuideSheet(); }

  function buildGuide() {
    guideView.replaceChildren();
    const printButton = guideView.appendChild(document.createElement("button"));  // arriba del todo, encima de las tarjetas
    printButton.type = "button";
    printButton.id = "fervis-guide-print";
    printButton.className = "secondary fervis-guide-print";
    printButton.textContent = "🖨️ Descargar guía (PDF)";
    printButton.addEventListener("click", printGuide);
    GUIDE_GROUPS.forEach(function (group) {
      const groupBox = guideView.appendChild(document.createElement("details"));
      groupBox.className = "fervis-guide-group";
      groupBox.appendChild(guideSummary(group[1], group[2], group[3].length + (group[3].length === 1 ? " tema" : " temas")));
      const children = groupBox.appendChild(document.createElement("div"));  // los temas cuelgan del grupo: sangría y línea guía (CSS)
      children.className = "fervis-guide-children";
      group[3].forEach(function (topicId) {
        const item = GUIDE.find(function (it) { return it[0] === topicId; });
        const topic = children.appendChild(document.createElement("details"));
        topic.className = "fervis-guide-topic";
        topic.appendChild(guideSummary(item[1], item[2], item[3].length + (item[3].length === 1 ? " paso" : " pasos")));
        const steps = topic.appendChild(document.createElement("ul"));
        item[3].forEach(function (step) { steps.appendChild(document.createElement("li")).textContent = step; });
      });
    });
  }

  // Acordeón (Nando: «si se despliega una que se pliegue otra, para que no ocupe toda la pantalla»): al abrir un grupo se cierran los
  // otros grupos, y al abrir un tema se cierran los demás temas de ese grupo. «toggle» no sube por el árbol: se escucha en captura.
  guideView.addEventListener("toggle", function (event) {
    const opened = event.target;
    if (!opened.open || opened.tagName !== "DETAILS") { return; }
    Array.from(opened.parentElement.children).forEach(function (sibling) {
      if (sibling !== opened && sibling.tagName === "DETAILS" && sibling.open) { sibling.open = false; }
    });
  }, true);

  function showGuide(show) {  // el glosario o el chat: uno u otro
    if (show && !guideView.children.length) { buildGuide(); }
    guideView.hidden = !show;
    messages.hidden = show;
    chat.hidden = show;
    if (show) { keyForm.hidden = true; guideView.scrollTop = 0; }
    guideButton.setAttribute("aria-expanded", String(show));
  }

  // El botón «📖 Guía» de la cabecera alterna entre el chat y el glosario
  guideButton.addEventListener("click", function () { showGuide(guideView.hidden); });

  return { GUIDE: GUIDE, manual: manual, guideFor: guideFor, showGuide: showGuide };
})();
