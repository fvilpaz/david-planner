// Copia de seguridad (paso 9a; mismo formato que health-tracker/src/js/copia.js: app, version, exportedAt y los datos).
// - Descargar: un archivo .json con todo (datos y la barra: local, ciudad, persona y tema).
// - Cargar: el archivo se revisa campo a campo (lo que no se puede leer se descarta y se cuenta: un archivo roto o
//   de otra app nunca debe estropear el cuadrante), se pide confirmación y ANTES se descarga una copia de lo que hay.
// - Franja de aviso que no bloquea: si hace 7 días o más de la última descarga (la primera semana, no), con
//   «Descargar copia» y «Más tarde» (hasta volver a abrir la app). Ni en el modo ejemplo ni sin datos guardados.
(function () {
  "use strict";
  const APP = "david-planner";
  const VERSION = 1;
  const SETTINGS = ["dp_name", "dp_city", "dp_person", "dp_theme", "dp_color_by", "dp_intensity"];  // la barra, el tema, «colorear por» y el color de las etiquetas
  const LAST = "dp_last_export";     // cuándo se descargó la última copia
  const SINCE = "dp_since";          // desde cuándo se usa la app (la primera semana no se avisa)
  const SNOOZE = "dp_backup_later";  // «Más tarde» (sessionStorage: hasta volver a abrir la app)
  const EVERY_DAYS = 7;
  const COPIES = "dp_copias";  // copias automáticas (paso 9b): las 5 últimas, una por semana, dentro del navegador
  const MAX_COPIES = 5;
  const MAX_FILE = 5 * 1024 * 1024;  // una copia real ocupa unos KB; esto evita que un archivo enorme congele la app
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
  const ID = /^[\w-]{1,40}$/;
  const t = window.I18n.t;   // los textos y los formatos de fecha siguen al idioma elegido (js/i18n.js)
  const dateFormat = window.I18n.formatter(Intl.DateTimeFormat, { day: "numeric", month: "short", year: "numeric" });
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
    result.textContent = t("backup.downloaded");
  }

  // ---------- Revisar un archivo ----------
  function text(value, max) { return typeof value === "string" && value.trim() !== "" && value.length <= max; }

  // Devuelve { data, settings, dropped, exportedAt } o lanza un Error con un mensaje en castellano
  function clean(copy) {
    if (!copy || copy.app !== APP) { throw new Error(t("backup.errNotBackup")); }
    if (copy.version !== VERSION) { throw new Error(t("backup.errVersion")); }
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
    if (!statuses.length) { throw new Error(t("backup.errNoStatuses")); }
    const places = keep(source.places, function (p) {
      return ID.test(p.id) && text(p.name, 30) && Number.isFinite(p.position);
    }).map(function (p) {
      const copyPlace = { id: p.id, name: p.name, position: p.position };
      if (HEX.test(p.color)) { copyPlace.color = p.color; }   // sin color (copias de antes del 14a): lo completa storage.js
      return copyPlace;
    });

    // Clientes previstos por fecha (paso 14b): la fecha tiene que existir y el número ser un entero de 0 a 99999
    const clients = {};
    Object.keys(source.clients && typeof source.clients === "object" && !Array.isArray(source.clients) ? source.clients : {}).forEach(function (iso) {
      const n = source.clients[iso];
      if (window.Dates.parseIso(iso) !== null && Number.isInteger(n) && n >= 0 && n <= 99999) { clients[iso] = n; } else { dropped++; }
    });

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
      data: { version: VERSION, employees: employees, statuses: statuses, places: places, shifts: shifts, clients: clients },
      settings: settings,
      dropped: dropped,
      exportedAt: copy.exportedAt,
    };
  }

  // ---------- Cargar ----------
  function read(file) {
    result.textContent = "";
    if (file.size > MAX_FILE) { result.textContent = t("backup.errTooBig"); return; }
    file.text().then(function (content) {
      let copy;
      try { copy = clean(JSON.parse(content)); } catch (error) {
        result.textContent = error instanceof SyntaxError ? t("backup.errUnreadable") : error.message;
        return;
      }
      pending = copy;
      const when = Date.parse(copy.exportedAt || "");
      document.getElementById("import-summary").textContent = t("backup.summary", {
        when: Number.isFinite(when) ? t("backup.whenDated", { date: dateFormat.format(new Date(when)) }) : t("backup.whenUndated"),
        people: window.I18n.tn("common.people", copy.data.employees.length),
        shifts: window.I18n.tn("common.shifts", Object.keys(copy.data.shifts).length),
        dropped: copy.dropped ? t("backup.dropped", { n: copy.dropped }) : ""
      });
      importDialog.showModal();
    });
  }

  function applyPending() {
    const copy = pending;
    pending = null;
    // Lo de ahora, por si te arrepientes: como copia automática, dentro del navegador (se recupera en «Copias automáticas»).
    // Antes además se descargaba un archivo siempre, y en el PC salía la ventana «Guardar como» en mitad de cargar. Solo si
    // había datos de verdad y la copia no cupo (navegador casi lleno) se descarga: sería la única copia de lo de ahora.
    if (!autoCopy(true) && !window.Store.DEMO && get(window.Store.KEY) !== null) { download("david-planner-antes-de-cargar-"); }
    if (!window.Store.save(copy.data)) {
      importDialog.close();
      result.textContent = t("common.saveFailed") + " " + t("common.nothingChanged");
      return;
    }
    SETTINGS.forEach(function (key) { set(key, key in copy.settings ? copy.settings[key] : null); });
    window.location.reload();  // todo vuelve a arrancar con los datos cargados
  }

  // ---------- Copias automáticas (paso 9b, como health-tracker) ----------
  // Dentro del navegador, junto a los datos: sirven si algo sale mal (un turno borrado, una carga equivocada), pero
  // si se borran los datos del navegador se van con ellas. Para eso está «Descargar copia».
  const whenFormat = window.I18n.formatter(Intl.DateTimeFormat, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function autoCopies() {
    try {
      const list = JSON.parse(localStorage.getItem(COPIES));
      return Array.isArray(list) ? list.filter(function (c) { return c && typeof c.at === "string" && c.data; }) : [];
    } catch (e) { return []; }
  }

  // Guarda una copia si hay datos guardados y la última tiene 7 días o más (o siempre, con `always`). Si no cabe en
  // el navegador, no pasa nada: la app sigue igual (por eso no se avisa).
  function autoCopy(always) {
    if (window.Store.DEMO || get(window.Store.KEY) === null) { return false; }
    const list = autoCopies();
    const age = list.length ? daysSince(list[list.length - 1].at) : null;
    if (!always && age !== null && age < EVERY_DAYS) { return false; }
    list.push({ at: new Date().toISOString(), data: window.Schedule.getData() });
    return set(COPIES, JSON.stringify(list.slice(-MAX_COPIES)));
  }

  function renderAutoCopies() {
    const list = autoCopies().reverse();  // la más reciente arriba
    const box = document.getElementById("auto-copies");
    if (!list.length) {
      const empty = document.createElement("li");
      empty.className = "help";
      empty.textContent = t("backup.noCopies");
      box.replaceChildren(empty);
      return;
    }
    box.replaceChildren.apply(box, list.map(function (copy) {
      const item = document.createElement("li");
      const people = Array.isArray(copy.data.employees) ? copy.data.employees.length : 0;
      const shifts = copy.data.shifts ? Object.keys(copy.data.shifts).length : 0;
      item.append(whenFormat.format(new Date(copy.at)) + " · " + window.I18n.tn("common.people", people) + ", " +
        window.I18n.tn("common.shifts", shifts));
      const button = item.appendChild(document.createElement("button"));
      button.type = "button";
      button.className = "secondary";
      button.dataset.at = copy.at;
      button.textContent = t("backup.recover");
      return item;
    }));
  }

  // Recuperar pide un segundo toque. Antes, lo de ahora se guarda como otra copia (por si te arrepientes) y la copia
  // pasa el mismo filtro que un archivo cargado.
  function recover(at) {
    const copy = autoCopies().find(function (c) { return c.at === at; });
    if (!copy) { return; }
    let cleaned;
    try { cleaned = clean({ app: APP, version: VERSION, data: copy.data }); } catch (error) {
      result.textContent = t("backup.copyUnreadable", { message: error.message });
      return;
    }
    autoCopy(true);
    if (!window.Store.save(cleaned.data)) {
      result.textContent = t("common.saveFailed") + " " + t("common.nothingChanged");
      return;
    }
    window.location.reload();
  }

  document.getElementById("auto-copies").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-at]");
    if (!button) { return; }
    if (!button.dataset.confirm) {
      button.dataset.confirm = "1";
      button.textContent = t("backup.sure");
      return;
    }
    recover(button.dataset.at);
  });

  // ---------- Franja y menú ----------
  function refresh() {
    const last = get(LAST);
    const days = daysSince(last);
    document.getElementById("backup-last").textContent = !last ? t("backup.lastNone") :
      days === 0 ? t("backup.lastToday") : window.I18n.tn("backup.lastDays", days);
    if (!get(SINCE)) { set(SINCE, new Date().toISOString()); }
    let later = false;
    try { later = sessionStorage.getItem(SNOOZE) === "1"; } catch (e) { /* sin almacenamiento: se avisa */ }
    const age = daysSince(last || get(SINCE));
    bar.hidden = window.Store.DEMO || later || get(window.Store.KEY) === null || age === null || age < EVERY_DAYS;
    document.getElementById("backup-bar-text").textContent = last ? t("backup.barDays", { n: days }) : t("backup.barNever");
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
  document.getElementById("backup-group").addEventListener("toggle", function () {
    result.textContent = "";
    refresh();
    renderAutoCopies();
  });

  autoCopy(false);  // al abrir la app: la de esta semana, si toca
  refresh();
  // Al cambiar de idioma se vuelven a escribir los textos que pone este archivo (los fijos ya los cambia i18n.js)
  document.addEventListener("i18n-change", function () { refresh(); renderAutoCopies(); });
})();
