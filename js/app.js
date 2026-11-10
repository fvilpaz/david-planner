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

  function placeOf(id) { return data.places.find(function (place) { return place.id === id; }); }

  function shownMonday() {
    const asked = Dates.parseIso(new URLSearchParams(window.location.search).get("week"));
    return Dates.weekStart(asked || new Date());
  }

  // Enlace a una semana conservando lo demás de la dirección (así «?demo» no se pierde al pasar de semana)
  function weekLink(monday) {
    const params = new URLSearchParams(window.location.search);
    params.set("week", Dates.toIso(monday));
    return "?" + params.toString();
  }

  // Un tramo pintado en su color: trabajando, el de la persona; libre, vacaciones…, el del estado (como gestion-hosteleria)
  // `place` (opcional): el punto de venta, pequeño debajo de la hora (paso 7b; como «Terraza» en gestion-hosteleria)
  function chip(text, color, place) {
    const node = el("span", "chip", text);
    if (place) { node.append(el("small", "chip-place", place)); }
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
    const slotsBox = box.appendChild(el("span", "cell-slots"));  // los tramos, en columna; las extras, a su derecha
    if (status && status.countsAsWork) {
      shift.slots.forEach(function (slot) {
        const text = slot.start + "–" + slot.end;
        const place = slot.placeId && placeOf(slot.placeId);
        texts.push(text + (place ? " en " + place.name : ""));
        slotsBox.append(chip(text, employee.color, place && place.name));
      });
    } else if (status) {
      texts.push(status.name);
      slotsBox.append(chip(status.name, status.color));
    } else {
      slotsBox.append(el("span", "cell-empty", "+"));
    }
    // Horas extra: borde de aviso y franja «+2 h / extra» a la derecha; el motivo, al pasar el ratón y para el lector de pantalla
    if (status && status.countsAsWork && shift.overtime) {
      const amount = "+" + hoursFormat.format(shift.overtime.hours) + " h";
      const extra = amount + " extra";
      box.classList.add("has-overtime");
      box.appendChild(el("span", "overtime-tag")).append(el("span", "", amount), el("span", "", "extra"));
      texts.push(extra + (shift.overtime.reason ? " (" + shift.overtime.reason + ")" : ""));
      if (shift.overtime.reason) { box.title = shift.overtime.reason; }
    }
    box.setAttribute("aria-label", employee.name + ", " + dayName.format(day) + ": " + (texts.join(", ") || "vacía"));
    if (window.Swap && window.Swap.sourceKey() === key) { box.classList.add("swap-source"); }  // origen de «Intercambiar con…»
    return box;
  }

  function render() {
    const scroll = { left: grid.scrollLeft, top: grid.scrollTop };  // al repintar, no saltar al lunes
    const monday = shownMonday();
    const days = [0, 1, 2, 3, 4, 5, 6].map(function (n) { return Dates.addDays(monday, n); });
    const today = Dates.toIso(new Date());

    title.textContent = weekRange.formatRange(days[0], days[6]);
    const todayLink = document.getElementById("today-link");
    todayLink.hidden = Dates.toIso(monday) === Dates.toIso(Dates.weekStart(new Date()));
    todayLink.href = weekLink(Dates.weekStart(new Date()));
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
    // Quien está de baja desde una semana no sale de esa semana en adelante, pero sí en las anteriores (histórico)
    const isoMonday = Dates.toIso(monday);
    const employees = data.employees
      .filter(function (e) { return !e.leftFrom || e.leftFrom > isoMonday; })
      .sort(function (a, b) { return a.position - b.position; });
    employees.forEach(function (employee) {
      const row = body.appendChild(el("tr"));
      const name = row.appendChild(el("th"));
      name.scope = "row";
      // El nombre se toca para editar a la persona (staff.js)
      const nameButton = name.appendChild(el("button", "name-button", employee.name));
      nameButton.type = "button";
      nameButton.dataset.employee = employee.id;
      nameButton.setAttribute("aria-label", "Editar a " + employee.name);
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

  // Intercambia dos casillas (de cualquier persona y día), horas extra incluidas. Las dos a la vez: si el navegador
  // no deja guardar, no cambia ninguna. Si una está vacía, la otra se mueve a su sitio. Devuelve si se ha guardado.
  function swap(keyA, keyB) {
    const a = data.shifts[keyA];
    const b = data.shifts[keyB];
    function put(key, shift) { if (shift) { data.shifts[key] = shift; } else { delete data.shifts[key]; } }
    put(keyA, b);
    put(keyB, a);
    const saved = window.Store.save(data);
    if (!saved) { put(keyA, a); put(keyB, b); }
    render();
    return saved;
  }

  // Cambios en una lista de los datos («employees» o «statuses»): `change` la modifica; si el navegador no deja
  // guardar, se deshace. Lo usan staff.js (personal) y states.js (estados).
  function saveList(name, change) {
    const before = JSON.parse(JSON.stringify(data[name]));
    change(data[name]);
    const saved = window.Store.save(data);
    if (!saved) { data[name] = before; }
    render();
    return saved;
  }
  function saveEmployees(change) { return saveList("employees", change); }
  function saveStatuses(change) { return saveList("statuses", change); }
  function savePlaces(change) { return saveList("places", change); }

  // ¿En cuántos tramos se usa un punto de venta? (en uso no se puede quitar; sí renombrar)
  function placeUses(placeId) {
    return Object.keys(data.shifts).reduce(function (total, key) {
      return total + data.shifts[key].slots.filter(function (slot) { return slot.placeId === placeId; }).length;
    }, 0);
  }

  // ¿En cuántas casillas se usa un estado? (en uso no se puede quitar ni cambiar si cuenta como trabajo)
  function statusUses(statusId) {
    return Object.keys(data.shifts).filter(function (key) { return data.shifts[key].statusId === statusId; }).length;
  }

  // ¿Tiene algún turno, en cualquier semana? (sin turnos se puede borrar del todo; con turnos, solo dar de baja)
  function hasShifts(employeeId) {
    return Object.keys(data.shifts).some(function (key) { return key.split("|")[0] === employeeId; });
  }

  // Tras cerrar la ventana, el foco vuelve a la casilla (la de antes se sustituyó al repintar)
  function focusCell(key) {
    const button = grid.querySelector('[data-key="' + CSS.escape(key) + '"]');
    if (button) { button.focus({ preventScroll: true }); }
  }

  grid.addEventListener("click", function (event) {
    const nameButton = event.target.closest("button.name-button");
    if (nameButton) { window.Staff.edit(nameButton.dataset.employee); return; }
    const button = event.target.closest("button.cell");
    if (!button) { return; }
    if (window.Swap && window.Swap.pick(button.dataset.key)) { return; }  // en modo «Intercambiar con…», no se abre la ventana
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

  // En modo ejemplo («?demo») el título lo dice, para no confundirlo con los datos de verdad
  if (window.Store.DEMO) { document.querySelector(".section-header-title").textContent += " · ejemplo"; }

  render();
  return {
    shiftKey: shiftKey,
    shownMonday: shownMonday,
    saveEmployees: saveEmployees,
    saveStatuses: saveStatuses,
    statusUses: statusUses,
    savePlaces: savePlaces,
    placeUses: placeUses,
    hasShifts: hasShifts,
    statusOf: statusOf,
    getData: function () { return data; },
    update: update,
    swap: swap,
    render: render,
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
