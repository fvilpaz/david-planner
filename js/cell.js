// Ventana de la casilla: estado, horario (uno o dos tramos), Guardar y Vaciar. Como la de gestion-hosteleria con dos
// mejoras: un solo Guardar para toda la casilla, y si el estado no cuenta como trabajo el horario se oculta al
// momento (allí seguía a la vista y se borraba al guardar). Las horas extra que ya tuviera la casilla se conservan.
window.CellDialog = (function () {
  "use strict";
  const dialog = document.getElementById("cell-dialog");
  const form = document.getElementById("cell-form");
  const statusSelect = document.getElementById("cell-status");
  const hours = document.getElementById("cell-hours");
  const second = document.getElementById("slot-2");
  const addSlot = document.getElementById("add-slot");
  const clear = document.getElementById("cell-clear");
  const errorEl = document.getElementById("cell-error");
  const longDay = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
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
    if (!on) { slotInputs(2).forEach(function (input) { input.value = ""; }); }
  }

  // El horario solo se ve si el estado elegido cuenta como trabajo
  function syncHours() {
    const status = window.Schedule.statusOf(statusSelect.value);
    hours.hidden = !(status && status.countsAsWork);
  }

  function open(employee, isoDay) {
    const statuses = sortedStatuses();
    const key = window.Schedule.shiftKey(employee.id, isoDay);
    const shift = window.Schedule.getData().shifts[key];
    current = { key: key, shift: shift };
    document.getElementById("cell-title").textContent = employee.name + " · " + longDay.format(window.Dates.parseIso(isoDay));
    statusSelect.replaceChildren.apply(statusSelect, statuses.map(function (s) { return new Option(s.name, s.id); }));
    statusSelect.value = shift && window.Schedule.statusOf(shift.statusId) ? shift.statusId : (statuses[0] || {}).id || "";
    const slots = shift ? shift.slots : [];
    [1, 2].forEach(function (n) {
      const inputs = slotInputs(n);
      inputs[0].value = slots[n - 1] ? slots[n - 1].start : "";
      inputs[1].value = slots[n - 1] ? slots[n - 1].end : "";
    });
    showSecond(slots.length > 1);
    clear.hidden = !shift;  // Vaciar solo si hay algo que vaciar
    showError(statuses.length ? "" : "No hay estados: créalos antes en «Gestión».");
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
      return { error: n === 1 ? "Pon la hora de inicio y la de fin." : "Pon el inicio y el fin del segundo tramo, o quítalo." };
    }
    if (start === end) { return { error: "El fin no puede ser igual al inicio." }; }
    return { slot: { start: start, end: end } };
  }

  function save(shift) {
    if (window.Schedule.update(current.key, shift)) {
      dialog.close();
    } else {
      showError("No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.");
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const status = window.Schedule.statusOf(statusSelect.value);
    if (!status) { showError("Elige un estado."); return; }
    const slots = [];
    if (status.countsAsWork) {
      for (const n of second.hidden ? [1] : [1, 2]) {
        const read = readSlot(n);
        if (read.error) { showError(read.error); return; }
        if (read.slot) { slots.push(read.slot); }
      }
    }
    save({ statusId: status.id, slots: slots, overtime: (current.shift && current.shift.overtime) || null });
  });

  statusSelect.addEventListener("change", function () { showError(""); syncHours(); });
  addSlot.addEventListener("click", function () { showSecond(true); slotInputs(2)[0].focus(); });
  document.getElementById("remove-slot").addEventListener("click", function () { showSecond(false); addSlot.focus(); });
  clear.addEventListener("click", function () { save(null); });
  form.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  // Tocar el fondo oscuro cierra (el formulario ocupa toda la ventana: solo el fondo es el propio <dialog>)
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  // Al cerrarse (Guardar, Cerrar, Escape o fondo), el foco vuelve a la casilla
  dialog.addEventListener("close", function () { if (current) { window.Schedule.focusCell(current.key); } });

  return { open: open };
})();
