// Clientes previstos y camareros por día (paso 14b). Separado de app.js el 11-nov (refactor): app.js pinta el cuadrante y este
// archivo, la tabla de debajo. app.js le pasa lo que necesita al crearlo (create): los datos (como función, porque se vuelven a
// cargar si otra pestaña los cambia), cómo crear elementos y etiquetas, el estado de un turno, la clave de una casilla, el nombre
// del día y quién sale en una semana. Así este archivo no mete mano en las tripas del cuadrante (inyección de dependencias).
//
// Debajo del cuadrante, una segunda tabla (con un hueco entre las dos) y con las mismas columnas: su cabecera son los clientes
// previstos (se escriben), y debajo los camareros que trabajan ese día (se cuentan solos: el total y, por sitio, en etiquetas
// como las de las casillas, con el color del sitio) y los clientes por camarero (solo el número: sin colores ni «ideal», que
// Nando quitó el 11-nov porque confundían más que ayudaban). Los clientes van por FECHA, no por persona.
window.Clients = (function () {
  "use strict";
  const Dates = window.Dates;
  const ratioFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  const NO_PLACE_COLOR = "#7f8c8d";   // gris: «sin sitio» no es un punto de venta y no tiene color propio
  const RATIO_COLOR = "#2f5d8a";      // un solo tono, siempre el mismo: la etiqueta informa, no avisa

  // Un número entero de 0 a `max`; vacío = null (quitar); lo demás, undefined (no vale)
  // (un campo numérico con algo escrito que no es número, como «12e», da "" pero con badInput: eso NO es «vacío»)
  function wholeNumber(input, min, max) {
    const clean = input.value.trim();
    if (clean === "") { return input.validity.badInput ? undefined : null; }
    const n = Number(clean);
    return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
  }

  // Un campo de número entero. `field`: read() lo guardado (o null), write(n) guardarlo (null = quitarlo) y repaint() repintar
  // lo que depende de él. Al escribir un número válido se guarda y se repinta ya; al salir del campo se aplica también el vacío
  // y se enseña lo que quedó guardado. Lo no válido (negativo, decimal, «12e»…) se descarta. Vaciar no se aplica mientras se
  // escribe: al corregir una cifra se perdería el dato.
  function bindNumber(input, min, max, field) {
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.step = "1";
    input.inputMode = "numeric";
    function show() { const value = field.read(); input.value = value === null ? "" : String(value); }
    show();
    input.addEventListener("input", function () {
      const value = wholeNumber(input, min, max);
      if (value !== undefined && value !== null) { field.write(value); field.repaint(); }
    });
    input.addEventListener("change", function () {
      const value = wholeNumber(input, min, max);
      if (value !== undefined) { field.write(value); }
      show();
      field.repaint();
    });
  }

  function create(deps) {
    const getData = deps.getData;
    const el = deps.el;
    const chip = deps.chip;
    const statusOf = deps.statusOf;
    const shiftKey = deps.shiftKey;
    const dayName = deps.dayName;
    const shownEmployees = deps.shownEmployees;

    function clientsOf(iso) { const data = getData(); return Number.isInteger(data.clients[iso]) ? data.clients[iso] : null; }

    // Los camareros de un día: personas con un estado que cuenta como trabajo y algún tramo. Cada una cuenta UNA vez en el
    // total y una vez en cada sitio donde trabaja ese día (un turno partido en dos sitios suma en los dos).
    function crew(iso) {
      const data = getData();
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

    // Clientes, camareros y clientes por camarero de ese día. `ratio` es null si no hay clientes o nadie trabaja.
    function ratioInfo(iso) {
      const clients = clientsOf(iso);
      const total = crew(iso).total;
      return { clients: clients, total: total, ratio: clients !== null && total ? clients / total : null };
    }

    // Cambio en los clientes de un día: si el navegador no deja guardar, se deshace. Devuelve si se ha guardado.
    function setClients(iso, value) {
      const data = getData();
      const before = data.clients[iso];
      if (value === null) { delete data.clients[iso]; } else { data.clients[iso] = value; }
      const saved = window.Store.save(data);
      if (!saved) { if (before === undefined) { delete data.clients[iso]; } else { data.clients[iso] = before; } }
      return saved;
    }

    function paintCrew(cell, iso) {
      const info = crew(iso);
      cell.replaceChildren(el("span", "crew-total", String(info.total)));
      const chips = cell.appendChild(el("div", "crew-chips"));
      function label(text, color) { chips.appendChild(chip(text, color)).classList.add("crew-place"); }
      info.byPlace.forEach(function (place) { label(place.n + " " + window.I18n.displayPlace(place), place.color); });
      if (info.noPlace && info.byPlace.length) { label(window.I18n.t("clients.noPlace", { n: info.noPlace }), NO_PLACE_COLOR); }
    }

    // Solo el número («20»: la fila ya dice «Clientes por camarero»); «sin camareros» si hay clientes y nadie trabaja; «—» si no hay
    // clientes (o son 0 y nadie trabaja)
    function paintRatio(cell, iso) {
      const info = ratioInfo(iso);
      if (info.ratio !== null) { cell.replaceChildren(chip(ratioFormat.format(info.ratio), RATIO_COLOR)); return; }
      if (info.clients) { cell.replaceChildren(chip(window.I18n.t("clients.noWaiters"), RATIO_COLOR)); return; }
      cell.replaceChildren(el("span", "summary-empty", "—"));
    }

    function table(days) {
      const summary = el("table", "schedule-table summary-table");
      const clientsRow = summary.appendChild(el("thead")).appendChild(el("tr", "summary-head"));
      clientsRow.appendChild(el("th", "", window.I18n.t("summary.clients"))).dataset.i18n = "summary.clients";
      const body = summary.appendChild(el("tbody"));
      const today = Dates.toIso(new Date());
      function addRow(className, key) {
        const tr = body.appendChild(el("tr", className));
        const th = tr.appendChild(el("th", "", window.I18n.t(key)));
        th.dataset.i18n = key;   // apply() la vuelve a escribir al cambiar de idioma
        th.scope = "row";
        return tr;
      }
      const crewRow = addRow("summary-row", "summary.crew");
      const ratioRow = addRow("summary-row", "summary.ratio");

      days.forEach(function (day) {
        const iso = Dates.toIso(day);
        const mark = iso === today ? "today" : "";
        const input = clientsRow.appendChild(el("th", mark)).appendChild(el("input", "clients-input"));
        input.placeholder = "—";
        input.setAttribute("aria-label", window.I18n.t("clients.aria", { day: dayName.format(day) }));
        paintCrew(crewRow.appendChild(el("td", mark)), iso);
        const ratioCell = ratioRow.appendChild(el("td", mark));
        paintRatio(ratioCell, iso);
        bindNumber(input, 0, 99999, {
          read: function () { return clientsOf(iso); },
          write: function (value) { setClients(iso, value); },
          repaint: function () { paintRatio(ratioCell, iso); },
        });
      });
      return summary;
    }

    return { crew: crew, ratioInfo: ratioInfo, clientsOf: clientsOf, table: table };
  }

  return { create: create };
})();
