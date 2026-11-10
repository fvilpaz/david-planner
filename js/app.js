// Cuadrante semanal (paso 1: solo lectura). Pinta de lunes a domingo la semana de «?week=AAAA-MM-DD» (o la de hoy).
// Todo se construye con textContent, nunca con innerHTML: los nombres los escribirá David y así no se puede colar
// ningún trozo de HTML o de código en la página.
(function () {
  "use strict";
  const data = window.DEMO_DATA;
  const Dates = window.Dates;
  const grid = document.getElementById("schedule-grid");
  const title = document.getElementById("week-title");
  const picker = document.getElementById("week-picker");
  const dayName = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric" });
  const shortDate = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
  const statusById = new Map(data.statuses.map(function (status) { return [status.id, status]; }));

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
  }

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

  function cell(employee, isoDay) {
    const box = el("div", "cell");
    const shift = data.shifts[employee.id + "|" + isoDay];
    const status = shift && statusById.get(shift.statusId);
    if (!status) { return box; }
    if (status.countsAsWork) {
      shift.slots.forEach(function (slot) { box.append(chip(slot.start + "–" + slot.end, employee.color)); });
    } else {
      box.append(chip(status.name, status.color));
    }
    return box;
  }

  function render() {
    const monday = shownMonday();
    const days = [0, 1, 2, 3, 4, 5, 6].map(function (n) { return Dates.addDays(monday, n); });
    const today = Dates.toIso(new Date());

    title.textContent = shortDate.format(days[0]) + " — " + shortDate.format(days[6]) + " " + days[6].getFullYear();
    document.getElementById("print-title").textContent = "Turnos · " + title.textContent;
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
        const isoDay = Dates.toIso(day);
        row.appendChild(el("td", isoDay === today ? "today" : "")).append(cell(employee, isoDay));
      });
    });
    if (!employees.length) {
      const empty = body.appendChild(el("tr")).appendChild(el("td", "empty", "Todavía no hay personal."));
      empty.colSpan = 8;
    }
    grid.replaceChildren(table);
  }

  // Elegir un día en el calendario lleva a su semana
  picker.addEventListener("change", function () {
    const day = Dates.parseIso(picker.value);
    if (day) { window.location.search = weekLink(Dates.weekStart(day)); }
  });

  render();
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
