// Piezas comunes de las ventanas «Personal» y «Estados» (paso 7: sacadas de staff.js para no copiarlas):
// - decorate(): pone a una fila de la lista el asa ⠿ (a la izquierda) y la cajita con el número del puesto (a la derecha).
// - sortable(): hace que la lista se ordene arrastrando por el asa o escribiendo el número; avisa con el orden nuevo.
// - palette(): los círculos de colores para elegir uno.
// Cada fila de la lista es un <li data-id="…">.
window.Lists = (function () {
  "use strict";

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

  return { decorate: decorate, sortable: sortable, palette: palette };
})();
