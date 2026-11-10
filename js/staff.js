// Ventana «Personal»: la lista y, al tocar a alguien (o «Añadir persona»), su ficha con nombre y color. Se abre desde
// «Gestión» o tocando un nombre en el cuadrante (entonces, al guardar, se vuelve directamente al cuadrante).
// Quitar: sin ningún turno, se borra del todo (no hay histórico que guardar); con turnos, se da de baja desde la
// semana que se está viendo (deja de salir de ahí en adelante, pero sigue en las anteriores) y se puede volver a dar
// de alta. «Quitar» y «Dar de baja» piden un segundo toque.
window.Staff = (function () {
  "use strict";
  const dialog = document.getElementById("staff-dialog");
  const title = document.getElementById("staff-title");
  const listView = document.getElementById("staff-list-view");
  const list = document.getElementById("staff-list");
  const form = document.getElementById("staff-form");
  const nameInput = document.getElementById("staff-name");
  const palette = document.getElementById("staff-palette");
  const note = document.getElementById("staff-note");
  const errorEl = document.getElementById("staff-error");
  const removeButton = document.getElementById("staff-remove");
  const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });
  let editing = null;      // la persona de la ficha (null = nueva)
  let color = null;        // el color elegido en la ficha
  let confirming = false;  // «Quitar» / «Dar de baja» esperan el segundo toque
  let fromGrid = false;    // abierta tocando un nombre del cuadrante

  function employees() { return window.Schedule.getData().employees; }

  function sorted() { return employees().slice().sort(function (a, b) { return a.position - b.position; }); }

  function longDate(iso) { return dateFormat.format(window.Dates.parseIso(iso)); }

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }

  function showList() {
    title.textContent = "Personal";
    showError("");
    form.hidden = true;
    listView.hidden = false;
    list.replaceChildren.apply(list, sorted().map(function (person, index) {
      const item = document.createElement("li");
      item.dataset.id = person.id;
      const row = item.appendChild(document.createElement("button"));
      row.type = "button";
      row.className = "sort-row" + (person.leftFrom ? " left" : "");
      row.dataset.id = person.id;
      const dot = row.appendChild(document.createElement("span"));
      dot.className = "swatch";
      dot.style.setProperty("--swatch", person.color);
      row.append(person.name);  // texto, nunca HTML
      if (person.leftFrom) { row.appendChild(document.createElement("small")).textContent = "de baja desde el " + longDate(person.leftFrom); }
      // Orden (paso 6b): el asa ⠿ y el número del puesto (lists.js), como «Ordenar» de gestion-hosteleria
      window.Lists.decorate(item, index, person.name);
      return item;
    }));
  }

  // Guarda el orden de la lista tal como está ahora (de arriba abajo: 0, 1, 2…) y la vuelve a pintar con sus números
  function saveOrder(ids) {
    const saved = window.Schedule.saveEmployees(function (people) {
      ids.forEach(function (id, position) { people.find(function (p) { return p.id === id; }).position = position; });
    });
    showList();  // con el orden guardado o, si no se pudo, con el de antes
    if (!saved) { showError("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada."); }
  }

  window.Lists.sortable(list, saveOrder);  // arrastrar por ⠿ o escribir el número (lists.js)

  // Un color que no lleve nadie en activo; si están todos cogidos, se repite la paleta
  function freeColor() {
    const used = employees().filter(function (p) { return !p.leftFrom; }).map(function (p) { return p.color; });
    return window.PALETTE.find(function (c) { return !used.includes(c); }) ||
      window.PALETTE[employees().length % window.PALETTE.length];
  }

  function renderPalette() { window.Lists.palette(palette, color, function (c) { color = c; renderPalette(); }); }

  // El botón de abajo cambia según la persona: Quitar (sin turnos), Dar de baja (con turnos) o Volver a dar de alta
  function setupRemove() {
    confirming = false;
    note.hidden = true;
    removeButton.hidden = !editing;
    if (!editing) { return; }
    removeButton.className = "danger";
    if (editing.leftFrom) {
      removeButton.className = "secondary";
      removeButton.textContent = "Volver a dar de alta";
      note.textContent = "De baja desde el " + longDate(editing.leftFrom) + ": no sale en el cuadrante de esa semana en adelante.";
      note.hidden = false;
    } else if (window.Schedule.hasShifts(editing.id)) {
      removeButton.textContent = "Dar de baja desde el " + longDate(window.Dates.toIso(window.Schedule.shownMonday()));
      note.textContent = "Tiene turnos: al darle de baja deja de salir desde esa semana, pero sigue en las anteriores. " +
        "No se borra nada y se puede volver a dar de alta.";
      note.hidden = false;
    } else {
      removeButton.textContent = "Quitar";
    }
  }

  function showForm(person) {
    editing = person;
    color = person ? person.color : freeColor();
    title.textContent = person ? "Editar a " + person.name : "Nueva persona";
    nameInput.value = person ? person.name : "";
    showError("");
    renderPalette();
    setupRemove();
    listView.hidden = true;
    form.hidden = false;
    nameInput.focus();
  }

  function back() {
    if (fromGrid) { dialog.close(); } else { showList(); }
  }

  function save(change) {
    if (window.Schedule.saveEmployees(change)) { back(); return; }
    showError("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = nameInput.value.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!name) { showError("Pon un nombre."); nameInput.focus(); return; }
    const chosen = color;
    if (editing) {
      const id = editing.id;
      save(function (people) {
        const person = people.find(function (p) { return p.id === id; });
        person.name = name;
        person.color = chosen;
      });
    } else {
      const id = "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);  // único: hora + azar
      const position = Math.max.apply(null, [-1].concat(employees().map(function (p) { return p.position; }))) + 1;
      save(function (people) { people.push({ id: id, name: name, color: chosen, position: position, leftFrom: null }); });
    }
  });

  removeButton.addEventListener("click", function () {
    const id = editing.id;
    if (editing.leftFrom) {
      save(function (people) { people.find(function (p) { return p.id === id; }).leftFrom = null; });
      return;
    }
    const withShifts = window.Schedule.hasShifts(id);
    if (!confirming) {
      confirming = true;
      removeButton.textContent = (withShifts ? "Sí, dar de baja a " : "Sí, quitar a ") + editing.name;
      return;
    }
    if (withShifts) {
      const from = window.Dates.toIso(window.Schedule.shownMonday());
      save(function (people) { people.find(function (p) { return p.id === id; }).leftFrom = from; });
    } else {
      save(function (people) { people.splice(people.findIndex(function (p) { return p.id === id; }), 1); });
    }
  });

  list.addEventListener("click", function (event) {
    const row = event.target.closest(".sort-row");
    if (row) { showForm(employees().find(function (p) { return p.id === row.dataset.id; })); }
  });
  document.getElementById("staff-add").addEventListener("click", function () { showForm(null); });
  document.getElementById("staff-back").addEventListener("click", back);
  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  document.getElementById("staff-button").addEventListener("click", function () {
    document.querySelector(".manage-menu").open = false;
    open();
  });

  // Desde «Gestión»: la lista
  function open() {
    fromGrid = false;
    dialog.showModal();
    showList();
  }

  // Tocando un nombre del cuadrante: su ficha directamente
  function edit(id) {
    const person = employees().find(function (p) { return p.id === id; });
    if (!person) { return; }
    fromGrid = true;
    dialog.showModal();  // primero abrir: el foco solo se puede dar a algo que ya se ve
    showForm(person);
  }

  return { open: open, edit: edit };
})();
