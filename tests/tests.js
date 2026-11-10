// Pruebas automáticas de David Planner. Se abren en el navegador (http://localhost:8731/tests/) y cargan la app DE
// VERDAD en un marco: así se prueba el mismo código que usa David, sin cambiarlo ni simular nada. Cada prueba parte
// de unos datos conocidos, hace algo como lo haría una persona (o llama a la función de la app) y comprueba el
// resultado. Sacadas de las reglas de CLAUDE.md y de lo verificado a mano en cada paso (SESSIONS.md).
// Seguridad: solo en localhost (la web publicada nunca se toca: ahí están los datos de David) y los datos «dp_*» de
// este navegador se guardan al empezar y se devuelven al terminar, pase lo que pase.
(function () {
  "use strict";
  const results = document.getElementById("results");
  const summary = document.getElementById("summary");
  const frame = document.getElementById("app");
  const tests = [];
  const WEEK = "2026-11-09";  // semana fija de las pruebas (lunes): nada depende del día en que se pasen

  function test(name, fn) { tests.push({ name: name, fn: fn }); }

  function equal(actual, expected, what) {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) { throw new Error(what + ": esperaba " + e + " y salió " + a); }
  }

  function ok(value, what) { if (!value) { throw new Error(what); } }

  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  // ---------- Los datos de este navegador: guardarlos, limpiarlos y devolverlos ----------
  function dpKeys(store) {
    const keys = [];
    for (let i = 0; i < store.length; i++) { if (store.key(i).startsWith("dp_")) { keys.push(store.key(i)); } }
    return keys;
  }
  function snapshot(store) {
    const copy = {};
    dpKeys(store).forEach(function (key) { copy[key] = store.getItem(key); });
    return copy;
  }
  function clearDp() {
    [localStorage, sessionStorage].forEach(function (store) { dpKeys(store).forEach(function (key) { store.removeItem(key); }); });
  }
  function restore(store, copy) { Object.keys(copy).forEach(function (key) { store.setItem(key, copy[key]); }); }

  // ---------- La app en el marco ----------
  // Unos datos pequeños y conocidos: 2 estados, 3 personas y un punto de venta
  function fixture() {
    return {
      version: 1,
      statuses: [
        { id: "work", name: "Trabajo", color: "#2f5d8a", countsAsWork: true, position: 0 },
        { id: "off", name: "Libre", color: "#8e44ad", countsAsWork: false, position: 1 },
      ],
      employees: [
        { id: "e1", name: "Ana", color: "#2c7be5", position: 0, leftFrom: null },
        { id: "e2", name: "Luis", color: "#e67e22", position: 1, leftFrom: null },
        { id: "e3", name: "Marta", color: "#27ae60", position: 2, leftFrom: null },
      ],
      places: [{ id: "p1", name: "Pub", position: 0 }],
      shifts: {},
    };
  }

  function work(start, end, extra, placeId) {
    const slot = { start: start, end: end };
    if (placeId) { slot.placeId = placeId; }
    return { statusId: "work", slots: [slot], overtime: extra || null };
  }

  // Abre la app con esos datos (null = como la primera vez) en la semana `week` y espera a que arranque
  function open(data, options) {
    const opts = options || {};
    clearDp();
    if (data) { localStorage.setItem(opts.demo ? "dp_demo_data" : "dp_data", JSON.stringify(data)); }
    (opts.extra || []).forEach(function (pair) { localStorage.setItem(pair[0], pair[1]); });
    return new Promise(function (resolve) {
      frame.onload = function () { resolve(frame.contentWindow); };
      frame.src = "../?" + (opts.demo ? "demo&" : "") + "week=" + (opts.week || WEEK) + "&t=" + Date.now();
    });
  }

  function reloaded() {
    return new Promise(function (resolve) { frame.onload = function () { resolve(frame.contentWindow); }; });
  }

  // Los eventos se crean con el Event DEL MARCO (es otra ventana: así no se depende de que el navegador lo tolere)
  function fire(element, type) { element.dispatchEvent(new frame.contentWindow.Event(type, { bubbles: true })); }

  function $(selector) { return frame.contentDocument.querySelector(selector); }
  function $$(selector) { return Array.from(frame.contentDocument.querySelectorAll(selector)); }
  function saved(key) { return JSON.parse(localStorage.getItem(key || "dp_data")); }

  // El navegador «sin espacio» para una clave: guardar en ella falla (como en modo privado o con el disco lleno)
  function breakStorage(win, key) {
    const original = win.Storage.prototype.setItem;
    win.Storage.prototype.setItem = function (k, v) {
      if (k === key) { throw new win.DOMException("lleno", "QuotaExceededError"); }
      return original.call(this, k, v);
    };
    return function () { win.Storage.prototype.setItem = original; };
  }

  // Las descargas no van a la carpeta de Descargas: se leen aquí
  function catchDownloads(win) {
    const files = [];
    win.HTMLAnchorElement.prototype.click = function () {
      if (!this.download) { return; }
      const file = { name: this.download, text: null };
      files.push(file);
      win.fetch(this.href).then(function (r) { return r.text(); }).then(function (t) { file.text = t; });
    };
    return files;
  }

  // Abre la ventana de una casilla, la rellena y guarda. Devuelve el mensaje de error, o "" si se guardó.
  function fillCell(key, values) {
    $('[data-key="' + key + '"]').click();
    const status = $("#cell-status");
    status.value = values.status || "work";
    fire(status, "change");
    const times = $('[data-slot="1"]').querySelectorAll("input");
    if (values.start !== undefined) { times[0].value = values.start; times[1].value = values.end; }
    if (values.extra !== undefined) { $("#overtime-hours").value = values.extra; }
    $("#cell-form").requestSubmit();
    const dialog = $("#cell-dialog");
    const error = dialog.open ? $("#cell-error").textContent : "";
    if (dialog.open) { dialog.close(); }
    return error;
  }

  // =================================================================================================================
  // Fechas (dates.js)
  test("El lunes de la semana: de un domingo es el lunes anterior; de un lunes, él mismo", async function () {
    const w = await open(null);
    equal(w.Dates.toIso(w.Dates.weekStart(new Date(2026, 10, 15))), "2026-11-09", "domingo 15");
    equal(w.Dates.toIso(w.Dates.weekStart(new Date(2026, 10, 9))), "2026-11-09", "lunes 9");
    equal(w.Dates.toIso(w.Dates.weekStart(new Date(2027, 0, 1))), "2026-12-28", "viernes 1 de enero");
  });

  test("Las fechas imposibles se rechazan (2026-02-31, 0001-01-01, mes 13, texto)", async function () {
    const w = await open(null);
    ["2026-02-31", "0001-01-01", "2026-13-01", "hola", ""].forEach(function (text) { equal(w.Dates.parseIso(text), null, text); });
    equal(w.Dates.toIso(w.Dates.parseIso("2026-02-28")), "2026-02-28", "28 de febrero");
  });

  test("Sumar días cruza el cambio de hora y el de año, y la fecha es la LOCAL (no la UTC)", async function () {
    const w = await open(null);
    equal(w.Dates.toIso(w.Dates.addDays(new Date(2026, 2, 28), 1)), "2026-03-29", "cambio de hora");
    equal(w.Dates.toIso(w.Dates.addDays(new Date(2026, 2, 29), 1)), "2026-03-30", "día después del cambio");
    equal(w.Dates.toIso(w.Dates.addDays(new Date(2026, 11, 31), 1)), "2027-01-01", "fin de año");
    equal(w.Dates.toIso(new Date(2026, 10, 10, 0, 30)), "2026-11-10", "00:30 de la madrugada");
  });

  // =================================================================================================================
  // Datos guardados (storage.js)
  test("La primera vez: Camarero 1–4, cuatro estados, sin puntos de venta y nada guardado todavía", async function () {
    const w = await open(null);
    equal($$(".name-button").map(function (b) { return b.textContent; }), ["Camarero 1", "Camarero 2", "Camarero 3", "Camarero 4"], "personas");
    equal(w.Schedule.getData().statuses.length, 4, "estados");
    equal(w.Schedule.getData().places, [], "puntos de venta");
    equal(localStorage.getItem("dp_data"), null, "dp_data");
  });

  test("Unos datos ilegibles no se pisan: se apartan a dp_data_broken", async function () {
    clearDp();
    const w = await open(null, { extra: [["dp_data", "{esto no es json"]] });
    equal(localStorage.getItem("dp_data_broken"), "{esto no es json", "apartados");
    equal(localStorage.getItem("dp_data"), "{esto no es json", "dp_data sin tocar");
    equal(w.Schedule.getData().employees.length, 4, "arranca con Camarero 1–4");
  });

  test("Unos datos de antes del paso 7b (sin puntos de venta) se abren sin perder nada", async function () {
    const old = fixture();
    delete old.places;
    old.shifts["e1|2026-11-10"] = work("10:00", "18:00");
    const w = await open(old);
    equal(w.Schedule.getData().places, [], "places completado");
    equal($('[data-key="e1|2026-11-10"]').textContent, "10:00–18:00", "el turno sigue");
  });

  test("El modo ejemplo (?demo) guarda en su propia clave y no toca los datos de verdad", async function () {
    const real = fixture();
    const w = await open(real, { extra: [] });
    const before = localStorage.getItem("dp_data");
    frame.src = "../?demo&week=" + WEEK;
    const demo = await reloaded();
    equal($$(".name-button").length, 8, "8 personas de ejemplo");
    demo.Schedule.update("e1|2026-11-10", null);
    ok(localStorage.getItem("dp_demo_data") !== null, "guardó en dp_demo_data");
    equal(localStorage.getItem("dp_data"), before, "dp_data intacto");
    ok(w, "la app abrió");
  });

  // =================================================================================================================
  // La casilla (app.js + cell.js)
  test("Poner un turno lo deja guardado, también tras recargar", async function () {
    await open(fixture());
    equal(fillCell("e1|2026-11-10", { start: "10:00", end: "18:00" }), "", "sin error");
    equal(saved().shifts["e1|2026-11-10"].slots, [{ start: "10:00", end: "18:00" }], "guardado");
    frame.contentWindow.location.reload();
    await reloaded();
    equal($('[data-key="e1|2026-11-10"]').textContent, "10:00–18:00", "tras recargar");
  });

  test("Un turno que cruza la medianoche (22:00–02:00) vale; inicio igual a fin, no", async function () {
    await open(fixture());
    equal(fillCell("e1|2026-11-10", { start: "22:00", end: "02:00" }), "", "22:00–02:00");
    equal(fillCell("e2|2026-11-10", { start: "10:00", end: "10:00" }), "El fin no puede ser igual al inicio.", "10:00–10:00");
    equal(fillCell("e3|2026-11-10", { start: "", end: "" }), "Pon la hora de inicio y la de fin.", "sin horas");
    equal(saved().shifts["e2|2026-11-10"], undefined, "el malo no se guardó");
  });

  test("Horas extra: «1,5» y «1.3» → 1,5 h; «16» vale; «0,2», «abc» y «17» se rechazan", async function () {
    const w = await open(fixture());
    const key = "e1|2026-11-10";
    function extra(text) {
      const error = fillCell(key, { start: "10:00", end: "18:00", extra: text });
      return error ? "error" : w.Schedule.getData().shifts[key].overtime && w.Schedule.getData().shifts[key].overtime.hours;
    }
    equal([extra("1,5"), extra("1.3"), extra("16"), extra("0,2"), extra("abc"), extra("17"), extra("")],
      [1.5, 1.5, 16, "error", "error", "error", null], "horas");
  });

  test("Pasar una casilla a Libre borra el horario y las horas extra", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = work("10:00", "18:00", { hours: 2, reason: "Cierre" });
    await open(data);
    equal(fillCell("e1|2026-11-10", { status: "off" }), "", "guardado");
    equal(saved().shifts["e1|2026-11-10"], { statusId: "off", slots: [], overtime: null }, "libre limpio");
  });

  test("Si el navegador no deja guardar, la casilla no cambia (ni en pantalla ni en los datos)", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = work("10:00", "18:00");
    const w = await open(data);
    const fix = breakStorage(w, "dp_data");
    const error = fillCell("e1|2026-11-10", { start: "12:00", end: "20:00" });
    fix();
    ok(error.includes("No se ha podido guardar"), "avisa");
    equal($('[data-key="e1|2026-11-10"]').textContent, "10:00–18:00", "pantalla igual");
    equal(saved().shifts["e1|2026-11-10"].slots[0].start, "10:00", "datos iguales");
  });

  test("Quien está de baja no sale desde esa semana, pero sí en las anteriores", async function () {
    const data = fixture();
    data.employees[1].leftFrom = "2026-11-09";
    await open(data);
    ok(!$$(".name-button").some(function (b) { return b.textContent === "Luis"; }), "no sale esta semana");
    frame.src = "../?week=2026-11-02";
    await reloaded();
    ok($$(".name-button").some(function (b) { return b.textContent === "Luis"; }), "sale la semana anterior");
  });

  // =================================================================================================================
  // Intercambiar (swap) y copiar semanas
  test("Intercambiar: las horas extra viajan con el turno, y con una casilla vacía el turno se mueve", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = work("10:00", "18:00", { hours: 2, reason: "Cierre" }, "p1");
    const w = await open(data);
    ok(w.Schedule.swap("e1|2026-11-10", "e2|2026-11-12"), "guardado");
    equal(saved().shifts["e1|2026-11-10"], undefined, "el origen queda vacío");
    equal(saved().shifts["e2|2026-11-12"].overtime.hours, 2, "las extras viajan");
    equal(saved().shifts["e2|2026-11-12"].slots[0].placeId, "p1", "el sitio viaja");
  });

  test("Intercambiar es todo o nada: si no se puede guardar, no cambia ninguna de las dos", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = work("10:00", "18:00");
    data.shifts["e2|2026-11-10"] = work("20:00", "02:00");
    const w = await open(data);
    const fix = breakStorage(w, "dp_data");
    const result = w.Schedule.swap("e1|2026-11-10", "e2|2026-11-10");
    fix();
    equal(result, false, "devuelve que no");
    equal(w.Schedule.getData().shifts["e1|2026-11-10"].slots[0].start, "10:00", "e1 igual");
    equal(w.Schedule.getData().shifts["e2|2026-11-10"].slots[0].start, "20:00", "e2 igual");
  });

  test("Copiar la semana anterior: solo en vacías, sin horas extra, con su sitio, en varias semanas", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00", { hours: 2, reason: "Cierre" }, "p1");
    data.shifts["e2|2026-11-09"] = work("12:00", "20:00");
    data.shifts["e2|2026-11-16"] = work("08:00", "16:00");  // ya puesto: no se pisa
    const w = await open(data, { week: "2026-11-16" });
    const result = w.Schedule.copyPreviousWeek(2);
    equal(result, { copied: 3, sourceEmpty: false }, "copiados (e1 en dos semanas, e2 solo en la segunda)");
    const s = saved().shifts;
    equal(s["e1|2026-11-16"], { statusId: "work", slots: [{ start: "10:00", end: "18:00", placeId: "p1" }], overtime: null }, "sin extras y con sitio");
    equal(s["e2|2026-11-16"].slots[0].start, "08:00", "no pisa");
    equal(s["e1|2026-11-23"].slots[0].start, "10:00", "segunda semana");
    equal(w.Schedule.copyPreviousWeek(2).copied, 0, "repetir no cambia nada");
  });

  test("Copiar semanas se salta a quien está de baja en la semana de destino; semana anterior vacía → aviso", async function () {
    const data = fixture();
    data.employees[0].leftFrom = "2026-11-23";
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00");
    const w = await open(data, { week: "2026-11-16" });
    w.Schedule.copyPreviousWeek(2);
    ok(saved().shifts["e1|2026-11-16"], "copiado donde está de alta");
    equal(saved().shifts["e1|2026-11-23"], undefined, "no copiado donde está de baja");
    frame.src = "../?week=2026-12-14";
    const later = await reloaded();
    equal(later.Schedule.copyPreviousWeek(1), { copied: 0, sourceEmpty: true }, "semana anterior vacía");
  });

  // =================================================================================================================
  // Personal, estados y puntos de venta (staff.js, states.js, places.js, lists.js)
  test("Quitar a alguien sin turnos lo borra; con turnos, lo da de baja desde la semana que se ve", async function () {
    const data = fixture();
    data.shifts["e2|2026-11-03"] = work("10:00", "18:00");
    await open(data);
    function remove(name) {
      $("#staff-button").click();
      $$("#staff-list .sort-row").find(function (b) { return b.textContent.startsWith(name); }).click();
      $("#staff-remove").click();
      $("#staff-remove").click();  // segundo toque
      $("#staff-dialog").close();
    }
    remove("Marta");
    remove("Luis");
    const people = saved().employees;
    ok(!people.some(function (p) { return p.name === "Marta"; }), "Marta (sin turnos) borrada");
    equal(people.find(function (p) { return p.name === "Luis"; }).leftFrom, "2026-11-09", "Luis de baja desde el 9");
  });

  test("Ordenar escribiendo el número: el tercero al puesto 1 y los demás bajan uno", async function () {
    await open(fixture());
    $("#staff-button").click();
    const third = $$("#staff-list .order-number")[2];
    third.value = "1";
    fire(third, "change");
    $("#staff-dialog").close();
    equal($$(".name-button").map(function (b) { return b.textContent; }), ["Marta", "Ana", "Luis"], "orden en el cuadrante");
  });

  test("Un estado en uso no se puede quitar ni cambiar «cuenta como trabajo»; uno sin usar, sí", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = work("10:00", "18:00");
    await open(data);
    $("#status-button").click();
    $$("#status-list .sort-row").find(function (b) { return b.textContent.startsWith("Trabajo"); }).click();
    ok($("#status-remove").hidden, "Trabajo (en uso): sin Quitar");
    ok($("#status-work").disabled, "Trabajo (en uso): casilla bloqueada");
    $("#status-back").click();
    $$("#status-list .sort-row").find(function (b) { return b.textContent.startsWith("Libre"); }).click();
    ok(!$("#status-remove").hidden && !$("#status-work").disabled, "Libre (sin usar): se puede");
    $("#status-dialog").close();
  });

  test("La casilla explica dónde se crean los puntos de venta mientras no haya ninguno, y entonces sale «Dónde»", async function () {
    await open(null);  // la primera vez: sin puntos de venta
    $('[data-key="e1|' + WEEK + '"]').click();
    ok(!$("#cell-places-hint").hidden && $("#cell-places-hint").textContent.includes("Gestión → Puntos de venta"), "sin puntos, la ayuda");
    ok($$(".slot-place").every(function (s) { return s.hidden; }), "y sin «Dónde»");
    $("#cell-dialog").close();
    await open(fixture());  // con un punto de venta
    $('[data-key="e1|' + WEEK + '"]').click();
    ok($("#cell-places-hint").hidden && !$$(".slot-place")[0].hidden, "con puntos, sin ayuda y con «Dónde»");
  });

  test("Un punto de venta en uso no se puede quitar, y se cuenta por tramos", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-10"] = { statusId: "work", slots: [{ start: "10:00", end: "14:00", placeId: "p1" }, { start: "18:00", end: "22:00", placeId: "p1" }], overtime: null };
    const w = await open(data);
    equal(w.Schedule.placeUses("p1"), 2, "dos tramos");
    $("#place-button").click();
    $("#place-list .sort-row").click();
    ok($("#place-remove").hidden, "sin Quitar");
    $("#place-dialog").close();
  });

  // =================================================================================================================
  // Copia de seguridad (backup.js)
  test("Descargar copia: un archivo con app, versión, datos y la barra", async function () {
    const w = await open(fixture(), { extra: [["dp_name", "Bar de prueba"]] });
    const files = catchDownloads(w);
    $("#backup-download").click();
    await wait(300);
    equal(files.length, 1, "un archivo");
    ok(/^david-planner-copia-\d{4}-\d{2}-\d{2}\.json$/.test(files[0].name), "nombre: " + files[0].name);
    const copy = JSON.parse(files[0].text);
    equal([copy.app, copy.version, copy.data.employees.length, copy.settings.dp_name], ["david-planner", 1, 3, "Bar de prueba"], "contenido");
  });

  test("Cargar copia: rechaza lo que no es una copia y, con trampas, descarta y cuenta lo malo", async function () {
    const w = await open(fixture());
    function load(text) {
      const transfer = new w.DataTransfer();
      transfer.items.add(new w.File([text], "copia.json", { type: "application/json" }));
      const input = $("#backup-file");
      input.files = transfer.files;
      fire(input, "change");
      return wait(250);
    }
    await load("esto no es json");
    equal($("#backup-result").textContent, "Ese archivo no se puede leer (no es una copia válida).", "no es JSON");
    await load(JSON.stringify({ app: "health-tracker", version: 1, data: {} }));
    equal($("#backup-result").textContent, "Este archivo no es una copia de David Planner.", "otra app");
    await load(JSON.stringify({ app: "david-planner", version: 1, data: { employees: [], statuses: [], shifts: {} } }));
    equal($("#backup-result").textContent, "La copia no tiene estados: parece incompleta.", "sin estados");

    const copy = { app: "david-planner", version: 1, exportedAt: "2026-11-10T10:00:00Z", data: fixture(), settings: { dp_name: "Cargado" } };
    copy.data.employees.push({ id: "e9", name: "Color roto", color: "rojo", position: 9, leftFrom: null });
    copy.data.shifts["e1|2026-11-10"] = work("10:00", "18:00");
    copy.data.shifts["e2|2026-11-10"] = work("25:00", "12:00");               // hora imposible
    copy.data.shifts["nadie|2026-11-10"] = work("10:00", "12:00");            // persona que no existe
    // «__proto__» como clave de verdad: en JS, `obj.__proto__ = …` cambiaría el prototipo (y JSON lo ignoraría);
    // escrito en el texto, JSON.parse sí crea una clave con ese nombre, que es lo que haría un archivo malicioso
    const text = JSON.stringify(copy).replace('"shifts":{', '"shifts":{"__proto__":{"statusId":"work","slots":[],"overtime":null},');
    await load(text);
    ok($("#import-dialog").open, "pide confirmación");
    ok($("#import-summary").textContent.includes("se descartan 4 datos"), "cuenta lo malo: " + $("#import-summary").textContent);
    const files = catchDownloads(w);
    const next = reloaded();
    $("#import-ok").click();
    await next;
    ok(files[0] && files[0].name.startsWith("david-planner-antes-de-cargar-"), "descargó antes lo de ahora");
    equal(Object.keys(saved().shifts), ["e1|2026-11-10"], "solo el turno bueno");
    equal(localStorage.getItem("dp_name"), "Cargado", "la barra");
  });

  test("Copias automáticas: una al abrir, no se repite en la semana, a los 8 días otra, máximo 5, nunca en el ejemplo", async function () {
    const data = fixture();
    await open(data);
    equal(saved("dp_copias").length, 1, "al abrir con datos");
    frame.contentWindow.location.reload();
    await reloaded();
    equal(saved("dp_copias").length, 1, "misma semana");
    const old = saved("dp_copias");
    old[0].at = new Date(Date.now() - 8 * 864e5).toISOString();
    localStorage.setItem("dp_copias", JSON.stringify(old));
    frame.contentWindow.location.reload();
    await reloaded();
    equal(saved("dp_copias").length, 2, "8 días después");
    const many = [1, 2, 3, 4, 5, 6].map(function (i) { return { at: new Date(Date.now() - (60 - i) * 864e5).toISOString(), data: data }; });
    localStorage.setItem("dp_copias", JSON.stringify(many));
    frame.contentWindow.location.reload();
    await reloaded();
    equal(saved("dp_copias").length, 5, "máximo 5");
    clearDp();
    await open(data, { demo: true });
    equal(localStorage.getItem("dp_copias"), null, "en el ejemplo, ninguna");
  });

  test("Franja de aviso: no sin datos ni la primera semana; sí a los 7 días sin copia; «Más tarde» la oculta", async function () {
    let w = await open(null);
    ok($("#backup-bar").hidden, "sin datos");
    w = await open(fixture());
    ok($("#backup-bar").hidden, "primer día");
    w = await open(fixture(), { extra: [["dp_since", new Date(Date.now() - 10 * 864e5).toISOString()]] });
    ok(!$("#backup-bar").hidden, "10 días sin copia");
    $("#backup-bar-later").click();
    ok($("#backup-bar").hidden, "Más tarde");
    ok(w, "abrió");
  });

  // =================================================================================================================
  // La barra (brand.js)
  test("Iniciales del local: «Beach Club Marea» → BC; «<b>Bar</b>» → BB y se ve como texto; «🍹🍹» → DP", async function () {
    await open(null);
    function name(text) {
      $(".brand-button").click();
      $('.brand.editor input[data-key="dp_name"]').value = text;
      $(".brand.editor form").requestSubmit();
      return $("#brand-avatar").textContent;
    }
    equal([name("Beach Club Marea"), name("<b>Bar</b>"), name("🍹🍹")], ["BC", "BB", "DP"], "iniciales");
    name("<b>Bar</b>");
    equal([$("#brand-name").textContent, $("#brand-name").querySelectorAll("b").length], ["<b>Bar</b>", 0], "texto, no HTML");
  });

  // =================================================================================================================
  // Fervis (fervis.js). La clave de las pruebas es inventada: no es de nadie ni vale en Groq.
  const FAKE_KEY = "gsk_inventada_para_pruebas_1234";
  const MODEL_IDS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];

  test("Fervis sin clave: el chat no habla de la clave (eso va en Ajustes); lo que no parece una clave no se guarda; pegada de un .env, se limpia", async function () {
    await open(fixture());
    $("#fervis-button").click();
    ok(!$("#fervis-dialog").open, "primero el robot se mueve");
    await wait(1100);  // el movimiento más largo dura 1 s
    ok($("#fervis-dialog").open && !$("#fervis-key-form").hidden, "se abre el chat y, sin clave, el panel de Ajustes");
    equal($$(".fervis-msg").map(function (m) { return m.textContent; }),
      ["Hola, soy Fervis, el asistente de los turnos. ¿En qué te puedo ayudar?"], "el chat solo saluda");
    ok($("#fervis-key-state").textContent.includes("Fervis la necesita para contestarte"), "el aviso está en el panel");
    $("#fervis-key-toggle").click();
    ok($("#fervis-key-form").hidden, "el botón de Ajustes cierra el panel");
    $("#fervis-question").value = "¿Quién trabaja hoy?";
    $("#fervis-form").requestSubmit();
    ok(!$("#fervis-key-form").hidden && $("#fervis-question").value === "¿Quién trabaja hoy?" && $$(".fervis-msg").length === 1,
      "preguntar sin clave abre el panel, no ensucia el chat y deja la pregunta escrita");
    $("#fervis-key").value = "con espacios no vale";
    $("#fervis-key-form").requestSubmit();
    equal(localStorage.getItem("dp_groq_key"), null, "lo que no parece una clave no se guarda");
    $("#fervis-key").value = ' GROQ_API_KEY="' + FAKE_KEY + '" ';
    $("#fervis-key-form").requestSubmit();
    equal([localStorage.getItem("dp_groq_key"), $("#fervis-key").value, $("#fervis-key-form").hidden], [FAKE_KEY, "", true], "limpia, guardada y el campo vacío y cerrado");
    $("#fervis-key-toggle").click();
    $("#fervis-key-remove").click();
    equal(localStorage.getItem("dp_groq_key"), null, "«Quitar la clave» la borra");
  });

  test("La clave de Groq no sale en la copia descargada ni en las copias automáticas", async function () {
    const w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const files = catchDownloads(w);
    $("#backup-download").click();
    await wait(300);
    ok(files.length === 1 && files[0].text && !files[0].text.includes(FAKE_KEY), "la copia descargada no la lleva");
    ok(localStorage.getItem("dp_copias") && !localStorage.getItem("dp_copias").includes(FAKE_KEY), "la copia automática (hecha al abrir) no la lleva");
  });

  test("Fervis sabe quién trabaja ahora (también el turno de ayer que cruza la medianoche), las vacaciones y quién ya no está", async function () {
    const data = fixture();
    data.statuses.push({ id: "vac", name: "Vacaciones", color: "#16a085", countsAsWork: false, position: 2 });
    data.shifts["e1|2026-11-09"] = work("22:00", "02:00", null, "p1");      // Ana, lunes por la noche
    data.shifts["e2|2026-11-10"] = work("10:00", "18:00");                  // Luis, martes
    data.shifts["e3|2026-11-10"] = { statusId: "vac", slots: [], overtime: null };
    data.employees[2].leftFrom = "2026-11-12";                               // Marta ya no trabaja desde el jueves
    const w = await open(data);
    const at = function (day, h, m) { return w.Fervis.context(new w.Date(2026, 10, day, h, m)); };
    const now = function (text) { return text.split("\n").find(function (l) { return l.startsWith("Trabajando"); }); };
    equal(now(at(9, 23, 0)), "Trabajando ahora mismo: Ana (22:00–02:00 en Pub).", "lunes 23:00");
    equal(now(at(10, 1, 30)), "Trabajando ahora mismo: Ana (22:00–02:00 en Pub, empezó ayer).", "martes 1:30");
    equal(now(at(10, 2, 0)), "Trabajando ahora mismo: nadie.", "martes 2:00, ya terminó");
    const noon = at(10, 12, 0);
    equal(now(noon), "Trabajando ahora mismo: Luis (10:00–18:00).", "martes 12:00");
    ok(/martes, 10 de noviembre[^\n]*Marta: Vacaciones/.test(noon), "Marta de vacaciones el martes");
    ok(noon.includes("Marta (ya no trabaja aquí desde el 2026-11-12)"), "en el personal, con su fecha");
    ok(/miércoles, 11 de noviembre[^\n]*Marta/.test(noon) && !/jueves, 12 de noviembre[^\n]*Marta/.test(noon), "no sale desde el jueves");
    ok(!noon.includes("AVISO"), "con personal y turnos, sin avisos");
  });

  test("Fervis avisa si el personal es el de la primera vez, si no hay turnos o si no hay nadie", async function () {
    let w = await open(null);  // la primera vez: Camarero 1–4 y ningún turno
    const first = w.Fervis.context(new w.Date(2026, 10, 10, 12, 0));
    ok(first.includes("AVISO: son los nombres que trae la app") && first.includes("AVISO: todavía no hay ningún turno"), "primera vez");
    const empty = fixture();
    empty.employees = [];
    w = await open(empty);
    ok(w.Fervis.context(new w.Date(2026, 10, 10, 12, 0)).includes("AVISO: no hay nadie en el personal"), "sin personal");
  });

  test("Fervis con un Groq de mentira: clave y datos; consulta de otras fechas; 429 → el siguiente modelo con su etiqueta; 401 → aviso", async function () {
    const data = fixture();
    data.shifts["e1|2026-12-01"] = work("09:00", "17:00");
    const w = await open(data, { extra: [["dp_groq_key", FAKE_KEY]] });
    const sent = [];
    const replies = [
      { status: 429 },
      { status: 200, json: { choices: [{ message: { content: null, tool_calls: [{ id: "c1", type: "function",
        function: { name: "turnos_entre", arguments: '{"desde":"2026-12-01","hasta":"2026-12-01"}' } }] } }] } },
      { status: 200, json: { choices: [{ message: { content: "Ana trabaja de 09:00 a 17:00." } }] } },
    ];
    const asked = [];  // las veces que se pidió la lista de modelos de la cuenta
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) {  // la lista de modelos de la cuenta: los cuatro
        asked.push(options.headers.Authorization);
        return Promise.resolve({ ok: true, status: 200, json: function () {
          return Promise.resolve({ data: MODEL_IDS.map(function (id) { return { id: id }; }) }); } });
      }
      sent.push({ url: url, auth: options.headers.Authorization, body: JSON.parse(options.body) });
      const r = replies.shift();
      return Promise.resolve({ ok: r.status === 200, status: r.status, json: function () { return Promise.resolve(r.json); } });
    };
    w.Fervis.open();
    $("#fervis-question").value = "¿Qué hace Ana el 1 de diciembre?";
    $("#fervis-form").requestSubmit();
    await wait(300);
    const last = $$(".fervis-msg").pop();
    equal([last.firstChild.textContent, last.querySelector(".fervis-model").textContent],
      ["Ana trabaja de 09:00 a 17:00.", "groq · openai/gpt-oss-120b (respaldo)"], "respuesta y etiqueta");
    equal(sent.map(function (s) { return s.body.model; }), ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-120b"], "modelos");
    ok(sent.every(function (s) { return s.auth === "Bearer " + FAKE_KEY && s.url.startsWith("https://api.groq.com/"); }), "clave y dirección");
    ok(sent[1].body.messages[0].content.includes("Personal (3): Ana, Luis, Marta."), "los datos van en el mensaje de sistema");
    const tool = sent[2].body.messages.find(function (m) { return m.role === "tool"; });
    ok(tool && tool.content.includes("Ana: Trabajo 09:00–17:00"), "la consulta devuelve el 1 de diciembre");
    replies.push({ status: 401 });
    $("#fervis-question").value = "¿Y mañana?";
    $("#fervis-form").requestSubmit();
    await wait(300);
    ok($$(".fervis-msg").pop().textContent.includes("no acepta tu clave"), "401: aviso de la clave");
    equal(asked, ["Bearer " + FAKE_KEY], "la lista de modelos se pide una sola vez");
  });

  test("Fervis: la papelera borra la conversación (también lo que recuerda) y deja la clave; con una respuesta en marcha no hace nada", async function () {
    const w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const bodies = [];
    let release = null;
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ data: MODEL_IDS.map(function (id) { return { id: id }; }) }); } }); }
      bodies.push(JSON.parse(options.body));
      return new Promise(function (resolve) {
        release = function () { resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ choices: [{ message: { content: "Respuesta " + bodies.length } }] }); } }); };
      });
    };
    w.Fervis.open();
    const ask = function (text) { $("#fervis-question").value = text; $("#fervis-form").requestSubmit(); return wait(100); };
    await ask("Primera");
    $("#fervis-clear").click();
    equal($$(".fervis-msg").length, 3, "con una respuesta en marcha, la papelera no hace nada (saludo, pregunta y «Pensando…»)");
    release();
    await wait(100);
    $("#fervis-clear").click();
    equal($$(".fervis-msg").map(function (m) { return m.textContent; }), ["Hola, soy Fervis, el asistente de los turnos. ¿En qué te puedo ayudar?"], "solo el saludo");
    equal(localStorage.getItem("dp_groq_key"), FAKE_KEY, "la clave sigue");
    await ask("Segunda");
    release();
    await wait(100);
    equal(bodies[1].messages.filter(function (m) { return m.role !== "system"; }).map(function (m) { return m.content; }), ["Segunda"],
      "Fervis ya no recuerda lo anterior");
  });

  test("Fervis usa solo los modelos que tiene la cuenta: si falta el primero, no lo prueba ni pone «respaldo»", async function () {
    const w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const tried = [];
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) {
        return Promise.resolve({ ok: true, status: 200, json: function () {
          return Promise.resolve({ data: [{ id: "openai/gpt-oss-120b" }, { id: "otro/modelo" }] }); } });
      }
      tried.push(JSON.parse(options.body).model);
      return Promise.resolve({ ok: true, status: 200, json: function () {
        return Promise.resolve({ choices: [{ message: { content: "Nadie trabaja ahora." } }] }); } });
    };
    w.Fervis.open();
    $("#fervis-question").value = "¿Quién trabaja?";
    $("#fervis-form").requestSubmit();
    await wait(300);
    const last = $$(".fervis-msg").pop();
    equal([tried, last.querySelector(".fervis-model").textContent, last.querySelector(".fervis-model").classList.contains("backup")],
      [["openai/gpt-oss-120b"], "groq · openai/gpt-oss-120b", false], "solo el modelo que existe, sin «respaldo»");
  });

  // =================================================================================================================
  // Sin conexión (sw.js): la lista ESSENTIAL se escribe a mano. Un archivo que la página pide y no está en ella hace
  // que la app instalada se abra rota sin internet, sin ningún aviso (con internet todo va bien).
  test("Todo lo que pide la página (y los iconos del manifiesto) está en la lista ESSENTIAL de sw.js", async function () {
    await open(null);
    const asked = $$("link[href], script[src]").map(function (el) { return el.getAttribute("href") || el.getAttribute("src"); })
      .filter(function (url) { return !url.includes("://"); });
    const manifest = await (await fetch("../manifest.webmanifest?t=" + Date.now())).json();
    manifest.icons.forEach(function (icon) { asked.push(icon.src); });
    const sw = await (await fetch("../sw.js?t=" + Date.now())).text();
    const list = (sw.match(/const ESSENTIAL = \[([\s\S]*?)\];/) || ["", ""])[1].match(/"[^"]+"/g) || [];
    const essential = list.map(function (quoted) { return quoted.slice(1, -1); });
    ok(essential.length > 10, "no se pudo leer la lista ESSENTIAL de sw.js");
    const missing = asked.filter(function (url) { return !essential.includes(url); });
    equal(missing, [], "faltan en ESSENTIAL de sw.js");
  });

  // =================================================================================================================
  async function run() {
    if (!["localhost", "127.0.0.1"].includes(location.hostname)) {
      summary.textContent = "Las pruebas solo se lanzan en local (http://localhost:8731/tests/): aquí podrían tocar datos de verdad.";
      return;
    }
    const savedLocal = snapshot(localStorage);
    const savedSession = snapshot(sessionStorage);
    let failed = 0;
    try {
      for (const t of tests) {
        const item = results.appendChild(document.createElement("li"));
        item.textContent = t.name;
        try {
          await t.fn();
          item.className = "ok";
        } catch (error) {
          failed++;
          item.className = "fail";
          item.appendChild(document.createElement("small")).textContent = error.message;
        }
        summary.textContent = "Pasando pruebas… " + results.children.length + " de " + tests.length;
      }
    } finally {
      frame.src = "about:blank";
      clearDp();
      restore(localStorage, savedLocal);
      restore(sessionStorage, savedSession);
    }
    summary.textContent = failed ? "❌ " + failed + " de " + tests.length + " pruebas fallan" : "✅ Las " + tests.length + " pruebas pasan";
    summary.className = "summary " + (failed ? "fail" : "ok");
    document.title = (failed ? "❌ " : "✅ ") + "Pruebas de David Planner";
  }

  run();
})();
