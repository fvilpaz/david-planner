// Cuadrante semanal. Pinta de lunes a domingo la semana de «?week=AAAA-MM-DD» (o la de hoy); cada casilla es un
// botón que abre su ventana (cell.js). Los datos salen de storage.js.
// Todo se construye con textContent, nunca con innerHTML: los nombres los escribirá David y así no se puede colar
// ningún trozo de HTML o de código en la página.
window.Schedule = (function () {
  "use strict";
  const Dates = window.Dates;
  let data = window.Store.load();
  const grid = document.getElementById("schedule-grid");
  const title = document.getElementById("week-title");
  const picker = document.getElementById("week-picker");
  const dayName = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric" });
  const hoursFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });  // 1.5 → «1,5»
  // formatRange junta lo que se repite: «9–15 nov 2026», «30 nov – 6 dic 2026», «29 dic 2026 – 4 ene 2027»
  const weekRange = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

  function shiftKey(employeeId, isoDay) { return employeeId + "|" + isoDay; }

  function statusOf(id) { return data.statuses.find(function (status) { return status.id === id; }); }

  function shownMonday() {
    const asked = Dates.parseIso(new URLSearchParams(window.location.search).get("week"));
    return Dates.weekStart(asked || new Date());
  }

  function weekLink(monday) { return "?week=" + Dates.toIso(monday); }

  // Un tramo pintado en su color: trabajando, el de la persona; libre, vacaciones…, el del estado (como gestion-hosteleria)
  function chip(text, color) {
    const node = el("span", "chip", text);
    node.dataset.tint = color;
    node.style.setProperty("--tint", color);
    return node;
  }

  // La casilla es un botón (se toca con el dedo o con el teclado); vacía enseña un «+»
  function cell(employee, day) {
    const isoDay = Dates.toIso(day);
    const key = shiftKey(employee.id, isoDay);
    const box = el("button", "cell");
    box.type = "button";
    box.dataset.key = key;
    const shift = data.shifts[key];
    const status = shift && statusOf(shift.statusId);
    const texts = [];
    if (status && status.countsAsWork) {
      shift.slots.forEach(function (slot) {
        const text = slot.start + "–" + slot.end;
        texts.push(text);
        box.append(chip(text, employee.color));
      });
    } else if (status) {
      texts.push(status.name);
      box.append(chip(status.name, status.color));
    } else {
      box.append(el("span", "cell-empty", "+"));
    }
    // Horas extra: borde de aviso y «+2 h extra» debajo; el motivo, al pasar el ratón y para el lector de pantalla
    if (status && status.countsAsWork && shift.overtime) {
      const extra = "+" + hoursFormat.format(shift.overtime.hours) + " h extra";
      box.classList.add("has-overtime");
      box.append(el("span", "overtime-tag", extra));
      texts.push(extra + (shift.overtime.reason ? " (" + shift.overtime.reason + ")" : ""));
      if (shift.overtime.reason) { box.title = shift.overtime.reason; }
    }
    box.setAttribute("aria-label", employee.name + ", " + dayName.format(day) + ": " + (texts.join(", ") || "vacía"));
    return box;
  }

  function render() {
    const scroll = { left: grid.scrollLeft, top: grid.scrollTop };  // al repintar, no saltar al lunes
    const monday = shownMonday();
    const days = [0, 1, 2, 3, 4, 5, 6].map(function (n) { return Dates.addDays(monday, n); });
    const today = Dates.toIso(new Date());

    title.textContent = weekRange.formatRange(days[0], days[6]);
    document.getElementById("today-link").hidden = Dates.toIso(monday) === Dates.toIso(Dates.weekStart(new Date()));
    document.getElementById("print-week").textContent = title.textContent;  // el nombre del local lo pone brand.js
    picker.value = Dates.toIso(monday);
    document.getElementById("prev-week").href = weekLink(Dates.addDays(monday, -7));
    document.getElementById("next-week").href = weekLink(Dates.addDays(monday, 7));

    const table = el("table", "schedule-table");
    const headRow = el("tr");
    headRow.append(el("th", "", "Empleado"));
    days.forEach(function (day) {
      const th = el("th", Dates.toIso(day) === today ? "today" : "", dayName.format(day));
      th.scope = "col";
      headRow.append(th);
    });
    table.appendChild(el("thead")).append(headRow);  // appendChild devuelve el nodo añadido; append no devuelve nada

    const body = table.appendChild(el("tbody"));
    const employees = data.employees.slice().sort(function (a, b) { return a.position - b.position; });
    employees.forEach(function (employee) {
      const row = body.appendChild(el("tr"));
      const name = row.appendChild(el("th", "", employee.name));
      name.scope = "row";
      days.forEach(function (day) {
        row.appendChild(el("td", Dates.toIso(day) === today ? "today" : "")).append(cell(employee, day));
      });
    });
    if (!employees.length) {
      const empty = body.appendChild(el("tr")).appendChild(el("td", "empty", "Todavía no hay personal."));
      empty.colSpan = 8;
    }
    grid.replaceChildren(table);
    grid.scrollLeft = scroll.left;
    grid.scrollTop = scroll.top;
  }

  // Guarda (o vacía, con null) una casilla. Si el navegador no deja guardar, se deshace el cambio: así nunca se ve
  // algo que desaparecería al recargar. Devuelve si se ha guardado.
  function update(key, shift) {
    const before = data.shifts[key];
    if (shift) { data.shifts[key] = shift; } else { delete data.shifts[key]; }
    const saved = window.Store.save(data);
    if (!saved) {
      if (before) { data.shifts[key] = before; } else { delete data.shifts[key]; }
    }
    render();
    return saved;
  }

  // Tras cerrar la ventana, el foco vuelve a la casilla (la de antes se sustituyó al repintar)
  function focusCell(key) {
    const button = grid.querySelector('[data-key="' + CSS.escape(key) + '"]');
    if (button) { button.focus({ preventScroll: true }); }
  }

  grid.addEventListener("click", function (event) {
    const button = event.target.closest("button.cell");
    if (!button) { return; }
    const parts = button.dataset.key.split("|");
    const employee = data.employees.find(function (e) { return e.id === parts[0]; });
    if (employee) { window.CellDialog.open(employee, parts[1]); }
  });

  // La app abierta en dos sitios (dos pestañas, o la instalada y el navegador): si la otra guarda, esta se pone al
  // día. Sin esto, al guardar aquí se pisaría lo de la otra con datos viejos.
  window.addEventListener("storage", function (event) {
    if (event.key === window.Store.KEY) { data = window.Store.load(); render(); }
  });

  // Tocar el título abre el calendario del aparato. showPicker() es lo moderno; si el navegador no lo tiene, se
  // le da el foco al campo (y el teclado o la rueda de fechas del móvil hacen el resto).
  document.getElementById("week-title-button").addEventListener("click", function () {
    try { picker.showPicker(); } catch (e) { picker.focus(); }
  });

  // Elegir un día en el calendario lleva a su semana
  picker.addEventListener("change", function () {
    const day = Dates.parseIso(picker.value);
    if (day) { window.location.search = weekLink(Dates.weekStart(day)); }
  });

  render();
  return {
    shiftKey: shiftKey,
    statusOf: statusOf,
    getData: function () { return data; },
    update: update,
    focusCell: focusCell,
  };
})();

// Menú «Gestión»: Imprimir / PDF y Tema. Se cierra al tocar fuera o con Escape (como en gestion-hosteleria).
(function () {
  "use strict";
  const menu = document.querySelector(".manage-menu");
  const themeButtons = menu.querySelectorAll("[data-theme-choice]");

  function markTheme() {
    const now = window.Theme.current();
    themeButtons.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.themeChoice === now)); });
  }

  themeButtons.forEach(function (button) {
    button.addEventListener("click", function () { window.Theme.apply(button.dataset.themeChoice); markTheme(); });
  });

  // Imprimir abre el cuadro del navegador, que ya trae «Guardar como PDF». El menú se cierra antes para no salir en papel.
  document.getElementById("print-button").addEventListener("click", function () {
    menu.open = false;
    window.print();
  });

  document.addEventListener("click", function (event) {
    if (menu.open && !menu.contains(event.target)) { menu.open = false; }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.open) { menu.open = false; menu.querySelector("summary").focus(); }
  });

  markTheme();
})();
