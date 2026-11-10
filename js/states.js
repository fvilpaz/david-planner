// Ventana «Estados» (paso 7): Trabajo, Libre, Vacaciones, Baja… y los que cree David. La misma forma que «Personal»:
// la lista ordenable (lists.js: asa ⠿ y número; el orden es el del desplegable de la casilla) y, al tocar un estado
// o «Añadir estado», su ficha: nombre, color y si cuenta como trabajo (lleva horario y horas extra).
// Como en gestion-hosteleria, un estado EN USO no se puede quitar; y tampoco cambiar si cuenta como trabajo: si
// «Trabajo» dejara de contar, los horarios de sus casillas dejarían de verse. El nombre y el color, siempre.
window.States = (function () {
  "use strict";
  const dialog = document.getElementById("status-dialog");
  const title = document.getElementById("status-title");
  const listView = document.getElementById("status-list-view");
  const list = document.getElementById("status-list");
  const form = document.getElementById("status-form");
  const nameInput = document.getElementById("status-name");
  const palette = document.getElementById("status-palette");
  const workInput = document.getElementById("status-work");
  const note = document.getElementById("status-note");
  const errorEl = document.getElementById("status-error");
  const removeButton = document.getElementById("status-remove");
  const SAVE_ERROR = "No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.";
  let editing = null;      // el estado de la ficha (null = nuevo)
  let color = null;        // el color elegido en la ficha
  let confirming = false;  // «Quitar» espera el segundo toque

  function statuses() { return window.Schedule.getData().statuses; }

  function sorted() { return statuses().slice().sort(function (a, b) { return a.position - b.position; }); }

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }

  function showList() {
    title.textContent = "Estados";
    showError("");
    form.hidden = true;
    listView.hidden = false;
    list.replaceChildren.apply(list, sorted().map(function (status, index) {
      const item = document.createElement("li");
      item.dataset.id = status.id;
      const row = item.appendChild(document.createElement("button"));
      row.type = "button";
      row.className = "sort-row";
      row.dataset.id = status.id;
      const dot = row.appendChild(document.createElement("span"));
      dot.className = "swatch";
      dot.style.setProperty("--swatch", status.color);
      row.append(status.name);  // texto, nunca HTML
      row.appendChild(document.createElement("small")).textContent = status.countsAsWork ? "con horario" : "sin horario";
      window.Lists.decorate(item, index, status.name);
      return item;
    }));
  }

  function saveOrder(ids) {
    const saved = window.Schedule.saveStatuses(function (all) {
      ids.forEach(function (id, position) { all.find(function (s) { return s.id === id; }).position = position; });
    });
    showList();  // con el orden guardado o, si no se pudo, con el de antes
    if (!saved) { showError(SAVE_ERROR); }
  }

  window.Lists.sortable(list, saveOrder);

  function renderPalette() { window.Lists.palette(palette, color, function (c) { color = c; renderPalette(); }); }

  // Si cuenta como trabajo, el color del estado no se ve (la casilla lleva el de la persona): la paleta se oculta
  function syncColor() {
    document.getElementById("status-color").hidden = workInput.checked;
    document.getElementById("status-color-note").hidden = !workInput.checked;
  }
  workInput.addEventListener("change", syncColor);

  // El color de un estado nuevo: el primero de la paleta que no lleve ya ninguna persona ni otro estado (con el siguiente
  // por orden, «Asuntos propios» salió naranja como Ana y parecían el mismo)
  function freeColor() {
    const used = window.Schedule.getData().employees.map(function (e) { return e.color; }).concat(statuses().map(function (s) { return s.color; }));
    return window.PALETTE.find(function (c) { return !used.includes(c); }) || window.PALETTE[statuses().length % window.PALETTE.length];
  }

  function showForm(status) {
    const uses = status ? window.Schedule.statusUses(status.id) : 0;
    editing = status;
    confirming = false;
    color = status ? status.color : freeColor();
    title.textContent = status ? "Editar «" + status.name + "»" : "Nuevo estado";
    nameInput.value = status ? status.name : "";
    workInput.checked = status ? status.countsAsWork : false;
    workInput.disabled = uses > 0;
    removeButton.hidden = !status || uses > 0;  // nuevo: nada que quitar; en uso: no se puede
    removeButton.textContent = "Quitar";
    note.hidden = !uses;
    note.textContent = "Se usa en " + uses + (uses === 1 ? " casilla" : " casillas") + ": no se puede quitar ni " +
      "cambiar si cuenta como trabajo (sus horarios dejarían de verse). El nombre y el color, sí.";
    showError("");
    renderPalette();
    syncColor();
    listView.hidden = true;
    form.hidden = false;
    nameInput.focus();
  }

  function save(change) {
    if (window.Schedule.saveStatuses(change)) { showList(); return; }
    showError(SAVE_ERROR);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!name) { showError("Pon un nombre."); nameInput.focus(); return; }
    const chosen = color;
    const counts = workInput.checked;
    if (editing) {
      const id = editing.id;
      const canChangeWork = !workInput.disabled;
      save(function (all) {
        const status = all.find(function (s) { return s.id === id; });
        status.name = name;
        status.color = chosen;
        if (canChangeWork) { status.countsAsWork = counts; }
      });
    } else {
      const id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);  // único: hora + azar
      const position = Math.max.apply(null, [-1].concat(statuses().map(function (s) { return s.position; }))) + 1;
      save(function (all) { all.push({ id: id, name: name, color: chosen, countsAsWork: counts, position: position }); });
    }
  });

  // Quitar (solo si no está en uso): pide un segundo toque
  removeButton.addEventListener("click", function () {
    const id = editing.id;
    if (window.Schedule.statusUses(id)) { showForm(editing); return; }  // se empezó a usar mientras tanto
    if (!confirming) {
      confirming = true;
      removeButton.textContent = "Sí, quitar «" + editing.name + "»";
      return;
    }
    save(function (all) { all.splice(all.findIndex(function (s) { return s.id === id; }), 1); });
  });

  list.addEventListener("click", function (event) {
    const row = event.target.closest(".sort-row");
    if (row) { showForm(statuses().find(function (s) { return s.id === row.dataset.id; })); }
  });
  document.getElementById("status-add").addEventListener("click", function () { showForm(null); });
  document.getElementById("status-back").addEventListener("click", showList);
  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  document.getElementById("status-button").addEventListener("click", function () {
    document.querySelector(".manage-menu").open = false;
    open();
  });

  function open() {
    dialog.showModal();
    showList();
  }

  return { open: open };
})();
