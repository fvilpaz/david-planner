// Cuadrante semanal. Pinta de lunes a domingo la semana de «?week=AAAA-MM-DD» (o la de hoy); cada casilla es un
// botón que abre su ventana (cell.js). Los datos salen de storage.js.
// Todo se construye con textContent, nunca con innerHTML: los nombres los escribirá David y así no se puede colar
// ningún trozo de HTML o de código en la página.
window.Schedule = (function () {
  "use strict";
  const Dates = window.Dates;
  let data = window.Store.load();
  const grid = document.getElementById("schedule-grid");
  const summaryGrid = document.getElementById("summary-grid");   // la tabla de clientes y camareros (paso 14b)
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

  // «Colorear por» (paso 14a): «persona» (como siempre) o «sitio»: cada tramo con punto de venta toma el color de ese
  // punto. Se guarda en este aparato, como el tema («dp_color_by»), y se lee una sola vez al arrancar.
  let colorMode = "persona";
  try { if (localStorage.getItem("dp_color_by") === "sitio") { colorMode = "sitio"; } } catch (e) { /* sin almacenamiento: por persona */ }

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
        const tint = colorMode === "sitio" && place && place.color ? place.color : employee.color;  // sin sitio: el de la persona
        slotsBox.append(chip(text, tint, place && place.name));
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

  // ---------- Clientes previstos y camareros por día (paso 14b) ----------
  // Debajo del cuadrante, una segunda tabla (con un hueco entre las dos) y con las mismas columnas: su cabecera son los clientes
  // previstos (se escriben), y debajo los camareros que trabajan ese día (se cuentan solos: el total y, por
  // sitio, en etiquetas como las de las casillas, con el color del sitio) y la proporción de clientes por camarero (verde hasta
  // el «Ideal», naranja hasta un 25 % más, rojo por encima). Los clientes van por FECHA, no por persona.
  const RATIO_COLORS = { ok: "#27ae60", warn: "#e67e22", bad: "#c0392b" };
  const RATIO_WORDS = { ok: "en el ideal o por debajo", warn: "algo por encima del ideal", bad: "muy por encima del ideal" };
  const ratioFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  const NO_PLACE_COLOR = "#7f8c8d";   // gris: «sin sitio» no es un punto de venta y no tiene color propio

  // Quien está de baja desde una semana no sale de esa semana en adelante, pero sí en las anteriores (histórico)
  function shownEmployees(isoMonday) {
    return data.employees
      .filter(function (e) { return !e.leftFrom || e.leftFrom > isoMonday; })
      .sort(function (a, b) { return a.position - b.position; });
  }

  function clientsOf(iso) { return Number.isInteger(data.clients[iso]) ? data.clients[iso] : null; }
  function ratioMax() { return data.ratioMax; }

  // Los camareros de un día: personas con un estado que cuenta como trabajo y algún tramo. Cada una cuenta UNA vez en el
  // total y una vez en cada sitio donde trabaja ese día (un turno partido en dos sitios suma en los dos).
  function crew(iso) {
    const monday = Dates.toIso(Dates.weekStart(Dates.parseIso(iso)));
    const perPlace = Object.create(null);   // sin prototipo: un sitio con id «constructor» o «__proto__» no choca (auditoría 11-nov)
    let total = 0;
    let noPlace = 0;
    shownEmployees(monday).forEach(function (employee) {
      const shift = data.shifts[shiftKey(employee.id, iso)];
      const status = shift && statusOf(shift.statusId);
      if (!status || !status.countsAsWork || !shift.slots.length) { return; }
      total++;
      new Set(shift.slots.map(function (slot) { return slot.placeId || ""; })).forEach(function (id) {
        if (id) { perPlace[id] = (perPlace[id] || 0) + 1; } else { noPlace++; }
      });
    });
    const byPlace = data.places.slice().sort(function (a, b) { return a.position - b.position; })
      .filter(function (place) { return perPlace[place.id]; })
      .map(function (place) { return { id: place.id, name: place.name, color: place.color, n: perPlace[place.id] }; });
    return { total: total, noPlace: noPlace, byPlace: byPlace };
  }

  // Clientes, camareros, proporción y color de ese día (null si no se han puesto clientes)
  function ratioInfo(iso) {
    const clients = clientsOf(iso);
    const total = crew(iso).total;
    if (clients === null) { return { clients: null, total: total, ratio: null, level: null }; }
    const ratio = total ? clients / total : null;   // sin camareros no hay proporción
    const level = !total ? (clients > 0 ? "bad" : null) : ratio <= ratioMax() ? "ok" : ratio <= ratioMax() * 1.25 ? "warn" : "bad";
    return { clients: clients, total: total, ratio: ratio, level: level };
  }

  // Cambios en los clientes o en el ideal (`ratioMax` en los datos): si el navegador no deja guardar, se deshace. Devuelve si se ha guardado.
  function setClients(iso, value) {
    const before = data.clients[iso];
    if (value === null) { delete data.clients[iso]; } else { data.clients[iso] = value; }
    const saved = window.Store.save(data);
    if (!saved) { if (before === undefined) { delete data.clients[iso]; } else { data.clients[iso] = before; } }
    return saved;
  }
  function setRatioMax(value) {
    const before = data.ratioMax;
    data.ratioMax = value;
    const saved = window.Store.save(data);
    if (!saved) { data.ratioMax = before; }
    return saved;
  }

  function paintCrew(cell, iso) {
    const info = crew(iso);
    cell.replaceChildren(el("span", "crew-total", String(info.total)));
    const chips = cell.appendChild(el("div", "crew-chips"));
    function label(text, color) { chips.appendChild(chip(text, color)).classList.add("crew-place"); }
    info.byPlace.forEach(function (place) { label(place.n + " " + place.name, place.color); });
    if (info.noPlace && info.byPlace.length) { label(info.noPlace + " sin sitio", NO_PLACE_COLOR); }
  }

  function paintRatio(cell, iso) {
    const info = ratioInfo(iso);
    if (info.level === null) { cell.replaceChildren(el("span", "summary-empty", "—")); return; }
    const node = chip(info.ratio === null ? "sin camareros" : ratioFormat.format(info.ratio) + " por camarero", RATIO_COLORS[info.level]);
    node.title = info.ratio === null ? "Hay clientes previstos y nadie trabaja" :
      ratioFormat.format(info.ratio) + " clientes por camarero: " + RATIO_WORDS[info.level] + " (ideal " + ratioMax() + ")";
    cell.replaceChildren(node);
  }

  // Un número entero de 0 a `max`; vacío = null (quitar); lo demás, undefined (no vale)
  // (un campo numérico con algo escrito que no es número, como «12e», da "" pero con badInput: eso NO es «vacío»)
  function wholeNumber(input, min, max) {
    const clean = input.value.trim();
    if (clean === "") { return input.validity.badInput ? undefined : null; }
    const n = Number(clean);
    return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
  }

  function summaryTable(days) {
    const table = el("table", "schedule-table summary-table");
    const clientsRow = table.appendChild(el("thead")).appendChild(el("tr", "summary-head"));
    clientsRow.appendChild(el("th", "", "Clientes previstos"));
    const body = table.appendChild(el("tbody"));
    const today = Dates.toIso(new Date());
    function addRow(className, ...content) {
      const tr = body.appendChild(el("tr", className));
      const th = tr.appendChild(el("th"));
      th.scope = "row";
      th.append(...content);
      return tr;
    }
    const crewRow = addRow("summary-row", "Camareros");
    const maxLabel = el("label", "ratio-max", "Ideal ");
    maxLabel.title = "Ideal de clientes por camarero: lo pone cada local (no es lo mismo un restaurante que un bufé o una barra). " +
      "Hasta ese número, la etiqueta sale en verde; hasta un 25 % más, en naranja; por encima, en rojo.";
    const maxInput = maxLabel.appendChild(el("input", "ratio-max-input"));
    maxInput.type = "number";
    maxInput.min = "1";
    maxInput.max = "999";
    maxInput.step = "1";
    maxInput.inputMode = "numeric";
    maxInput.value = String(ratioMax());
    maxInput.setAttribute("aria-label", "Ideal de clientes por camarero");
    const ratioRow = addRow("summary-row", el("span", "", "Clientes por camarero"), maxLabel);
    const ratioCells = [];

    days.forEach(function (day) {
      const iso = Dates.toIso(day);
      const mark = iso === today ? "today" : "";
      const input = clientsRow.appendChild(el("th", mark)).appendChild(el("input", "clients-input"));
      input.type = "number";
      input.min = "0";
      input.max = "99999";
      input.step = "1";
      input.inputMode = "numeric";
      input.placeholder = "—";
      input.value = clientsOf(iso) === null ? "" : String(clientsOf(iso));
      input.setAttribute("aria-label", "Clientes previstos el " + dayName.format(day));
      paintCrew(crewRow.appendChild(el("td", mark)), iso);
      const ratioCell = ratioRow.appendChild(el("td", mark));
      paintRatio(ratioCell, iso);
      ratioCells.push([ratioCell, iso]);
      input.addEventListener("input", function () {   // mientras se escribe: un número válido se guarda y se recolorea ya; vaciar espera a salir
        const value = wholeNumber(input, 0, 99999);
        if (value !== undefined && value !== null) { setClients(iso, value); paintRatio(ratioCell, iso); }
      });
      input.addEventListener("change", function () {
        const value = wholeNumber(input, 0, 99999);
        if (value !== undefined) { setClients(iso, value); }   // lo no válido (negativo, decimal, texto) se descarta
        input.value = clientsOf(iso) === null ? "" : String(clientsOf(iso));   // se ve lo que quedó guardado
        paintRatio(ratioCell, iso);
      });
    });
    maxInput.addEventListener("input", function () {
      const value = wholeNumber(maxInput, 1, 999);
      if (value !== undefined && value !== null) {
        setRatioMax(value);
        ratioCells.forEach(function (pair) { paintRatio(pair[0], pair[1]); });
      }
    });
    maxInput.addEventListener("change", function () {
      const value = wholeNumber(maxInput, 1, 999);
      if (value !== undefined && value !== null) { setRatioMax(value); }
      maxInput.value = String(ratioMax());
      ratioCells.forEach(function (pair) { paintRatio(pair[0], pair[1]); });
    });
    return table;
  }

  // Las dos tablas tienen las mismas columnas por CSS; en el móvil, deslizar una desliza la otra
  grid.addEventListener("scroll", function () { if (summaryGrid.scrollLeft !== grid.scrollLeft) { summaryGrid.scrollLeft = grid.scrollLeft; } });
  summaryGrid.addEventListener("scroll", function () { if (grid.scrollLeft !== summaryGrid.scrollLeft) { grid.scrollLeft = summaryGrid.scrollLeft; } });

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
    const employees = shownEmployees(isoMonday);
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
    summaryGrid.replaceChildren(summaryTable(days));
    grid.scrollLeft = scroll.left;
    grid.scrollTop = scroll.top;
    summaryGrid.scrollLeft = grid.scrollLeft;
    syncColorBy();
  }

  // El interruptor «Colorear por» solo sale si hay puntos de venta; marca el que está puesto
  function syncColorBy() {
    const group = document.getElementById("colorby-group");
    group.hidden = data.places.length === 0;
    group.querySelectorAll("[data-colorby]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.colorby === colorMode));
    });
  }

  function setColorBy(mode) {
    colorMode = mode === "sitio" ? "sitio" : "persona";
    try { localStorage.setItem("dp_color_by", colorMode); } catch (e) { /* se aplica igual, pero no se recordará */ }
    render();
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

  // «Copiar a…» (paso 13, idea de David): copia el estado, el horario (los dos tramos) y el sitio de una casilla a otra
  // que esté LIBRE; sin horas extra (son de un día concreto, como al copiar semanas). Devuelve "ok", "empty" (no hay
  // nada que copiar), "occupied" (la de destino ya tiene algo: nunca se pisa) o "error" (no se pudo guardar: no cambia).
  function copyShift(fromKey, toKey) {
    const from = data.shifts[fromKey];
    if (!from) { return "empty"; }
    if (data.shifts[toKey]) { return "occupied"; }
    data.shifts[toKey] = { statusId: from.statusId, slots: from.slots.map(function (slot) { return Object.assign({}, slot); }), overtime: null };
    if (!window.Store.save(data)) { delete data.shifts[toKey]; render(); return "error"; }
    render();
    return "ok";
  }

  // «Copiar la semana anterior» (paso 8, como gestion-hosteleria/scheduling/week.py): la semana anterior a la que se
  // ve se repite en esta y en las siguientes (`weeks`, de 1 a 8), SOLO en casillas vacías, SIN horas extra (son de un
  // día concreto) y SIN quien esté de baja en la semana de destino. Los puntos de venta sí se copian. Todo o nada: si
  // no se puede guardar, no se copia ninguna. Devuelve { copied, sourceEmpty } (copied = -1 si no se pudo guardar).
  function copyPreviousWeek(weeks) {
    const monday = shownMonday();
    const source = Dates.addDays(monday, -7);
    const before = JSON.stringify(data.shifts);
    let copied = 0;
    let sourceEmpty = true;
    for (let w = 0; w < weeks; w++) {
      const target = Dates.addDays(monday, 7 * w);
      const targetIso = Dates.toIso(target);
      data.employees.forEach(function (employee) {
        if (employee.leftFrom && employee.leftFrom <= targetIso) { return; }  // de baja en esa semana
        for (let day = 0; day < 7; day++) {
          const from = data.shifts[shiftKey(employee.id, Dates.toIso(Dates.addDays(source, day)))];
          if (!from) { continue; }
          sourceEmpty = false;
          const toKey = shiftKey(employee.id, Dates.toIso(Dates.addDays(target, day)));
          if (data.shifts[toKey]) { continue; }  // no pisa lo ya puesto
          data.shifts[toKey] = { statusId: from.statusId, slots: JSON.parse(JSON.stringify(from.slots)), overtime: null };
          copied++;
        }
      });
    }
    if (copied && !window.Store.save(data)) {
      data.shifts = JSON.parse(before);
      copied = -1;
    }
    render();
    return { copied: copied, sourceEmpty: sourceEmpty };
  }

  // «9–15 nov 2026» de la semana que empieza en `monday`
  function weekLabel(monday) { return weekRange.formatRange(monday, Dates.addDays(monday, 6)); }

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
    copyPreviousWeek: copyPreviousWeek,
    weekLabel: weekLabel,
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
    copyShift: copyShift,
    render: render,
    setColorBy: setColorBy,
    colorBy: function () { return colorMode; },
    crew: crew,
    ratioInfo: ratioInfo,
    clientsOf: clientsOf,
    ratioMax: ratioMax,
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

  // «Colorear por» (paso 14a): Schedule lo guarda y repinta (y lo oculta mientras no haya puntos de venta)
  menu.querySelectorAll("[data-colorby]").forEach(function (button) {
    button.addEventListener("click", function () { window.Schedule.setColorBy(button.dataset.colorby); });
  });

  // «Copiar la semana anterior»: al abrir el apartado se dice qué semana se copia; el resultado sale ahí mismo
  const copyGroup = document.getElementById("copy-group");
  const copyResult = document.getElementById("copy-result");
  copyGroup.addEventListener("toggle", function () {
    if (!copyGroup.open) { return; }
    const monday = window.Schedule.shownMonday();
    document.getElementById("copy-source").textContent = "Copia la semana del " +
      window.Schedule.weekLabel(window.Dates.addDays(monday, -7)) + " en la del " + window.Schedule.weekLabel(monday) +
      " y, si quieres, en las siguientes. Solo en casillas vacías y sin horas extra.";
    copyResult.textContent = "";
  });
  // Al tocar el número de semanas se selecciona entero (con 1 cifra como máximo, si no, no dejaría escribir otra)
  const copyWeeks = document.getElementById("copy-weeks");
  copyWeeks.addEventListener("click", function () { copyWeeks.select(); });
  copyWeeks.addEventListener("focus", function () { copyWeeks.select(); });
  document.getElementById("copy-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const weeks = Math.min(Math.max(parseInt(document.getElementById("copy-weeks").value, 10) || 1, 1), 8);
    document.getElementById("copy-weeks").value = String(weeks);
    const result = window.Schedule.copyPreviousWeek(weeks);
    const inWeeks = weeks === 1 ? "esta semana" : weeks + " semanas";
    if (result.copied < 0) {
      copyResult.textContent = "No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha copiado nada.";
    } else if (result.sourceEmpty) {
      copyResult.textContent = "La semana anterior está vacía: no hay nada que copiar.";
    } else if (!result.copied) {
      copyResult.textContent = "No había casillas vacías en " + inWeeks + ": no se ha cambiado nada.";
    } else {
      copyResult.textContent = "Copiados " + result.copied + (result.copied === 1 ? " turno" : " turnos") + " en " + inWeeks + ".";
    }
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
