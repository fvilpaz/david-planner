// Piezas comunes de las ventanas «Personal», «Estados» y «Puntos de venta» (paso 7: sacadas de staff.js para no copiarlas;
// auditoría 12-nov: lo que las tres seguían repitiendo):
// - decorate(): pone a una fila de la lista el asa ⠿ (a la izquierda) y la cajita con el número del puesto (a la derecha).
// - sortable(): hace que la lista se ordene arrastrando por el asa o escribiendo el número; avisa con el orden nuevo.
// - palette(): los círculos de colores para elegir uno.
// - byPosition, errorShower, cleanName, newId, nextPosition, orderSaver y wireDialog: lo de cada ficha y cada ventana.
// Cada fila de la lista es un <li data-id="…">.
window.Lists = (function () {
  "use strict";
  const SAVE_ERROR = "No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.";

  // Una copia de la lista en el orden del puesto («position»), sin tocar la guardada
  function byPosition(items) { return items.slice().sort(function (a, b) { return a.position - b.position; }); }

  // El aviso rojo de una ventana: con texto se ve; con "" se esconde
  function errorShower(element) {
    return function (text) {
      element.textContent = text;
      element.hidden = !text;
    };
  }

  // El nombre que se escribe: sin espacios de más (dentro tampoco) y como mucho `max` letras
  function cleanName(text, max) { return text.trim().replace(/\s+/g, " ").slice(0, max); }

  function newId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }  // único: hora + azar

  function nextPosition(items) { return Math.max.apply(null, [-1].concat(items.map(function (x) { return x.position; }))) + 1; }

  // Lo que recibe sortable(): guarda el orden nuevo con `saveAll` (saveEmployees, saveStatuses o savePlaces de app.js) y
  // vuelve a pintar la lista: con el orden guardado o, si no se pudo, con el de antes, y entonces avisa
  function orderSaver(saveAll, showList, showError) {
    return function (ids) {
      const saved = saveAll(function (all) {
        ids.forEach(function (id, position) { all.find(function (x) { return x.id === id; }).position = position; });
      });
      showList();
      if (!saved) { showError(SAVE_ERROR); }
    };
  }

  // Se cierra con su botón ✕ o tocando fuera, y se abre desde su botón del menú «Gestión» (que se recoge)
  function wireDialog(dialog, menuButton, open) {
    dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
    menuButton.addEventListener("click", function () {
      document.querySelector(".manage-menu").open = false;
      open();
    });
  }

  function decorate(item, index, label) {
    const handle = document.createElement("span");
    handle.className = "drag-handle";
    handle.textContent = "⠿";
    handle.setAttribute("aria-hidden", "true");
    item.prepend(handle);
    const number = item.appendChild(document.createElement("input"));
    number.className = "order-number";
    number.inputMode = "numeric";
    number.maxLength = 2;
    number.value = String(index + 1);
    number.setAttribute("aria-label", "Puesto de " + label);
  }

  // onOrder(ids): recibe los ids de arriba abajo en el orden nuevo (lo guarda quien usa la lista)
  function sortable(list, onOrder) {
    function ids() { return Array.from(list.children).map(function (item) { return item.dataset.id; }); }

    // Escribir un número (y salir del campo o pulsar Intro) cuela esa fila en ese puesto; las demás bajan uno
    list.addEventListener("change", function (event) {
      const input = event.target.closest(".order-number");
      if (!input) { return; }
      const order = ids();
      const id = input.closest("li").dataset.id;
      const wanted = Math.min(Math.max(parseInt(input.value, 10) || 1, 1), order.length) - 1;
      order.splice(order.indexOf(id), 1);
      order.splice(wanted, 0, id);
      onOrder(order);
    });
    list.addEventListener("keydown", function (event) {
      if (event.key === "Enter" && event.target.closest(".order-number")) { event.preventDefault(); event.target.blur(); }
    });
    // Al tocar la cajita, el número se selecciona entero: lo que se escriba lo sustituye. Sin esto, el cursor quedaba
    // al principio y escribir «1» sobre un «3» daba «13» (= al final): parecía que no se movía (lo vio Nando).
    // En el clic y no solo al recibir el foco: al soltar el ratón, el navegador quitaba la selección.
    list.addEventListener("click", function (event) { if (event.target.closest(".order-number")) { event.target.select(); } });
    list.addEventListener("focusin", function (event) { if (event.target.closest(".order-number")) { event.target.select(); } });

    // Arrastrar por el asa ⠿ (de gestion-hosteleria/schedule.js): el puntero sigue «agarrado» aunque salga del asa y,
    // al pasar por encima de otra fila, se cambian de sitio. Vale con el dedo y con el ratón. Se guarda al soltar.
    let dragged = null;
    list.addEventListener("pointerdown", function (event) {
      const handle = event.target.closest(".drag-handle");
      if (!handle) { return; }
      dragged = handle.closest("li");
      dragged.classList.add("dragging");
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    list.addEventListener("pointermove", function (event) {
      if (!dragged) { return; }
      const below = document.elementFromPoint(event.clientX, event.clientY);
      const target = below && below.closest("li");
      if (!target || target.parentElement !== list || target === dragged) { return; }
      // Si venía de antes, queda detrás de la otra; si venía de después, delante
      const comesFromBefore = dragged.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING;
      list.insertBefore(dragged, comesFromBefore ? target.nextSibling : target);
    });
    function drop() {
      if (!dragged) { return; }
      dragged.classList.remove("dragging");
      dragged = null;
      onOrder(ids());
    }
    list.addEventListener("pointerup", drop);
    list.addEventListener("pointercancel", drop);
  }

  // Pinta en `container` un círculo por color de PALETTE (más `current` delante si no está) y avisa con onPick(color)
  function palette(container, current, onPick) {
    const colors = window.PALETTE.includes(current) ? window.PALETTE : [current].concat(window.PALETTE);
    container.replaceChildren.apply(container, colors.map(function (c, i) {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.style.setProperty("--swatch", c);
      swatch.setAttribute("aria-label", "Color " + (i + 1));
      swatch.setAttribute("aria-pressed", String(c === current));
      swatch.addEventListener("click", function () { onPick(c); });
      return swatch;
    }));
  }

  return { SAVE_ERROR: SAVE_ERROR, decorate: decorate, sortable: sortable, palette: palette, byPosition: byPosition, errorShower: errorShower,
    cleanName: cleanName, newId: newId, nextPosition: nextPosition, orderSaver: orderSaver, wireDialog: wireDialog };
})();
