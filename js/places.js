// Ventana «Puntos de venta» (paso 7b, idea de Nando): Chiringuito, Cafetería, Pub… La misma forma que «Estados»
// (lista ordenable de lists.js y ficha): nombre y color. En el cuadrante salen como texto pequeño debajo de la hora; el
// color se ve si en Gestión → «Colorear por» eliges «Punto de venta» (paso 14a). El orden es el del desplegable «Dónde».
// Uno en uso no se puede quitar (sus tramos se quedarían sin sitio); renombrarlo, sí.
window.Places = (function () {
  "use strict";
  const dialog = document.getElementById("place-dialog");
  const title = document.getElementById("place-title");
  const listView = document.getElementById("place-list-view");
  const list = document.getElementById("place-list");
  const form = document.getElementById("place-form");
  const nameInput = document.getElementById("place-name");
  const note = document.getElementById("place-note");
  const errorEl = document.getElementById("place-error");
  const removeButton = document.getElementById("place-remove");
  const palette = document.getElementById("place-palette");
  const SAVE_ERROR = "No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.";
  let editing = null;      // el punto de venta de la ficha (null = nuevo)
  let color = null;        // el color elegido en la ficha
  let confirming = false;  // «Quitar» espera el segundo toque

  function places() { return window.Schedule.getData().places; }

  function sorted() { return places().slice().sort(function (a, b) { return a.position - b.position; }); }

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }

  function showList() {
    title.textContent = "Puntos de venta";
    showError("");
    form.hidden = true;
    listView.hidden = false;
    document.getElementById("place-empty").hidden = places().length > 0;
    list.replaceChildren.apply(list, sorted().map(function (place, index) {
      const item = document.createElement("li");
      item.dataset.id = place.id;
      const row = item.appendChild(document.createElement("button"));
      row.type = "button";
      row.className = "sort-row";
      row.dataset.id = place.id;
      const dot = row.appendChild(document.createElement("span"));
      dot.className = "swatch";
      dot.style.setProperty("--swatch", place.color);
      row.append(place.name);  // texto, nunca HTML
      window.Lists.decorate(item, index, place.name);
      return item;
    }));
  }

  function saveOrder(ids) {
    const saved = window.Schedule.savePlaces(function (all) {
      ids.forEach(function (id, position) { all.find(function (p) { return p.id === id; }).position = position; });
    });
    showList();  // con el orden guardado o, si no se pudo, con el de antes
    if (!saved) { showError(SAVE_ERROR); }
  }

  window.Lists.sortable(list, saveOrder);

  function renderPalette() { window.Lists.palette(palette, color, function (c) { color = c; renderPalette(); }); }

  function showForm(place) {
    const uses = place ? window.Schedule.placeUses(place.id) : 0;
    editing = place;
    confirming = false;
    color = place && place.color ? place.color : window.Store.freeColor(window.Schedule.getData());
    title.textContent = place ? "Editar «" + place.name + "»" : "Nuevo punto de venta";
    nameInput.value = place ? place.name : "";
    removeButton.hidden = !place || uses > 0;  // nuevo: nada que quitar; en uso: no se puede
    removeButton.textContent = "Quitar";
    note.hidden = !uses;
    note.textContent = "Se usa en " + uses + (uses === 1 ? " tramo" : " tramos") + ": no se puede quitar " +
      "(se quedarían sin sitio). El nombre y el color, sí.";
    showError("");
    renderPalette();
    listView.hidden = true;
    form.hidden = false;
    nameInput.focus();
  }

  function save(change) {
    if (window.Schedule.savePlaces(change)) { showList(); return; }
    showError(SAVE_ERROR);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!name) { showError("Pon un nombre."); nameInput.focus(); return; }
    const chosen = color;
    if (editing) {
      const id = editing.id;
      save(function (all) {
        const place = all.find(function (p) { return p.id === id; });
        place.name = name;
        place.color = chosen;
      });
    } else {
      const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);  // único: hora + azar
      const position = Math.max.apply(null, [-1].concat(places().map(function (p) { return p.position; }))) + 1;
      save(function (all) { all.push({ id: id, name: name, color: chosen, position: position }); });
    }
  });

  // Quitar (solo si no está en uso): pide un segundo toque
  removeButton.addEventListener("click", function () {
    const id = editing.id;
    if (window.Schedule.placeUses(id)) { showForm(editing); return; }  // se empezó a usar mientras tanto
    if (!confirming) {
      confirming = true;
      removeButton.textContent = "Sí, quitar «" + editing.name + "»";
      return;
    }
    save(function (all) { all.splice(all.findIndex(function (p) { return p.id === id; }), 1); });
  });

  list.addEventListener("click", function (event) {
    const row = event.target.closest(".sort-row");
    if (row) { showForm(places().find(function (p) { return p.id === row.dataset.id; })); }
  });
  document.getElementById("place-add").addEventListener("click", function () { showForm(null); });
  document.getElementById("place-back").addEventListener("click", showList);
  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  document.getElementById("place-button").addEventListener("click", function () {
    document.querySelector(".manage-menu").open = false;
    open();
  });

  function open() {
    dialog.showModal();
    showList();
  }

  return { open: open };
})();
