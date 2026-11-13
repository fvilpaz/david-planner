// Fervis — la GUÍA de la app (refactor de la auditoría, 10-nov; antes dentro de fervis.js): la guía para el modelo (manual, y
// guideFor: los temas que tocan en una pregunta de «cómo se hace…»), el glosario desplegable (botón «📖 Guía») y «Descargar guía
// (PDF)». Nada de esto llama a Groq ni necesita clave. Los temas y sus pasos NO están aquí: viven en js/guide-es.js y
// js/guide-en.js (uno por idioma, con los mismos ids) y este archivo usa los del idioma elegido. Se carga después de
// fervis-datos.js (usa su norm) y antes de fervis.js (que usa GUIDE, manual, guideFor y showGuide).
window.FervisGuide = (function () {
  "use strict";
  const norm = window.FervisData.norm;
  const t = window.I18n.t;
  // Piezas de la ventana del chat que el glosario esconde o enseña (showGuide)
  const messages = document.getElementById("fervis-messages");
  const chat = document.getElementById("fervis-form");
  const keyForm = document.getElementById("fervis-key-form");

  // El contenido de la guía en el idioma de ahora (si faltara uno, el español)
  function texts() { return window.GuideTexts[window.I18n.current()] || window.GuideTexts.es; }
  function topics() { return texts().topics; }

  // La guía de la app, por temas y en pasos. Sale de dos formas: el botón 📖 y los chips la enseñan SIN el modelo (la responde la
  // app: instantánea, gratis y sin clave de Groq), y el modelo la consulta con manual_app para los «cómo hago…». Si cambia algo de
  // la app, se cambia en guide-es.js y guide-en.js: una prueba comprueba que cada botón del menú y de la casilla sale en la guía.
  // Cada tema: id, emoji, título y pasos.

  // Para el modelo (manual_app): el tema como texto seguido, o el índice si no hay tema o no existe
  function manual(topic) {
    const wanted = norm(topic).replace(/[^a-z_]/g, "_");
    const found = topics().find(function (item) { return item[0] === wanted; });
    if (found) { return found[2] + ": " + found[3].join(" "); }
    return texts().indexIntro + topics().map(function (item) { return item[0] + " (" + item[2] + ")"; }).join("; ") + ".";
  }

  // Cuando la pregunta es de «cómo se hace…», la APP busca en la guía los temas que tocan y se los pone delante al modelo (el modelo, solo,
  // contestó de memoria que «no se puede cambiar el color de una persona», y sí se puede). Se comparan las palabras de la pregunta con las
  // de cada tema (por sus 4 primeras letras: cambio/cambiar, copio/copiar, persona/personal) y salen los 2 que más coinciden.
  // Cómo se reconoce una pregunta de «cómo se hace» y qué palabras sobran es de cada idioma (howTo y stop, en su archivo).
  const stems = function (text, stop) {
    return norm(text).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && !stop.includes(w); }).map(function (w) { return w.slice(0, 4); });
  };
  function guideFor(asked) {
    const lang = texts();
    if (!lang.howTo.test(norm(asked))) { return ""; }
    const words = stems(asked, lang.stop);
    const scored = lang.topics.map(function (item) {
      const own = stems(item[0].replace(/_/g, " ") + " " + item[2] + " " + item[3].join(" "), lang.stop);
      return { item: item, score: words.filter(function (w) { return own.includes(w); }).length };
    }).filter(function (x) { return x.score >= 2; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2);
    return scored.map(function (x) { return x.item[2] + ": " + x.item[3].join(" "); }).join("\n");
  }

  // La guía como GLOSARIO (Nando: «que el botón, en vez de modo bot, se convierta en glosario: vas pulsando y va desplegando»): una
  // vista aparte dentro de la ventana, con grupos y temas que se despliegan. No es el chat: no añade burbujas, no llama a Groq y no
  // necesita clave. El botón 📖 (y el chip «Guía de la app» del saludo) alterna entre el chat y el glosario.
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
  // nombre del local arriba. Sale de los mismos textos (la guía), así que no se desfasa de la app. Abre la impresión del navegador («Guardar como PDF»).
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
    add(sheet, "h1", t("guide.printTitle"));
    add(sheet, "p", info.name + (info.city ? " · " + info.city : ""), "guide-print-site");
    add(sheet, "p", t("guide.printIntro"), "guide-print-intro");
    texts().groups.forEach(function (group) {
      add(sheet, "h2", group[1] + " " + group[2]);
      group[3].forEach(function (topicId) {
        const item = topics().find(function (it) { return it[0] === topicId; });
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
    printButton.textContent = t("guide.print");
    printButton.addEventListener("click", printGuide);
    texts().groups.forEach(function (group) {
      const groupBox = guideView.appendChild(document.createElement("details"));
      groupBox.className = "fervis-guide-group";
      groupBox.appendChild(guideSummary(group[1], group[2], window.I18n.tn("guide.topics", group[3].length)));
      const children = groupBox.appendChild(document.createElement("div"));  // los temas cuelgan del grupo: sangría y línea guía (CSS)
      children.className = "fervis-guide-children";
      group[3].forEach(function (topicId) {
        const item = topics().find(function (it) { return it[0] === topicId; });
        const topic = children.appendChild(document.createElement("details"));
        topic.className = "fervis-guide-topic";
        topic.appendChild(guideSummary(item[1], item[2], window.I18n.tn("guide.steps", item[3].length)));
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

  // Al cambiar de idioma, el glosario (si ya se había construido) se vuelve a escribir en el idioma nuevo
  document.addEventListener("i18n-change", function () { if (guideView.children.length) { buildGuide(); } });

  return { get GUIDE() { return topics(); }, manual: manual, guideFor: guideFor, showGuide: showGuide };
})();
