// «Intercambiar con…» en dos toques: desde la ventana de una casilla se pulsa el botón, sale un aviso abajo y se toca
// la otra casilla (la misma persona otro día, otra persona el mismo día o cualquier combinación). Si una está vacía,
// el turno se mueve. Se cancela con el botón, con Escape o tocando otra vez la misma casilla.
// La casilla de origen se guarda en «dp_swap» (sessionStorage: solo esta pestaña, pero sobrevive a cambiar de semana,
// que recarga la página). Tras cambiar, «Deshacer» durante unos segundos: en el móvil es fácil tocar la de al lado.
window.Swap = (function () {
  "use strict";
  const KEY = "dp_swap";
  const bar = document.getElementById("swap-bar");
  const text = document.getElementById("swap-text");
  const undo = document.getElementById("swap-undo");
  const cancel = document.getElementById("swap-cancel");
  let source = read();  // { key, label } de la casilla de origen, o null
  let last = null;      // el último intercambio, para «Deshacer»
  let hideTimer = 0;

  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; }
  }

  function remember(value) {
    try {
      if (value) { sessionStorage.setItem(KEY, JSON.stringify(value)); } else { sessionStorage.removeItem(KEY); }
    } catch (e) { /* sin almacenamiento: funciona igual mientras no se cambie de semana */ }
  }

  function show(message, canUndo) {
    clearTimeout(hideTimer);
    text.textContent = message;
    undo.hidden = !canUndo;
    cancel.textContent = canUndo ? "Cerrar" : "Cancelar";
    bar.hidden = false;
    if (canUndo) { hideTimer = setTimeout(function () { bar.hidden = true; }, 8000); }
  }

  function stop() {
    source = null;
    remember(null);
    bar.hidden = true;
    window.Schedule.render();  // quita el borde discontinuo de la casilla de origen
  }

  function start(key, label) {
    source = { key: key, label: label };
    remember(source);
    show("Toca la casilla con la que cambiar «" + label + "»", false);
    window.Schedule.render();
  }

  // Lo llama el cuadrante al tocar una casilla. Devuelve true si se ha encargado (estábamos eligiendo).
  function pick(key) {
    if (!source) { return false; }
    if (key === source.key) { stop(); return true; }  // la misma casilla: cancelar
    const from = source.key;
    source = null;
    remember(null);
    if (window.Schedule.swap(from, key)) {
      last = [from, key];
      show("Cambiado ✓", true);
    } else {
      show("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.", false);
    }
    return true;
  }

  undo.addEventListener("click", function () {
    if (!last) { return; }
    if (window.Schedule.swap(last[0], last[1])) {
      last = null;
      show("Deshecho ✓", false);
      hideTimer = setTimeout(function () { bar.hidden = true; }, 3000);
    } else {
      show("No se ha podido deshacer: el navegador no deja guardar.", false);
    }
  });
  cancel.addEventListener("click", stop);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && source) { stop(); }
  });

  // Venimos de otra semana con un intercambio a medias: el aviso sigue y la casilla de origen se marca si está a la vista
  if (source) { show("Toca la casilla con la que cambiar «" + source.label + "»", false); window.Schedule.render(); }

  return { start: start, pick: pick, sourceKey: function () { return source ? source.key : null; } };
})();
