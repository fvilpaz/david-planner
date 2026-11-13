// Ventana de la casilla: estado, horario (uno o dos tramos), horas extra, Guardar y Vaciar. Como la de
// gestion-hosteleria con dos mejoras: un solo Guardar para toda la casilla, y si el estado no cuenta como trabajo el
// horario y las extras se ocultan al momento (allí seguían a la vista y se borraban al guardar).
window.CellDialog = (function () {
  "use strict";
  const dialog = document.getElementById("cell-dialog");
  const form = document.getElementById("cell-form");
  const statusSelect = document.getElementById("cell-status");
  const hours = document.getElementById("cell-hours");
  const overtime = document.getElementById("cell-overtime");
  const overtimeHours = document.getElementById("overtime-hours");
  const overtimeReason = document.getElementById("overtime-reason");
  const second = document.getElementById("slot-2");
  const addSlot = document.getElementById("add-slot");
  const clear = document.getElementById("cell-clear");
  const copy = document.getElementById("cell-copy");
  const errorEl = document.getElementById("cell-error");
  const t = window.I18n.t;   // los textos y los formatos de fecha siguen al idioma elegido (js/i18n.js)
  const longDay = window.I18n.formatter(Intl.DateTimeFormat, { weekday: "long", day: "numeric", month: "long" });
  const shortDay = window.I18n.formatter(Intl.DateTimeFormat, { weekday: "short", day: "numeric", month: "short" });
  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;  // «HH:MM» de 00:00 a 23:59
  let current = null;  // la casilla abierta: { key, shift }

  function slotInputs(n) { return form.querySelectorAll('[data-slot="' + n + '"] input'); }

  function sortedStatuses() {
    return window.Schedule.getData().statuses.slice().sort(function (a, b) { return a.position - b.position; });
  }

  function showError(text) {
    errorEl.textContent = text;
    errorEl.hidden = !text;
  }

  function showSecond(on) {
    second.hidden = !on;
    addSlot.hidden = on;
    if (!on) { slotInputs(2).forEach(function (input) { input.value = ""; }); placeSelect(2).value = ""; }
  }

  // «Dónde» de cada tramo (paso 7b): «—» y los puntos de venta en su orden. Sin puntos de venta, no se enseña.
  function placeSelect(n) { return form.querySelector('[data-slot="' + n + '"] .slot-place'); }

  function fillPlaces(slots) {
    const places = window.Schedule.getData().places.slice().sort(function (a, b) { return a.position - b.position; });
    [1, 2].forEach(function (n) {
      const select = placeSelect(n);
      select.replaceChildren.apply(select, [new Option(t("cell.where"), "")].concat(places.map(function (p) {
        return new Option(window.I18n.displayPlace(p), p.id);
      })));
      select.value = (slots[n - 1] && slots[n - 1].placeId) || "";
      select.hidden = !places.length;
    });
    document.getElementById("cell-places-hint").hidden = places.length > 0;
  }

  // El horario y las horas extra solo se ven si el estado elegido cuenta como trabajo
  function syncHours() {
    const status = window.Schedule.statusOf(statusSelect.value);
    hours.hidden = overtime.hidden = !(status && status.countsAsWork);
  }

  // Horas extra: vacío = ninguna. Vale «2», «1,5» o «1.5»; se redondea a medias horas (como gestion-hosteleria).
  // Devuelve { overtime } (null si no hay) o { error }.
  function readOvertime() {
    const text = overtimeHours.value.trim().replace(",", ".");
    if (!text) { return { overtime: null }; }
    const hoursNumber = /^\d{1,2}(\.\d{1,2})?$/.test(text) ? Math.round(Number(text) * 2) / 2 : NaN;
    if (!(hoursNumber > 0 && hoursNumber <= 16)) { return { error: t("cell.err.hours") }; }
    return { overtime: { hours: hoursNumber, reason: overtimeReason.value.trim().slice(0, 80) } };
  }

  function open(employee, isoDay) {
    const statuses = sortedStatuses();
    const key = window.Schedule.shiftKey(employee.id, isoDay);
    const shift = window.Schedule.getData().shifts[key];
    // label: cómo se nombra la casilla en el aviso de «Intercambiar con…» («Ana Castro · mar, 10 nov»)
    const who = window.I18n.displayName(employee.name);   // «Camarero 1» se ve «Waiter 1» en inglés; lo que escribió el usuario, igual
    current = { key: key, shift: shift, label: who + " · " + shortDay.format(window.Dates.parseIso(isoDay)) };
    document.getElementById("cell-title").textContent = who + " · " + longDay.format(window.Dates.parseIso(isoDay));
    statusSelect.replaceChildren.apply(statusSelect, statuses.map(function (s) { return new Option(window.I18n.displayStatus(s), s.id); }));
    statusSelect.value = shift && window.Schedule.statusOf(shift.statusId) ? shift.statusId : (statuses[0] || {}).id || "";
    const slots = shift ? shift.slots : [];
    [1, 2].forEach(function (n) {
      const inputs = slotInputs(n);
      inputs[0].value = slots[n - 1] ? slots[n - 1].start : "";
      inputs[1].value = slots[n - 1] ? slots[n - 1].end : "";
    });
    showSecond(slots.length > 1);
    fillPlaces(slots);
    const extra = shift && shift.overtime;
    // En el campo, la coma decimal en español y el punto en inglés (al leerlo se aceptan las dos)
    overtimeHours.value = extra ? String(extra.hours).replace(".", window.I18n.current() === "es" ? "," : ".") : "";
    overtimeReason.value = extra ? extra.reason : "";
    clear.hidden = !shift;  // Vaciar solo si hay algo que vaciar
    copy.hidden = !shift;   // y Copiar a…, solo si hay algo que copiar
    showError(statuses.length ? "" : t("cell.err.nostatus"));
    syncHours();
    dialog.showModal();
  }

  // Lee un tramo: devuelve { slot } o { error }. El segundo, si está vacío del todo, simplemente no cuenta.
  function readSlot(n) {
    const inputs = slotInputs(n);
    const start = inputs[0].value;
    const end = inputs[1].value;
    if (n === 2 && !start && !end) { return { slot: null }; }
    if (!TIME.test(start) || !TIME.test(end)) {
      return { error: n === 1 ? t("cell.err.time1") : t("cell.err.time2") };
    }
    if (start === end) { return { error: t("cell.err.same") }; }
    const slot = { start: start, end: end };
    if (placeSelect(n).value) { slot.placeId = placeSelect(n).value; }  // sin «Dónde», el tramo no lo lleva
    return { slot: slot };
  }

  function save(shift) {
    if (window.Schedule.update(current.key, shift)) {
      dialog.close();
    } else {
      showError(t("common.saveFailed") + " " + t("common.nothingChanged"));
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const status = window.Schedule.statusOf(statusSelect.value);
    if (!status) { showError(t("cell.err.pick")); return; }
    const slots = [];
    let extra = null;  // sin trabajo no hay horas extra
    if (status.countsAsWork) {
      for (const n of second.hidden ? [1] : [1, 2]) {
        const read = readSlot(n);
        if (read.error) { showError(read.error); return; }
        if (read.slot) { slots.push(read.slot); }
      }
      const readExtra = readOvertime();
      if (readExtra.error) { showError(readExtra.error); return; }
      extra = readExtra.overtime;
    }
    save({ statusId: status.id, slots: slots, overtime: extra });
  });

  statusSelect.addEventListener("change", function () { showError(""); syncHours(); });
  addSlot.addEventListener("click", function () { showSecond(true); slotInputs(2)[0].focus(); });
  document.getElementById("remove-slot").addEventListener("click", function () { showSecond(false); addSlot.focus(); });
  clear.addEventListener("click", function () { save(null); });
  // «Intercambiar con…»: se cierra la ventana y se elige la otra casilla en el cuadrante (swap.js)
  document.getElementById("cell-swap").addEventListener("click", function () {
    dialog.close();
    window.Swap.start(current.key, current.label);
  });
  // «Copiar a…» (paso 13): igual, pero la casilla de origen se copia a todas las libres que se vayan tocando (swap.js)
  copy.addEventListener("click", function () {
    dialog.close();
    window.Swap.start(current.key, current.label, "copy");
  });
  form.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  // Tocar el fondo oscuro cierra (el formulario ocupa toda la ventana: solo el fondo es el propio <dialog>)
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  // Al cerrarse (Guardar, Cerrar, Escape o fondo), el foco vuelve a la casilla
  dialog.addEventListener("close", function () { if (current) { window.Schedule.focusCell(current.key); } });

  return { open: open };
})();
