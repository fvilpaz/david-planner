// Copia de seguridad (paso 9a; mismo formato que health-tracker/src/js/copia.js: app, version, exportedAt y los datos).
// - Descargar: un archivo .json con todo (datos y la barra: local, ciudad, persona y tema).
// - Cargar: el archivo se revisa campo a campo (lo que no se puede leer se descarta y se cuenta: un archivo roto o
//   de otra app nunca debe estropear el cuadrante), se pide confirmación y ANTES se descarga una copia de lo que hay.
// - Franja de aviso que no bloquea: si hace 7 días o más de la última descarga (la primera semana, no), con
//   «Descargar copia» y «Más tarde» (hasta volver a abrir la app). Ni en el modo ejemplo ni sin datos guardados.
window.Backup = (function () {
  "use strict";
  const APP = "david-planner";
  const VERSION = 1;
  const SETTINGS = ["dp_name", "dp_city", "dp_person", "dp_theme"];  // la barra y el tema (ver brand.js y theme.js)
  const LAST = "dp_last_export";     // cuándo se descargó la última copia
  const SINCE = "dp_since";          // desde cuándo se usa la app (la primera semana no se avisa)
  const SNOOZE = "dp_backup_later";  // «Más tarde» (sessionStorage: hasta volver a abrir la app)
  const EVERY_DAYS = 7;
  const MAX_FILE = 5 * 1024 * 1024;  // una copia real ocupa unos KB; esto evita que un archivo enorme congele la app
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  const ID = /^[\w-]{1,40}$/;
  const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" });
  const bar = document.getElementById("backup-bar");
  const result = document.getElementById("backup-result");
  const fileInput = document.getElementById("backup-file");
  const importDialog = document.getElementById("import-dialog");
  let pending = null;  // la copia leída y revisada, esperando el «Sí»

  function get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function set(key, value) {
    try {
      if (value === null) { localStorage.removeItem(key); } else { localStorage.setItem(key, value); }
      return true;
    } catch (e) { return false; }
  }

  function daysSince(iso) {
    const time = Date.parse(iso || "");
    return Number.isFinite(time) ? Math.floor((Date.now() - time) / 864e5) : null;
  }

  // ---------- Descargar ----------
  function download(prefix) {
    const settings = {};
    SETTINGS.forEach(function (key) { const value = get(key); if (value !== null) { settings[key] = value; } });
    const copy = { app: APP, version: VERSION, exportedAt: new Date().toISOString(), data: window.Schedule.getData(), settings: settings };
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" }));
    link.download = prefix + window.Dates.toIso(new Date()) + (window.Store.DEMO ? "-ejemplo" : "") + ".json";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
  }

  function exportNow() {
    download("david-planner-copia-");
    if (!window.Store.DEMO) { set(LAST, new Date().toISOString()); }
    refresh();
    result.textContent = "Copia descargada ✓ Está en Descargas: guárdala también fuera del móvil.";
  }

  // ---------- Revisar un archivo ----------
  function text(value, max) { return typeof value === "string" && value.trim() !== "" && value.length <= max; }

  // Devuelve { data, settings, dropped, exportedAt } o lanza un Error con un mensaje en castellano
  function clean(copy) {
    if (!copy || copy.app !== APP) { throw new Error("Este archivo no es una copia de David Planner."); }
    if (copy.version !== VERSION) { throw new Error("Esta copia es de otra versión de la app y no se puede cargar."); }
    const source = copy.data || {};
    let dropped = 0;
    function keep(list, ok) {
      return (Array.isArray(list) ? list : []).filter(function (item) {
        const good = Boolean(item) && typeof item === "object" && ok(item);
        if (!good) { dropped++; }
        return good;
      });
    }
    const employees = keep(source.employees, function (e) {
      return ID.test(e.id) && text(e.name, 40) && HEX.test(e.color) && Number.isFinite(e.position) &&
        (e.leftFrom === null || e.leftFrom === undefined || window.Dates.parseIso(e.leftFrom) !== null);
    }).map(function (e) { return { id: e.id, name: e.name, color: e.color, position: e.position, leftFrom: e.leftFrom || null }; });
    const statuses = keep(source.statuses, function (s) {
      return ID.test(s.id) && text(s.name, 30) && HEX.test(s.color) && typeof s.countsAsWork === "boolean" && Number.isFinite(s.position);
    }).map(function (s) { return { id: s.id, name: s.name, color: s.color, countsAsWork: s.countsAsWork, position: s.position }; });
    if (!statuses.length) { throw new Error("La copia no tiene estados: parece incompleta."); }
    const places = keep(source.places, function (p) {
      return ID.test(p.id) && text(p.name, 30) && Number.isFinite(p.position);
    }).map(function (p) { return { id: p.id, name: p.name, position: p.position }; });

    const has = function (list, id) { return list.some(function (x) { return x.id === id; }); };
    const shifts = {};
    Object.keys(source.shifts && typeof source.shifts === "object" ? source.shifts : {}).forEach(function (key) {
      const shift = source.shifts[key];
      const parts = key.split("|");
      const status = shift && statuses.find(function (s) { return s.id === shift.statusId; });
      const slots = shift && Array.isArray(shift.slots) ? shift.slots : null;
      const okSlots = slots && slots.length <= 2 && slots.every(function (slot) {
        return slot && TIME.test(slot.start) && TIME.test(slot.end) && slot.start !== slot.end &&
          (slot.placeId === undefined || has(places, slot.placeId));
      }) && (status && status.countsAsWork ? slots.length > 0 : slots.length === 0);
      const extra = shift && shift.overtime;
      const okExtra = extra === null || extra === undefined || (typeof extra === "object" && Number.isFinite(extra.hours) &&
        extra.hours >= 0.5 && extra.hours <= 16 && typeof extra.reason === "string" && extra.reason.length <= 80);
      if (parts.length !== 2 || !has(employees, parts[0]) || window.Dates.parseIso(parts[1]) === null || !status || !okSlots || !okExtra) {
        dropped++;
        return;
      }
      shifts[key] = {
        statusId: status.id,
        slots: slots.map(function (slot) {
          const copySlot = { start: slot.start, end: slot.end };
          if (slot.placeId) { copySlot.placeId = slot.placeId; }
          return copySlot;
        }),
        overtime: extra ? { hours: Math.round(extra.hours * 2) / 2, reason: extra.reason } : null,
      };
    });
    const settings = {};
    SETTINGS.forEach(function (key) {
      const value = copy.settings && copy.settings[key];
      if (typeof value === "string" && value.length <= 40) { settings[key] = value; }
    });
    return {
      data: { version: VERSION, employees: employees, statuses: statuses, places: places, shifts: shifts },
      settings: settings,
      dropped: dropped,
      exportedAt: copy.exportedAt,
    };
  }

  // ---------- Cargar ----------
  function read(file) {
    result.textContent = "";
    if (file.size > MAX_FILE) { result.textContent = "Ese archivo es demasiado grande para ser una copia de David Planner."; return; }
    file.text().then(function (content) {
      let copy;
      try { copy = clean(JSON.parse(content)); } catch (error) {
        result.textContent = error instanceof SyntaxError ? "Ese archivo no se puede leer (no es una copia válida)." : error.message;
        return;
      }
      pending = copy;
      const when = Date.parse(copy.exportedAt || "");
      document.getElementById("import-summary").textContent =
        "Copia " + (Number.isFinite(when) ? "del " + dateFormat.format(new Date(when)) : "sin fecha") + " · " +
        copy.data.employees.length + (copy.data.employees.length === 1 ? " persona" : " personas") + " · " +
        Object.keys(copy.data.shifts).length + " turnos" +
        (copy.dropped ? " · se descartan " + copy.dropped + " datos que no se podían leer" : "") + ".";
      importDialog.showModal();
    });
  }

  function applyPending() {
    const copy = pending;
    pending = null;
    download("david-planner-antes-de-cargar-");  // lo de ahora, por si te arrepientes
    if (!window.Store.save(copy.data)) {
      importDialog.close();
      result.textContent = "No se ha podido guardar en este navegador (¿modo privado o sin espacio?). No se ha cambiado nada.";
      return;
    }
    SETTINGS.forEach(function (key) { set(key, key in copy.settings ? copy.settings[key] : null); });
    window.location.reload();  // todo vuelve a arrancar con los datos cargados
  }

  // ---------- Franja y menú ----------
  function refresh() {
    const last = get(LAST);
    const days = daysSince(last);
    document.getElementById("backup-last").textContent = !last ? "Todavía no has descargado ninguna copia." :
      days === 0 ? "Última copia: hoy." : "Última copia: hace " + days + (days === 1 ? " día." : " días.");
    if (!get(SINCE)) { set(SINCE, new Date().toISOString()); }
    let later = false;
    try { later = sessionStorage.getItem(SNOOZE) === "1"; } catch (e) { /* sin almacenamiento: se avisa */ }
    const age = daysSince(last || get(SINCE));
    bar.hidden = window.Store.DEMO || later || get(window.Store.KEY) === null || age === null || age < EVERY_DAYS;
    document.getElementById("backup-bar-text").textContent = last ?
      "Hace " + days + " días que no guardas una copia de seguridad." : "Todavía no has guardado ninguna copia de seguridad.";
  }

  document.getElementById("backup-download").addEventListener("click", exportNow);
  document.getElementById("backup-bar-download").addEventListener("click", exportNow);
  document.getElementById("backup-bar-later").addEventListener("click", function () {
    try { sessionStorage.setItem(SNOOZE, "1"); } catch (e) { /* se oculta igual hasta recargar */ }
    bar.hidden = true;
  });
  document.getElementById("backup-load").addEventListener("click", function () { fileInput.click(); });
  fileInput.addEventListener("change", function () {
    if (fileInput.files[0]) { read(fileInput.files[0]); }
    fileInput.value = "";  // para poder elegir otra vez el mismo archivo
  });
  document.getElementById("import-ok").addEventListener("click", applyPending);
  document.getElementById("import-cancel").addEventListener("click", function () { pending = null; importDialog.close(); });
  document.getElementById("backup-group").addEventListener("toggle", function () { result.textContent = ""; refresh(); });

  refresh();
  return { refresh: refresh };
})();
