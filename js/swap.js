// «Copiar a…» (paso 13) usa el mismo aviso y la misma elección de casilla, pero no termina al primer toque: cada casilla
// LIBRE que se toca recibe una copia, hasta pulsar «Hecho» (o Escape). «Deshacer» quita la última copia hecha.
// «Intercambiar con…» en dos toques: desde la ventana de una casilla se pulsa el botón, sale un aviso abajo y se toca
// la otra casilla (la misma persona otro día, otra persona el mismo día o cualquier combinación). Si una está vacía,
// el turno se mueve. Se cancela con el botón, con Escape o tocando otra vez la misma casilla.
// La casilla de origen se guarda en «dp_swap» (sessionStorage: solo esta pestaña, pero sobrevive a cambiar de semana,
// que recarga la página). Tras cambiar, «Deshacer» durante unos segundos: en el móvil es fácil tocar la de al lado.
window.Swap = (function () {
  "use strict";
  const KEY = "dp_swap";
  const t = window.I18n.t;   // los textos siguen al idioma elegido (js/i18n.js)
  const bar = document.getElementById("swap-bar");
  const text = document.getElementById("swap-text");
  const undo = document.getElementById("swap-undo");
  const cancel = document.getElementById("swap-cancel");
  let source = read();  // { key, label } de la casilla de origen, o null
  let last = null;      // el último intercambio, para «Deshacer»
  let pasted = [];      // las casillas rellenadas en este «Copiar a…», para «Deshacer» (solo mientras no se cambie de semana)
  let hideTimer = 0;

  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; }
  }

  function remember(value) {
    try {
      if (value) { sessionStorage.setItem(KEY, JSON.stringify(value)); } else { sessionStorage.removeItem(KEY); }
    } catch (e) { /* sin almacenamiento: funciona igual mientras no se cambie de semana */ }
  }

  function show(message, canUndo, cancelLabel, sticky) {
    clearTimeout(hideTimer);
    text.textContent = message;
    undo.hidden = !canUndo;
    cancel.textContent = cancelLabel || t(canUndo ? "common.close" : "common.cancel");
    bar.hidden = false;
    if (canUndo && !sticky) { hideTimer = setTimeout(function () { bar.hidden = true; }, 8000); }
  }

  // El aviso de «estás eligiendo casilla»; en «Copiar a…» no se oculta (hasta «Hecho») y puede deshacer lo copiado
  function showSource(note) {
    const copying = source.mode === "copy";
    const ask = t(copying ? "swap.askCopy" : "swap.askSwap", { label: source.label });
    show((note ? note + " · " : "") + ask, copying && pasted.length > 0, copying ? t("swap.done") : null, true);
  }

  // Es una función (y no un objeto fijo) para que el texto salga en el idioma de ese momento
  function pasteMessage(kind) {
    if (kind === "occupied") { return t("swap.occupied"); }
    if (kind === "empty") { return t("swap.empty"); }
    return t("common.saveFailed") + " " + t("swap.notCopied");   // «error»
  }

  function stop() {
    source = null;
    remember(null);
    bar.hidden = true;
    window.Schedule.render();  // quita el borde discontinuo de la casilla de origen
  }

  function start(key, label, mode) {
    source = { key: key, label: label, mode: mode === "copy" ? "copy" : "swap" };
    pasted = [];
    remember(source);
    showSource();
    window.Schedule.render();
  }

  // Lo llama el cuadrante al tocar una casilla. Devuelve true si se ha encargado (estábamos eligiendo).
  function pick(key) {
    if (!source) { return false; }
    if (key === source.key) { stop(); return true; }  // la misma casilla: cancelar
    if (source.mode === "copy") {
      const result = window.Schedule.copyShift(source.key, key);
      if (result === "ok") { pasted.push(key); showSource(t("swap.copied", { n: pasted.length })); } else { showSource(pasteMessage(result)); }
      return true;
    }
    const from = source.key;
    source = null;
    remember(null);
    if (window.Schedule.swap(from, key)) {
      last = [from, key];
      show(t("swap.swapped"), true);
    } else {
      show(t("common.saveFailed") + " " + t("common.nothingChanged"), false);
    }
    return true;
  }

  undo.addEventListener("click", function () {
    if (source && source.mode === "copy") {  // quita la última copia
      const key = pasted[pasted.length - 1];
      if (key && window.Schedule.update(key, null)) { pasted.pop(); showSource(t("swap.removed")); } else { showSource(pasteMessage("error")); }
      return;
    }
    if (!last) { return; }
    if (window.Schedule.swap(last[0], last[1])) {
      last = null;
      show(t("swap.undone"), false);
      hideTimer = setTimeout(function () { bar.hidden = true; }, 3000);
    } else {
      show(t("swap.undoFailed"), false);
    }
  });
  cancel.addEventListener("click", stop);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && source) { stop(); }
  });

  // Venimos de otra semana con un intercambio a medias: el aviso sigue y la casilla de origen se marca si está a la vista
  if (source) { showSource(); window.Schedule.render(); }
  // Si se cambia de idioma con el aviso a la vista, se vuelve a escribir (el cuadrante ya se repinta solo)
  document.addEventListener("i18n-change", function () { if (source) { showSource(); } });

  return { start: start, pick: pick, sourceKey: function () { return source ? source.key : null; } };
})();
