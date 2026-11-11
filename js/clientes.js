// Clientes previstos y camareros por día (paso 14b). Separado de app.js el 11-nov (refactor): app.js pinta el cuadrante y este
// archivo, la tabla de debajo. app.js le pasa lo que necesita al crearlo (create): los datos (como función, porque se vuelven a
// cargar si otra pestaña los cambia), cómo crear elementos y etiquetas, el estado de un turno, la clave de una casilla, el nombre
// del día y quién sale en una semana. Así este archivo no mete mano en las tripas del cuadrante (inyección de dependencias).
//
// Debajo del cuadrante, una segunda tabla (con un hueco entre las dos) y con las mismas columnas: su cabecera son los clientes
// previstos (se escriben), y debajo los camareros que trabajan ese día (se cuentan solos: el total y, por sitio, en etiquetas
// como las de las casillas, con el color del sitio) y la proporción de clientes por camarero (verde hasta el «Ideal», naranja
// hasta un 25 % más, rojo por encima). Los clientes van por FECHA, no por persona.
window.Clients = (function () {
  "use strict";
  const Dates = window.Dates;
  const RATIO_COLORS = { ok: "#27ae60", warn: "#e67e22", bad: "#c0392b" };
  const RATIO_WORDS = { ok: "en el ideal o por debajo", warn: "algo por encima del ideal", bad: "muy por encima del ideal" };
  const ratioFormat = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 });
  const NO_PLACE_COLOR = "#7f8c8d";   // gris: «sin sitio» no es un punto de venta y no tiene color propio

  // Un número entero de 0 a `max`; vacío = null (quitar); lo demás, undefined (no vale)
  // (un campo numérico con algo escrito que no es número, como «12e», da "" pero con badInput: eso NO es «vacío»)
  function wholeNumber(input, min, max) {
    const clean = input.value.trim();
    if (clean === "") { return input.validity.badInput ? undefined : null; }
    const n = Number(clean);
    return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
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
    function ratioMax() { return getData().ratioMax; }

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
      const data = getData();
      const before = data.clients[iso];
      if (value === null) { delete data.clients[iso]; } else { data.clients[iso] = value; }
      const saved = window.Store.save(data);
      if (!saved) { if (before === undefined) { delete data.clients[iso]; } else { data.clients[iso] = before; } }
      return saved;
    }
    function setRatioMax(value) {
      const data = getData();
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

    function table(days) {
      const summary = el("table", "schedule-table summary-table");
      const clientsRow = summary.appendChild(el("thead")).appendChild(el("tr", "summary-head"));
      clientsRow.appendChild(el("th", "", "Clientes previstos"));
      const body = summary.appendChild(el("tbody"));
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
      return summary;
    }

    return { crew: crew, ratioInfo: ratioInfo, clientsOf: clientsOf, ratioMax: ratioMax, table: table };
  }

  return { create: create };
})();
