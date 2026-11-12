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
    equal(localStorage.getItem("dp_demo_data"), null, "la demo no guarda nada");
    equal(localStorage.getItem("dp_data"), before, "dp_data intacto");
    const lunes = demo.Dates.toIso(demo.Dates.weekStart(new Date()));
    ok(demo.Schedule.getData().shifts["e1|" + lunes], "los turnos de ejemplo son de la semana en curso");
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

  test("Copiar a…: copia estado, los dos tramos y el sitio a las casillas libres que se toquen, sin horas extra; no pisa; Deshacer; Hecho", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-09"] = { statusId: "work", slots: [{ start: "10:00", end: "14:00", placeId: "p1" }, { start: "18:00", end: "22:00" }],
      overtime: { hours: 2, reason: "Cierre" } };
    data.shifts["e2|2026-11-10"] = work("08:00", "16:00");  // ya ocupada
    await open(data);
    const cell = function (key) { return $('[data-key="' + key + '"]'); };
    cell("e3|2026-11-09").click();
    ok($("#cell-copy").hidden, "en una casilla vacía no hay nada que copiar");
    $("#cell-dialog").close();
    cell("e1|2026-11-09").click();
    ok(!$("#cell-copy").hidden, "con turno, sí");
    $("#cell-copy").click();
    ok(!$("#swap-bar").hidden && $("#swap-text").textContent.includes("Toca las casillas libres donde copiar") &&
      cell("e1|2026-11-09").classList.contains("swap-source"), "aviso y casilla de origen marcada");
    cell("e1|2026-11-10").click();
    cell("e3|2026-11-11").click();
    const original = saved().shifts["e1|2026-11-09"];
    equal(saved().shifts["e1|2026-11-10"], { statusId: "work", slots: original.slots, overtime: null }, "copia con los dos tramos y el sitio, sin extras");
    equal(saved().shifts["e1|2026-11-09"].overtime.hours, 2, "el origen conserva sus extras");
    ok(!$("#swap-bar").hidden && $("#swap-text").textContent.includes("Copiado ✓ (2)") && !$("#cell-dialog").open, "sigue en modo copiar, sin abrir ventanas");
    cell("e2|2026-11-10").click();
    equal(saved().shifts["e2|2026-11-10"].slots[0].start, "08:00", "una ocupada no se pisa");
    ok($("#swap-text").textContent.includes("ya tiene algo"), "y lo dice");
    $("#swap-undo").click();
    equal([saved().shifts["e3|2026-11-11"], saved().shifts["e1|2026-11-10"] !== undefined], [undefined, true], "Deshacer quita solo la última");
    $("#swap-cancel").click();
    ok($("#swap-bar").hidden, "Hecho cierra el aviso");
    cell("e3|2026-11-12").click();
    ok($("#cell-dialog").open, "tras Hecho, tocar una casilla abre su ventana otra vez");
  });

  test("Copiar a… con el navegador sin espacio: no copia nada y lo dice", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00");
    const w = await open(data);
    $('[data-key="e1|2026-11-09"]').click();
    $("#cell-copy").click();
    const restoreStorage = breakStorage(w, "dp_data");
    $('[data-key="e1|2026-11-10"]').click();
    restoreStorage();
    equal([saved().shifts["e1|2026-11-10"], $("#swap-text").textContent.includes("No se ha podido guardar")], [undefined, true], "no cambia y avisa");
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
    equal(files.length, 0, "al cargar una copia no se descarga nada (salía la ventana de guardar)");
    equal(saved("dp_copias").length, 2, "lo de ahora quedó como copia automática (la de al abrir y la de antes de cargar)");
    equal(Object.keys(saved("dp_copias")[1].data.shifts).length, 0, "y es lo de ANTES de cargar (sin turnos)");
    equal(Object.keys(saved().shifts), ["e1|2026-11-10"], "solo el turno bueno");
    equal(localStorage.getItem("dp_name"), "Cargado", "la barra");
  });

  test("Cargar una copia con el navegador casi lleno (no cabe la copia automática): como no habría otra copia de lo de ahora, sí se descarga un archivo", async function () {
    const w = await open(fixture());
    const files = catchDownloads(w);
    breakStorage(w, "dp_copias");   // la copia automática ya no cabe
    const copy = { app: "david-planner", version: 1, exportedAt: "2026-11-10T10:00:00Z", data: fixture(), settings: {} };
    const transfer = new w.DataTransfer();
    transfer.items.add(new w.File([JSON.stringify(copy)], "copia.json", { type: "application/json" }));
    const input = $("#backup-file");
    input.files = transfer.files;
    fire(input, "change");
    await wait(250);
    ok($("#import-dialog").open, "pide confirmación");
    const next = reloaded();
    $("#import-ok").click();
    await next;
    ok(files[0] && files[0].name.startsWith("david-planner-antes-de-cargar-"), "sin copia automática, se descarga lo de ahora (descargas: " + files.length + ")");
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
  test("La paleta de colores: 20 distintos y válidos, ninguno rosa ni fucsia (es del aviso de horas extra), y el selector los pinta todos", async function () {
    const w = await open(null);
    const colors = w.PALETTE;
    ok(colors.length >= 20, "al menos 20 colores: " + colors.length);
    ok(colors.every(function (c) { return /^#[0-9a-f]{6}$/i.test(c); }), "todos con formato #rrggbb");
    equal(new Set(colors.map(function (c) { return c.toLowerCase(); })).size, colors.length, "sin repetidos");
    const pink = colors.filter(function (c) {  // tono entre 295° y 350° con color vivo = rosa o fucsia
      const r = parseInt(c.slice(1, 3), 16) / 255, g = parseInt(c.slice(3, 5), 16) / 255, b = parseInt(c.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
      if (d === 0) { return false; }
      const hue = (max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
      const light = (max + min) / 2, sat = d / (1 - Math.abs(2 * light - 1));
      return hue >= 295 && hue <= 350 && sat > 0.35;
    });
    equal(pink, [], "ningún rosa ni fucsia");
    equal(colors.slice(0, 4), ["#2c7be5", "#e67e22", "#27ae60", "#8e44ad"], "los cuatro primeros (Camarero 1-4) no se mueven");
    $(".name-button").click();
    equal($$("#staff-palette button").length, colors.length, "el selector de color de una persona pinta todos");
  });

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
      ["¡Hola! Soy Fervis, tu asistente personal. Estoy aquí para ayudarte. Puedes escribirme tu consulta directamente aquí abajo o, si no sabes por dónde empezar, pulsar el botón «📖 Guía» de arriba."], "el chat solo saluda");
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

  test("Saludo de Fervis al abrir: sale contando aperturas, avisa en la 4.ª, tocarlo abre el chat y el botón de Ajustes lo apaga y lo enciende", async function () {
    // open() limpia también sessionStorage: cada open() es una visita nueva. Un cambio de semana es una recarga SIN limpiar.
    const SALUDA = 3700;  // el robot se menea a los 2,5 s y el bocadillo sale 1 s después
    frame.style.width = "600px";   // pantalla estrecha: el salto es solo desde 900 px (otra prueba, abajo)
    try {
    await open(fixture());
    ok($("#fervis-hello").hidden && !$("#fervis-button").classList.contains("saludando"), "al abrir, aún nada: primero la gente mira la pantalla");
    await wait(2800);
    ok($("#fervis-button").classList.contains("saludando") && $("#fervis-hello").hidden, "primero se menea el robot, sin bocadillo todavía");
    await wait(SALUDA - 2800);
    ok(!$("#fervis-hello").hidden && $("#fervis-hello").textContent.includes("Tengo algo que contarte") && $("#fervis-hello b"), "después sale el bocadillo, con el título en negrita");
    ok($("#fervis-hello-hint").hidden && localStorage.getItem("dp_fervis_aperturas") === "1", "la 1.ª, sin aviso y contada");
    const again = reloaded();
    frame.src = "../?week=2026-11-16&t=" + Date.now();
    await again;
    await wait(SALUDA);
    ok($("#fervis-hello").hidden && localStorage.getItem("dp_fervis_aperturas") === "1", "cambiar de semana (recarga) no vuelve a saludar ni a contar");
    await open(fixture(), { extra: [["dp_fervis_aperturas", "3"]] });
    await wait(SALUDA);
    ok(!$("#fervis-hello-hint").hidden && $("#fervis-hello-hint").textContent.includes("Ajustes"), "la 4.ª avisa de que se puede desactivar");
    $("#fervis-hello").click();
    ok($("#fervis-hello").hidden && !$("#fervis-dialog").open, "tocarlo lo esconde y el robot se mueve antes de abrir");
    await wait(1100);
    ok($("#fervis-dialog").open, "tocar el bocadillo abre el chat");
    equal($("#fervis-hello-toggle").textContent, "Desactivar el saludo al abrir la app", "el botón de Ajustes ofrece desactivar");
    $("#fervis-hello-toggle").click();
    equal([localStorage.getItem("dp_fervis_saludo"), $("#fervis-hello-toggle").textContent], ["off", "Activar el saludo al abrir la app"], "desactivado y recordado");
    await open(fixture(), { extra: [["dp_fervis_saludo", "off"]] });
    await wait(SALUDA);
    ok($("#fervis-hello").hidden && !$("#fervis-button").classList.contains("saludando"), "con el saludo apagado no sale al abrir");
    $("#fervis-hello-toggle").click();
    equal(localStorage.getItem("dp_fervis_saludo"), null, "«Activar» lo vuelve a encender");
    } finally { frame.style.width = ""; }
  });

  test("Saludo de Fervis en pantalla ancha: el robot salta de la barra al hueco de «Cuadrante semanal», el bocadillo sale a su lado y al cerrarse vuelve a la barra", async function () {
    frame.style.width = "1200px";
    try {
      await open(fixture());
      await wait(2900);   // el salto empieza a los 2,5 s
      ok($("#fervis-button").classList.contains("ausente") && $(".fervis-ghost") && $("#fervis-hello").hidden, "salta una copia, el de la barra se oculta y aún no hay bocadillo");
      await wait(1100);   // la caída con rebotes dura 1,3 s
      ok(!$("#fervis-hello").hidden && $("#fervis-hello").classList.contains("lateral"), "al aterrizar sale el bocadillo, a su lado");
      const g = $(".fervis-ghost").getBoundingClientRect();
      const r = $(".section-header").getBoundingClientRect();
      ok(Math.abs((g.top + g.height / 2) - (r.top + r.height / 2)) < 3, "aterriza en medio de la fila de «Cuadrante semanal»");
      $("body").click();   // cualquier toque lo cierra
      await wait(900);
      ok(!$(".fervis-ghost") && !$("#fervis-button").classList.contains("ausente") && $("#fervis-hello").hidden, "la copia se va y el robot de la barra vuelve a verse");
      // Tocar al robot cuando está en medio abre el chat directamente (sin tener que volver a la barra)
      await open(fixture());
      await wait(4000);
      $(".fervis-ghost").click();
      await wait(1500);   // el movimiento del robot (hasta 1 s) y se abre
      ok($("#fervis-dialog").open, "tocar al robot que ha saltado abre el chat");
      ok(!$(".fervis-ghost") && !$("#fervis-button").classList.contains("ausente"), "y el robot vuelve a la barra");
    } finally { frame.style.width = ""; }
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
    const days = w.Fervis.tool("turnos_entre", { desde: "2026-11-10", hasta: "2026-11-12" });
    ok(/martes, 10 de noviembre[^\n]*Marta: Vacaciones/.test(days), "Marta de vacaciones el martes");
    ok(noon.includes("Marta (ya no trabaja aquí desde el 2026-11-12)"), "en el personal, con su fecha");
    ok(/miércoles, 11 de noviembre[^\n]*Marta/.test(days) && !/jueves, 12 de noviembre[^\n]*Marta/.test(days), "no sale desde el jueves");
    ok(!noon.includes("AVISO"), "con personal y turnos, sin avisos");
  });

  test("Fervis: el resumen por persona lo cuenta la app (partido, seguido, libre) y separa fines de semana COMPLETOS de días sueltos", async function () {
    const data = fixture();
    data.statuses.push({ id: "vac", name: "Vacaciones", color: "#16a085", countsAsWork: false, position: 2 });
    const split = { statusId: "work", slots: [{ start: "10:00", end: "14:00" }, { start: "18:00", end: "22:00" }], overtime: null };
    const off = { statusId: "off", slots: [], overtime: null };
    const vac = { statusId: "vac", slots: [], overtime: null };
    data.shifts["e1|2026-11-09"] = split;                         // Ana: partido lun y mar, seguido el miércoles
    data.shifts["e1|2026-11-10"] = split;
    data.shifts["e1|2026-11-11"] = work("10:00", "18:00");
    data.shifts["e1|2026-11-14"] = off;                           //   fin de semana del 14–15 libre entero
    data.shifts["e1|2026-11-15"] = off;
    data.shifts["e1|2026-11-21"] = work("10:00", "18:00");        //   el 21 trabaja; el domingo 22, libre (suelto)
    data.shifts["e1|2026-11-22"] = off;
    data.shifts["e2|2026-11-14"] = work("12:00", "20:00");        // Luis: sábado 14 trabaja, domingo 15 libre (suelto)
    data.shifts["e2|2026-11-15"] = off;
    data.shifts["e2|2026-11-21"] = off;                           //   y el 21–22 libre entero
    data.shifts["e2|2026-11-22"] = off;
    data.shifts["e3|2026-11-14"] = vac;                           // Marta: vacaciones el 14–15
    data.shifts["e3|2026-11-15"] = vac;
    const w = await open(data);
    const text = w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-11-22" });
    const line = function (name) { return text.split("\n").find(function (l) { return l.startsWith("- " + name + ": "); }); };
    ok(line("Ana").includes("turno partido 2 días; turno seguido 2 días"), "Ana: partido y seguido: " + line("Ana"));
    ok(/completos sin trabajar \(sábado y domingo\): 1 \(14–15 nov \(libre\)\)/.test(line("Ana")), "Ana: un fin de semana completo libre: " + line("Ana"));
    ok(/dom\S* 22 nov \(libre\)/.test(line("Ana")) && !/sáb\S* 21 nov/.test(line("Ana")), "Ana: el domingo 22 suelto, y el sábado 21 trabaja");
    ok(/completos sin trabajar \(sábado y domingo\): 1 \(21–22 nov \(libre\)\)/.test(line("Luis")) && /dom\S* 15 nov \(libre\)/.test(line("Luis")), "Luis: completo el 21–22 y suelto el domingo 15: " + line("Luis"));
    ok(/: 1 \(14–15 nov \(vacaciones\)\)/.test(line("Marta")) && /vacaciones 2 días/.test(line("Marta")), "Marta: vacaciones el 14–15: " + line("Marta"));
    // el ranking lo da la app, con el motivo (vacaciones no es librar): el fallo de «Hugo tiene 1 fin de semana libre»
    const rankFull = text.split("\n").find(function (l) { return l.startsWith("RANKING de fines de semana completos"); });
    const rankLoose = text.split("\n").find(function (l) { return l.startsWith("RANKING de sábados o domingos sueltos"); });
    ok(/Ana 1 \(14–15 nov \(libre\)\), Luis 1 \(21–22 nov \(libre\)\), Marta 1 \(14–15 nov \(vacaciones\)\)/.test(rankFull), "ranking de completos, con su motivo: " + rankFull);
    ok(/Ana 1 \(dom\S* 22 nov \(libre\)\), Luis 1 \(dom\S* 15 nov \(libre\)\)/.test(rankLoose) && !rankLoose.includes("Marta"), "ranking de sueltos, sin repetir los de un fin de semana completo: " + rankLoose);
    ok(!w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-11-22", persona: "Ana" }).includes("RANKING"), "con una sola persona no hay ranking");
    // un período que acaba en sábado: el domingo queda fuera, así que no hay fin de semana COMPLETO
    const cut = w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-11-14" });
    ok(/completos sin trabajar \(sábado y domingo\): 0/.test(cut.split("\n")[0]), "sin el domingo dentro, no es un fin de semana completo");
    // filtro por persona (sin tildes ni mayúsculas) y persona que no existe
    const only = w.Fervis.tool("turnos_entre", { desde: "2026-11-09", hasta: "2026-11-09", persona: "ANA" });
    ok(only.includes("Ana:") && !only.includes("Luis:"), "solo una persona");
    ok(w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-11-10", persona: "zzz" }).includes("No encuentro a nadie que se llame «zzz»"), "persona que no existe");
    ok(w.Fervis.tool("manual_app", { tema: "estados" }).includes("Asuntos propios"), "la guía por temas es una herramienta");
    ok(w.Fervis.tool("turnos_entre", { desde: "2026-11-09", hasta: "2026-12-31" }).includes("Como mucho 31 días"), "turnos: como mucho 31 días");
    ok(!w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-12-31" }).includes("Como mucho"), "el resumen admite 93");
  });

  test("Un estado nuevo nace con un color que no lleva ninguna persona ni otro estado", async function () {
    await open(fixture());  // personas: #2c7be5 #e67e22 #27ae60; estados: #2f5d8a y #8e44ad
    $("#status-button").click();
    $("#status-add").click();
    const pressed = $("#status-palette button[aria-pressed=true]");
    equal(pressed.style.getPropertyValue("--swatch"), "#16a085", "el primero de la paleta que no usa nadie (no el siguiente por orden)");
  });

  test("La guía como glosario: el botón 📖 despliega grupos y temas (sin chat, sin Groq, sin clave) y vuelve al chat", async function () {
    const w = await open(fixture());  // sin clave
    let calls = 0;
    w.fetch = function () { calls++; return Promise.reject(new Error("la guía no debe llamar a Groq")); };
    w.Fervis.open();
    const before = $$(".fervis-msg").length;
    ok($("#fervis-guide-view").hidden && !$("#fervis-messages").hidden, "al abrir, el chat");
    equal($("#fervis-guide").textContent.trim(), "Guía", "el botón de la guía lleva su nombre escrito");
    equal($("#fervis-messages").scrollTop, 0, "el saludo se ve desde su primera línea");
    ok($(".fervis-msg").textContent.includes("pulsar el botón «📖 Guía» de arriba"), "el saludo remite a la guía");
    $("#fervis-guide").click();
    ok(!$("#fervis-guide-view").hidden && $("#fervis-messages").hidden && $("#fervis-form").hidden && $("#fervis-key-form").hidden, "se ve el glosario y se esconde el chat");
    equal($$("#fervis-guide-view > details > summary").map(function (x) { return [x.querySelector(".fervis-guide-badge").textContent, x.querySelector(".fervis-guide-title").textContent, x.querySelector(".fervis-guide-sub").textContent]; }),
      [["📅", "Turnos y casillas", "6 temas"], ["🛠️", "Menú Gestión", "7 temas"], ["🏢", "Mi local, la app y Fervis", "3 temas"]], "primero, tres tarjetas: círculo con el emoji, título y subtítulo");
    const view = w.getComputedStyle($("#fervis-guide-view"));  // la regla del contenedor se aplica (una llave suelta en el CSS la hizo desaparecer)
    ok(view.display === "grid" && view.rowGap !== "normal" && parseFloat(view.rowGap) >= 8, "el contenedor del glosario es una rejilla con hueco entre filas: " + view.display + " / " + view.rowGap);
    ok($$("#fervis-guide-view > details > summary").length === 3 && $$("#fervis-guide-view > details > .fervis-guide-children > details").length === 16,
      "jerarquía: los 16 temas cuelgan de los 3 grupos");
    const group = $("#fervis-guide-view > details");
    ok(!group.open, "cerrado al principio");
    group.querySelector("summary").click();
    await wait(50);  // «toggle» llega un instante después
    ok(group.open, "al tocar el grupo se despliega");
    equal($$("#fervis-guide-view > details:first-of-type > .fervis-guide-children > details > summary").map(function (x) { return x.querySelector(".fervis-guide-title").textContent + " (" + x.querySelector(".fervis-guide-sub").textContent + ")"; }),
      ["Moverse por el cuadrante (6 pasos)", "Poner o cambiar un turno (6 pasos)", "Clientes previstos y camareros (5 pasos)", "Horas extra (4 pasos)", "Intercambiar dos turnos (4 pasos)", "Copiar un turno a otras casillas (5 pasos)"], "y salen sus temas, con cuántos pasos tiene cada uno");
    const topic = $$("#fervis-guide-view .fervis-guide-topic").find(function (d) { return d.querySelector(".fervis-guide-title").textContent.includes("Copiar un turno"); });
    topic.querySelector("summary").click();
    await wait(50);
    ok(topic.open && topic.querySelectorAll("li").length === 5 && topic.querySelector("li").textContent.startsWith("Abre una casilla con turno"), "al tocar el tema, sus pasos");
    // acordeón: al abrir otro tema del grupo, el anterior se pliega; y al abrir otro grupo, el primero
    const other = $$("#fervis-guide-view > details:first-of-type .fervis-guide-topic")[0];
    other.querySelector("summary").click();
    await wait(50);
    ok(other.open && !topic.open, "al abrir otro tema, el anterior se pliega");
    const secondGroup = $$("#fervis-guide-view > details")[1];
    secondGroup.querySelector("summary").click();
    await wait(50);
    ok(secondGroup.open && !group.open, "al abrir otro grupo, el primero se pliega");
    equal($$("#fervis-guide-view .fervis-guide-topic").length, w.Fervis.tool("manual_app").split("»): ")[1].split("; ").length, "los grupos cubren todos los temas de la guía");
    equal([$$(".fervis-msg").length, calls], [before, 0], "no añade nada a la conversación ni llama a Groq");
    $("#fervis-guide").click();
    ok($("#fervis-guide-view").hidden && !$("#fervis-messages").hidden && !$("#fervis-form").hidden, "el mismo botón vuelve al chat");
    $$(".fervis-chip").pop().click();  // el chip «Guía de la app» del saludo
    ok(!$("#fervis-guide-view").hidden, "el chip del saludo también abre el glosario");
    $("#fervis-clear").click();
    ok($("#fervis-guide-view").hidden && !$("#fervis-messages").hidden, "la papelera vuelve al chat");
  });

  test("Descargar guía (PDF): el botón está arriba del glosario y monta la hoja con todos los temas y el nombre del local; al terminar de imprimir se limpia", async function () {
    const w = await open(fixture(), { extra: [["dp_name", "Local de prueba"], ["dp_city", "Ciudad de prueba"]] });
    let printed = 0;
    w.print = function () { printed++; };  // sin abrir de verdad la ventana de impresión
    w.Fervis.open();
    $("#fervis-guide").click();
    const button = $("#fervis-guide-view").firstElementChild;
    ok(button.id === "fervis-guide-print" && button.textContent.includes("Descargar guía (PDF)"), "el botón va arriba del todo del glosario");
    button.click();
    equal(printed, 1, "abre la impresión");
    const sheet = $("#guide-print");
    ok(sheet && w.document.body.classList.contains("printing-guide"), "la hoja está montada y el cuerpo en «modo guía»");
    equal([sheet.querySelector("h1").textContent, sheet.querySelector(".guide-print-site").textContent], ["Guía de uso", "Local de prueba · Ciudad de prueba"], "título y nombre del local");
    equal(sheet.querySelectorAll("h2").length, 3, "los tres grupos");
    const topics = w.Fervis.tool("manual_app").split("»): ")[1].split("; ").length;
    equal(sheet.querySelectorAll("h3").length, topics, "todos los temas de la guía, abiertos y seguidos");
    ok(Array.from(sheet.querySelectorAll("li")).some(function (li) { return li.textContent.startsWith("Abre una casilla con turno"); }), "con sus pasos");
    w.dispatchEvent(new w.Event("afterprint"));
    ok(!$("#guide-print") && !w.document.body.classList.contains("printing-guide"), "al terminar de imprimir, se limpia");
  });

  test("La guía de Fervis: cada tema responde, el índice los lista todos y cada botón del menú Gestión y de la casilla sale en ella", async function () {
    const w = await open(fixture());
    const index = w.Fervis.tool("manual_app");
    const topics = index.split("»): ")[1].split("; ").map(function (item) { return item.split(" (")[0]; });
    ok(topics.length >= 14, "el índice lista los temas: " + topics.length);
    const all = topics.map(function (id) { return w.Fervis.tool("manual_app", { tema: id }); });
    ok(all.every(function (text) { return text.length > 80 && !text.startsWith("Temas de la guía"); }), "cada tema contesta con su texto");
    equal(w.Fervis.tool("manual_app", { tema: "no_existe" }).startsWith("Temas de la guía"), true, "un tema desconocido da el índice");
    const guide = all.join(" ");
    // cada botón del menú Gestión y de la ventana de la casilla tiene que estar explicado (si se añade uno y se olvida la guía, falla)
    const label = function (el) { return el.textContent.replace(/^[^\p{L}]+/u, "").replace(/[^\p{L}\p{N}…+ ⇄]+$/u, "").trim(); };
    const buttons = $$(".manage-menu .menu-list > button, .manage-menu .menu-list > details > summary, #cell-swap, #cell-copy, #cell-clear, #add-slot").map(label);
    ok(buttons.length >= 11, "se leyeron los botones: " + buttons.join(" | "));
    const missing = buttons.filter(function (b) { return !guide.includes(b.replace(/^\+ /, "").replace(/^⇄ /, "").replace(/ \(turno partido\)?$/, "")); });
    equal(missing, [], "botones que la guía no nombra");
  });

  test("Fervis: a una pregunta de «cómo se hace», la app le pone delante la guía que toca (no contesta de memoria que algo «no se puede»)", async function () {
    const w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const color = w.Fervis.guideFor("como cambio el color de una persona");
    ok(color.includes("Personal:") && color.includes("cambiar su nombre y su color"), "el color de una persona sale del tema Personal: " + color.slice(0, 80));
    ok(w.Fervis.guideFor("¿Cómo copio un turno?").startsWith("Copiar un turno a otras casillas:"), "copiar un turno");
    ok(w.Fervis.guideFor("donde descargo la copia de seguridad").includes("Descargar copia"), "copia de seguridad");
    equal([w.Fervis.guideFor("quien trabaja hoy"), w.Fervis.guideFor("¿quién libra este fin de semana?")], ["", ""], "las preguntas de datos no llevan guía");
    const sent = [];
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ data: MODEL_IDS.map(function (id) { return { id: id }; }) }); } }); }
      sent.push(JSON.parse(options.body));
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ choices: [{ finish_reason: "stop", message: { role: "assistant", content: "En Personal." } }] }); } });
    };
    w.Fervis.open();
    $("#fervis-question").value = "como cambio el color de una persona";
    $("#fervis-form").requestSubmit();
    await wait(300);
    const system = sent[0].messages[0].content;
    ok(system.includes("GUÍA DE LA APP RELEVANTE") && system.includes("Personal: Gestión → «Personal»"), "la guía relevante va en el mensaje de sistema");
    ok(system.includes("Nunca digas que algo «no se puede hacer»"), "y la orden de no decir que algo no se puede sin comprobarlo");
    $("#fervis-question").value = "quien trabaja hoy";
    $("#fervis-form").requestSubmit();
    await wait(300);
    ok(!sent[1].messages[0].content.includes("GUÍA DE LA APP RELEVANTE"), "una pregunta de datos no la lleva");
  });

  test("Fervis: un estado llamado «Constructor» o «__proto__» cuenta como cualquier otro en el resumen (antes se perdía)", async function () {
    const data = fixture();
    data.statuses.push({ id: "raro1", name: "Constructor", color: "#16a085", countsAsWork: false, position: 2 });
    data.statuses.push({ id: "raro2", name: "__proto__", color: "#7f8c8d", countsAsWork: false, position: 3 });
    data.shifts["e1|2026-11-09"] = { statusId: "raro1", slots: [], overtime: null };
    data.shifts["e1|2026-11-10"] = { statusId: "raro1", slots: [], overtime: null };
    data.shifts["e1|2026-11-11"] = { statusId: "raro2", slots: [], overtime: null };
    const w = await open(data);
    const ana = w.Fervis.tool("resumen_entre", { desde: "2026-11-09", hasta: "2026-11-11", persona: "Ana" });
    ok(ana.includes("constructor 2 días") && ana.includes("__proto__ 1 día"), "los dos estados raros, contados: " + ana.split(" | ")[0]);
  });

  test("El aviso de Ajustes dice todo lo que se envía a Groq (también el nombre del local y el de quien usa la app)", async function () {
    await open(fixture());
    const help = $("#fervis-key-form .help").textContent;
    ok(help.includes("el nombre del local y el tuyo") && help.includes("los turnos y el personal"), "aviso completo: " + help.slice(-120));
  });

  // =================================================================================================================
  // Color por punto de venta y «Colorear por» (paso 14a)
  test("Colorear por: por defecto, por persona (como siempre); por punto de venta, el tramo con sitio toma el color del sitio y el que no lo tiene, el de la persona; el interruptor se recuerda", async function () {
    const data = fixture();
    data.places[0].color = "#16a085";
    data.shifts["e1|" + WEEK] = work("10:00", "14:00", null, "p1");   // con sitio
    data.shifts["e2|" + WEEK] = work("10:00", "14:00");              // sin sitio
    const w = await open(data);
    const tint = function (key) { return $('[data-key="' + key + '"] .chip').dataset.tint; };
    equal([tint("e1|" + WEEK), tint("e2|" + WEEK)], ["#2c7be5", "#e67e22"], "por defecto: el color de la persona");
    equal([w.Schedule.colorBy(), $("#colorby-group").hidden], ["persona", false], "por persona, y el interruptor sale (hay un punto de venta)");
    $('[data-colorby="sitio"]').click();
    equal([tint("e1|" + WEEK), tint("e2|" + WEEK)], ["#16a085", "#e67e22"], "por sitio: el del sitio; sin sitio, el de la persona");
    equal([w.localStorage.getItem("dp_color_by"), $('[data-colorby="sitio"]').getAttribute("aria-pressed")], ["sitio", "true"], "se guarda y se marca");
    await open(data, { extra: [["dp_color_by", "sitio"]] });   // como si recargaras
    equal(tint("e1|" + WEEK), "#16a085", "se recuerda al recargar");
  });

  test("Colorear por: un estado (Libre…) conserva su color en los dos modos, y sin puntos de venta el interruptor no sale", async function () {
    const data = fixture();
    data.shifts["e1|" + WEEK] = { statusId: "off", slots: [], overtime: null };
    await open(data, { extra: [["dp_color_by", "sitio"]] });
    equal($('[data-key="e1|' + WEEK + '"] .chip').dataset.tint, "#8e44ad", "Libre, con su color, también por sitio");
    await open(null);   // la primera vez: sin puntos de venta
    ok($("#colorby-group").hidden, "sin puntos de venta, sin interruptor");
  });

  test("Puntos de venta con color: uno nuevo nace con un color que no lleva nadie, el de uno en uso se puede cambiar (quitarlo, no) y los de antes del 14a reciben uno al abrir", async function () {
    const data = fixture();   // el «Pub» no tiene color: es un dato de antes del 14a
    data.shifts["e1|2026-11-10"] = work("10:00", "14:00", null, "p1");
    const w = await open(data);
    const places = function () { return w.Schedule.getData().places; };
    ok(/^#[0-9a-f]{6}$/i.test(places()[0].color), "el de antes recibe un color al abrir: " + places()[0].color);
    $("#place-button").click();
    $("#place-add").click();
    $("#place-name").value = "Terraza";
    $("#place-form").requestSubmit();
    const nuevo = places().find(function (p) { return p.name === "Terraza"; });
    const otros = w.Schedule.getData().employees.concat(w.Schedule.getData().statuses, places().filter(function (p) { return p !== nuevo; }));
    ok(nuevo && !otros.some(function (x) { return x.color === nuevo.color; }), "color libre: " + (nuevo && nuevo.color));
    equal(saved().places.find(function (p) { return p.name === "Terraza"; }).color, nuevo.color, "se guarda");
    $$("#place-list .sort-row")[0].click();   // el «Pub», que está en uso
    ok($("#place-remove").hidden, "en uso: sin Quitar");
    $$("#place-palette button")[5].click();
    $("#place-form").requestSubmit();
    equal(saved().places.find(function (p) { return p.id === "p1"; }).color, w.PALETTE[5], "su color se cambia aunque esté en uso");
    $("#place-dialog").close();
  });

  test("La copia de seguridad conserva el color de los puntos de venta y «colorear por» (al descargarla y al cargarla); una copia de antes, sin colores, se carga y sus sitios reciben uno", async function () {
    const data = fixture();
    data.places[0].color = "#16a085";
    const w = await open(data, { extra: [["dp_color_by", "sitio"]] });
    const files = catchDownloads(w);
    $("#backup-download").click();
    await wait(300);
    const copy = JSON.parse(files[0].text);
    equal([copy.data.places[0].color, copy.settings.dp_color_by], ["#16a085", "sitio"], "la copia lleva el color y el ajuste");
    // Cargar una copia (en la página que haya ahora): devuelve la ventana ya recargada
    async function cargar(texto) {
      const win = frame.contentWindow;
      const transfer = new win.DataTransfer();
      transfer.items.add(new win.File([texto], "copia.json", { type: "application/json" }));
      const input = $("#backup-file");
      input.files = transfer.files;
      fire(input, "change");
      await wait(250);
      ok($("#import-dialog").open, "la copia se acepta: " + $("#backup-result").textContent);
      catchDownloads(win);   // por si acaso: cargar no debe descargar nada, pero si un día lo hiciera no llegaría a Descargas
      const next = reloaded();
      $("#import-ok").click();
      return next;
    }
    // Un color que NO es de la paleta: si al cargar se perdiera, el sitio recibiría otro (no este)
    copy.data.places[0].color = "#abcdef";
    copy.settings.dp_color_by = "sitio";
    let win = await cargar(JSON.stringify(copy));
    equal([win.Schedule.getData().places[0].color, win.Schedule.colorBy()], ["#abcdef", "sitio"], "al cargarla se conserva el color y «colorear por»");
    // Una copia de antes del 14a: sin color ni ajuste
    delete copy.data.places[0].color;
    delete copy.settings.dp_color_by;
    win = await cargar(JSON.stringify(copy));
    ok(/^#[0-9a-f]{6}$/i.test(win.Schedule.getData().places[0].color), "sin color en la copia: el sitio recibe uno al abrir");
    equal(win.Schedule.colorBy(), "persona", "sin el ajuste, por persona");
  });

  // =================================================================================================================
  // Móvil estrecho
  test("En un móvil estrecho (360 y 320 px) el menú «Gestión» no se sale de la pantalla, ni en el ejemplo (título más largo), y la página declara el viewport", async function () {
    try {
      for (const ancho of [360, 320]) {
        frame.style.width = ancho + "px";
        const w = await open(null, { demo: true });   // el ejemplo: el título lleva « · EJEMPLO» y Gestión baja de línea
        ok(w.innerWidth <= ancho + 1, "el marco mide un móvil: " + w.innerWidth);
        $(".manage-menu > summary").click();
        const list = $(".manage-menu .menu-list").getBoundingClientRect();
        ok(list.left >= 0 && list.right <= w.innerWidth, "a " + ancho + " px el menú cabe: va de " + Math.round(list.left) + " a " + Math.round(list.right) + " (pantalla " + w.innerWidth + ")");
      }
      const viewport = $('meta[name="viewport"]');
      ok(viewport && viewport.content.includes("width=device-width"), "la página declara el viewport del móvil");
    } finally { frame.style.width = ""; }
  });

  // =================================================================================================================
  // Clientes previstos y camareros por día (paso 14b)
  function crewFixture() {
    const data = fixture();
    data.places.push({ id: "p2", name: "Terraza", position: 1 });
    data.employees.push({ id: "e4", name: "Libre", color: "#999999", position: 3, leftFrom: null });
    data.employees.push({ id: "e5", name: "Ya no está", color: "#888888", position: 4, leftFrom: "2026-11-09" });
    const day = "2026-11-09";
    data.shifts["e1|" + day] = work("10:00", "18:00");                      // sin sitio
    data.shifts["e2|" + day] = { statusId: "work", slots: [{ start: "10:00", end: "14:00", placeId: "p1" }, { start: "18:00", end: "22:00", placeId: "p2" }], overtime: null };  // turno partido en dos sitios
    data.shifts["e3|" + day] = work("10:00", "18:00", null, "p1");
    data.shifts["e4|" + day] = { statusId: "off", slots: [{ start: "10:00", end: "18:00" }], overtime: null };  // libre: no cuenta
    data.shifts["e5|" + day] = work("10:00", "18:00", null, "p1");           // de baja desde esa semana: no cuenta
    return data;
  }
  function typeClients(index, value) {
    const input = $$(".clients-input")[index];
    input.value = value;
    fire(input, "change");
    return input;
  }
  function summaryCell(row, index) { return $$(".summary-row")[row].querySelectorAll("td")[index]; }
  function ratioChip(index) { return summaryCell(1, index).querySelector(".chip"); }

  test("Temas claros: las etiquetas de estados que no son trabajar (Libre, Vacaciones…) llevan más color que los turnos, para distinguirlas; los oscuros no cambian", async function () {
    const data = fixture();
    data.employees[0].color = "#8e44ad";   // Ana, del mismo color que «Libre»: así solo cambia cuánto color lleva cada una
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00");
    data.shifts["e1|2026-11-10"] = { statusId: "off", slots: [], overtime: null };
    const w = await open(data, { extra: [["dp_theme", "claro"]] });
    const chipOf = function (key) { return $('[data-key="' + key + '"] .chip'); };
    const rgb = function (node) { return w.getComputedStyle(node).backgroundColor.match(/\d+/g).slice(0, 3).map(Number); };
    const light = function (node) { return rgb(node).reduce(function (a, b) { return a + b; }, 0); };   // cuanto más bajo, más color
    ok(chipOf("e1|2026-11-10").classList.contains("chip-status") && !chipOf("e1|2026-11-09").classList.contains("chip-status"), "el estado lleva su clase; el turno no");
    ok(light(chipOf("e1|2026-11-10")) < light(chipOf("e1|2026-11-09")) - 30, "en claro, «Libre» con más color que el turno del mismo color: " + rgb(chipOf("e1|2026-11-10")) + " frente a " + rgb(chipOf("e1|2026-11-09")));
    w.Theme.apply("oscuro");
    equal(rgb(chipOf("e1|2026-11-10")), rgb(chipOf("e1|2026-11-09")), "en oscuro, igual que hasta ahora");
  });

  test("Color de las etiquetas (Gestión → Tema): una barra de 0 (suave, como antes) a 100 (vivo) que cambia al momento, se guarda en el aparato y en la copia; en los temas claros y en los oscuros", async function () {
    const data = fixture();
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00");
    const w = await open(data, { extra: [["dp_theme", "claro"]] });
    const root = w.document.documentElement;
    const range = $("#tint-intensity");
    ok(range && range.closest(".menu-group").querySelector("summary").textContent.includes("Tema"), "la barra está en Gestión → Tema");
    equal($(".intensity").textContent.trim(), "Color de las etiquetas", "sin «(temas claros)»: vale para todos");
    equal([range.min, range.max, range.value, root.dataset.intensity], ["0", "100", "0", "0"], "de 0 a 100; en 0 por defecto: como estaba");
    // El color que pinta de verdad, pasado a rojo/verde/azul con un lienzo (el navegador puede devolverlo en oklch)
    const paint = w.document.createElement("canvas").getContext("2d");
    const chroma = function () {
      paint.clearRect(0, 0, 1, 1);
      paint.fillStyle = w.getComputedStyle($('[data-key="e1|2026-11-09"] .chip')).backgroundColor;
      paint.fillRect(0, 0, 1, 1);
      const p = paint.getImageData(0, 0, 1, 1).data;
      return Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]);   // cuanto más, más color (0 = gris)
    };
    const soft = chroma();
    range.value = "100";  fire(range, "input");
    equal([root.dataset.intensity, localStorage.getItem("dp_intensity")], ["100", "100"], "en 100: se aplica al momento y se guarda");
    const vivid = chroma();
    ok(vivid > soft + 15, "y la etiqueta tiene más color: " + soft + " → " + vivid);
    range.value = "50";  fire(range, "input");
    const medium = chroma();
    ok(medium > soft && medium < vivid, "en 50, entre los dos: " + soft + " < " + medium + " < " + vivid);
    w.Theme.apply("oscuro");
    range.value = "0";  fire(range, "input");
    const darkSoft = chroma();
    range.value = "100";  fire(range, "input");
    ok(chroma() > darkSoft + 15, "en oscuro también: " + darkSoft + " → " + chroma());
    w.Theme.apply("claro");
    range.value = "50";  fire(range, "input");
    const files = catchDownloads(w);
    $("#backup-download").click();
    await wait(300);
    equal(JSON.parse(files[0].text).settings.dp_intensity, "50", "entra en la copia de seguridad, como el tema");
    frame.contentWindow.location.reload();
    const again = await reloaded();
    equal([$("#tint-intensity").value, again.document.documentElement.dataset.intensity], ["50", "50"], "al volver a abrir, sigue");
  });

  test("Camareros por día: cuenta una vez cada persona que trabaja (no libres ni bajas) y desglosa por sitio, con el turno partido en los dos", async function () {
    const w = await open(crewFixture());
    const crew = w.Schedule.crew("2026-11-09");
    equal([crew.total, crew.noPlace], [3, 1], "3 trabajan (Ana sin sitio, Luis partido, Marta en Pub); el libre y el de baja no");
    equal(crew.byPlace.map(function (p) { return p.name + ":" + p.n; }), ["Pub:2", "Terraza:1"], "Luis suma en Pub y en Terraza, pero una sola vez en el total");
    equal(w.Schedule.crew("2026-11-10").total, 0, "un día vacío: cero");
    const cell = summaryCell(0, 0);
    equal(cell.querySelector(".crew-total").textContent, "3", "en pantalla, el total");
    equal(Array.from(cell.querySelectorAll(".crew-place")).map(function (n) { return n.textContent; }), ["2 Pub", "1 Terraza", "1 sin sitio"], "y el desglose, en etiquetas como las de las casillas");
    ok(Array.from(cell.querySelectorAll(".crew-place")).every(function (n) { return n.classList.contains("chip") && n.dataset.tint; }), "etiquetas enteras (la misma .chip de las casillas), con su color");
  });

  test("Camareros por día: un sitio con id «constructor» o «__proto__» (pasan la regla de ids de la copia) cuenta bien, sin la «llave zombie» del prototipo", async function () {
    const data = fixture();
    data.places = [{ id: "constructor", name: "Terraza", color: "#2c7be5", position: 0 }, { id: "__proto__", name: "Barra", color: "#e67e22", position: 1 }];
    data.shifts["e1|2026-11-09"] = work("10:00", "18:00", null, "constructor");
    data.shifts["e2|2026-11-09"] = work("10:00", "18:00", null, "__proto__");
    const w = await open(data);
    equal(w.Schedule.crew("2026-11-09").byPlace.map(function (p) { return p.name + ":" + p.n; }), ["Terraza:1", "Barra:1"], "cada sitio, 1");
  });

  test("Camareros por día: el desglose usa el color del sitio y se recalcula solo al cambiar un turno", async function () {
    const data = crewFixture();
    data.places[0].color = "#2c7be5";
    await open(data);
    equal(summaryCell(0, 0).querySelector(".crew-place").dataset.tint, "#2c7be5", "la etiqueta lleva el color del sitio");
    equal(fillCell("e4|2026-11-09", { status: "work", start: "09:00", end: "15:00" }), "", "se rellena un turno nuevo");
    equal(summaryCell(0, 0).querySelector(".crew-total").textContent, "4", "el total sube sin tocar nada más");
  });

  test("Clientes previstos: se guardan por fecha, vacío los quita y lo no válido (negativo, decimal, texto) se descarta y se ve lo guardado", async function () {
    await open(crewFixture());
    typeClients(0, "120");
    equal(saved().clients, { "2026-11-09": 120 }, "guardado por fecha");
    equal(typeClients(0, "-5").value, "120", "negativo: se queda lo de antes");
    equal(typeClients(0, "3.5").value, "120", "decimal: igual");
    equal(typeClients(0, "100000").value, "120", "demasiado grande: igual");
    equal(saved().clients, { "2026-11-09": 120 }, "y no se ha guardado nada raro");
    equal(typeClients(0, "0").value, "0", "cero clientes es un dato válido");
    typeClients(0, "");
    equal(saved().clients, {}, "vacío quita el dato");
  });

  test("Clientes por camarero: solo el número (clientes entre camareros), sin colores ni ideal; «—» sin clientes y «sin camareros» si nadie trabaja", async function () {
    await open(crewFixture());          // 3 camareros el lunes
    equal(summaryCell(1, 0).textContent, "—", "sin clientes: nada");
    typeClients(0, "60");  equal(ratioChip(0).textContent, "20", "60 entre 3 = 20 (solo el número: la fila ya dice «Clientes por camarero»)");
    const neutral = ratioChip(0).dataset.tint;
    typeClients(0, "76");  equal(ratioChip(0).textContent, "25,3", "76 entre 3 = 25,3 (con coma)");
    typeClients(0, "5");   equal([ratioChip(0).textContent, ratioChip(0).dataset.tint], ["1,7", neutral], "el color no cambia con la cantidad: sin avisos de colores (Nando, 11-nov)");
    equal([$$(".ratio-max-input").length, $$(".ratio-legend").length], [0, 0], "ni campo de ideal ni leyenda");
    typeClients(1, "30");   // el martes nadie trabaja
    equal(ratioChip(1).textContent, "sin camareros", "clientes y nadie trabajando");
    typeClients(1, "0");
    equal(summaryCell(1, 1).textContent, "—", "0 clientes y 0 camareros: nada");
  });

  test("Clientes: al escribir un número válido se guarda y se recalcula al momento (sin salir del campo); vaciar el campo no borra hasta salir", async function () {
    await open(crewFixture());          // 3 camareros el lunes
    const clients = $$(".clients-input")[0];
    clients.value = "75";  fire(clients, "input");
    equal([saved().clients["2026-11-09"], ratioChip(0).textContent], [75, "25"], "guardado y recalculado al escribir");
    clients.value = "";  fire(clients, "input");
    equal(saved().clients["2026-11-09"], 75, "vaciar mientras se escribe no borra el dato (se quita al salir del campo)");
    fire(clients, "change");
    equal(saved().clients, {}, "al salir del campo vacío, sí se quita");
  });

  test("Clientes con el navegador sin espacio: se deshace y se ve lo guardado de antes", async function () {
    const w = await open(crewFixture());
    typeClients(0, "90");
    const restoreStorage = breakStorage(w, "dp_data");
    const input = typeClients(0, "200");
    restoreStorage();
    equal([input.value, saved().clients["2026-11-09"]], ["90", 90], "se queda el 90");
  });

  test("Clientes previstos: una SEGUNDA tabla bajo el cuadrante, con su propia cabecera igual que la de los días, un hueco pequeño entre las dos y las columnas alineadas; en el móvil se deslizan juntas", async function () {
    const data = crewFixture();
    data.shifts["e1|2026-11-14"] = work("18:00", "02:00", { hours: 2, reason: "Cierre" }, "p2");   // un día con más contenido: arriba ensancharía su columna
    await open(data);
    const tables = $$(".schedule-table");
    equal(tables.length, 2, "dos tablas");
    const main = tables[0];
    const summary = tables[1];
    equal([main.querySelectorAll(".clients-input").length, summary.tHead.querySelectorAll(".clients-input").length], [0, 7], "los clientes son la cabecera de la segunda tabla");
    equal([main.tHead.rows.length, summary.querySelectorAll(".summary-row").length], [1, 2], "arriba solo los días; abajo, camareros y clientes por camarero");
    const css = function (element) { return frame.contentWindow.getComputedStyle(element); };
    const h1 = main.tHead.rows[0].cells;
    const h2 = summary.tHead.rows[0].cells;
    equal([css(h2[1]).backgroundColor, css(h2[0]).backgroundColor, css(h2[1]).color], [css(h1[1]).backgroundColor, css(h1[0]).backgroundColor, css(h1[1]).color], "la misma cabecera: fondo y letra");
    const box = function (element) { return element.getBoundingClientRect(); };
    ok(Math.abs(box(summary.tHead.rows[0]).height - box(main.tHead.rows[0]).height) <= 4, "y del mismo alto: " + box(summary.tHead.rows[0]).height + " frente a " + box(main.tHead.rows[0]).height + " px");
    const gap = box(summary.parentElement).top - box(main.parentElement).bottom;
    ok(gap >= 3 && gap <= 8, "un hueco pequeño entre las dos (3–8 px): " + gap + " px");
    ok(css(summary.parentElement).borderTopLeftRadius !== "0px", "la de abajo con sus esquinas redondeadas, como la de arriba");
    const lefts = function (table) { return Array.from(table.tHead.rows[0].cells).map(function (c) { return Math.round(box(c).left); }); };
    equal(lefts(summary), lefts(main), "columnas alineadas");
    try {
      frame.style.width = "360px";
      await wait(200);
      equal(lefts(summary), lefts(main), "a 360 px, también alineadas");
      equal(summary.parentElement.clientWidth, main.parentElement.clientWidth, "las dos cajas con el mismo ancho útil (la barra vertical del cuadrante no descuadra)");
      // el aviso de «scroll» llega en el siguiente fotograma, que en una pestaña poco activa tarda: se espera hasta 3 s a que se igualen
      const together = async function () {
        for (let i = 0; i < 30 && Math.abs(summary.parentElement.scrollLeft - main.parentElement.scrollLeft) > 1; i++) { await wait(100); }
        return Math.abs(summary.parentElement.scrollLeft - main.parentElement.scrollLeft) <= 1;
      };
      main.parentElement.scrollLeft = 200;
      ok(await together() && main.parentElement.scrollLeft > 100, "deslizar el cuadrante desliza la de clientes");
      summary.parentElement.scrollLeft = 50;
      ok(await together() && main.parentElement.scrollLeft < 100, "y al revés: " + main.parentElement.scrollLeft);
    } finally { frame.style.width = ""; }
  });

  test("Datos de antes (sin clientes, o con el «ideal» de cuando había colores) se abren con clientes vacíos y sin ideal", async function () {
    const old = fixture();               // la fixture no trae clients: como unos datos de antes del 14b
    old.ratioMax = 30;                   // y estos, el «ideal» de cuando había colores
    const w = await open(old);
    equal(w.Schedule.clientsOf("2026-11-09"), null, "sin clientes");
    equal("ratioMax" in w.Schedule.getData(), false, "el ideal de antes ya no se guarda");
    equal($$(".clients-input").length, 7, "y siete casillas de clientes");
  });

  test("Copia de seguridad: guarda y recupera los clientes y descarta lo que no cuadra; una copia vieja con el «ideal» se carga igual (se ignora)", async function () {
    const w = await open(crewFixture());
    typeClients(0, "88");
    const files = catchDownloads(w);
    $("#backup-download").click();
    await wait(300);
    const exported = JSON.parse(files[0].text);
    equal([exported.data.clients, "ratioMax" in exported.data], [{ "2026-11-09": 88 }, false], "la descarga lleva los clientes y ya no el ideal");

    const copy = { app: "david-planner", version: 1, exportedAt: "2026-11-10T10:00:00Z", data: fixture(), settings: {} };
    copy.data.clients = { "2026-11-10": 120, "2026-13-40": 5, "2026-11-11": -3, "2026-11-12": 2.5, "2026-11-13": "9" };
    copy.data.ratioMax = 15;   // de cuando había colores: no es un dato malo, solo ya no se usa
    const transfer = new w.DataTransfer();
    transfer.items.add(new w.File([JSON.stringify(copy)], "copia.json", { type: "application/json" }));
    const input = $("#backup-file");
    input.files = transfer.files;
    fire(input, "change");
    await wait(250);
    ok($("#import-summary").textContent.includes("se descartan 4 datos"), "cuenta lo malo (el ideal no cuenta): " + $("#import-summary").textContent);
    catchDownloads(w);
    const next = reloaded();
    $("#import-ok").click();
    await next;
    equal([saved().clients, "ratioMax" in saved()], [{ "2026-11-10": 120 }, false], "solo el dato bueno, sin el ideal");
  });

  test("Copiar la semana anterior copia los turnos pero NO los clientes", async function () {
    const data = crewFixture();
    data.clients = { "2026-11-09": 70 };
    const w = await open(data, { week: "2026-11-16" });
    equal(w.Schedule.copyPreviousWeek(1).copied, 4, "se copian los turnos (Ana, Luis, Marta y el «libre» de Libre; quien se fue, no)");
    equal(saved().clients, { "2026-11-09": 70 }, "los clientes siguen solo en su fecha");
    equal(w.Schedule.clientsOf("2026-11-16"), null, "la semana nueva no los tiene");
    equal(w.Schedule.crew("2026-11-16").total, 3, "pero los camareros sí se recuentan solos");
  });

  test("Fervis: clientes_entre da, ya calculado, los clientes, los camareros (con sitios) y los clientes por camarero de cada día, sin colores ni ideal; la guía lo explica", async function () {
    const data = crewFixture();
    data.clients = { "2026-11-09": 60, "2026-11-10": 30 };   // el lunes 3 camareros (20 cada uno); el martes, clientes y nadie trabajando
    const w = await open(data);
    const text = w.Fervis.tool("clientes_entre", { desde: "2026-11-09", hasta: "2026-11-11" });
    const line = function (iso) { return text.split("\n").find(function (l) { return l.includes("(" + iso + ")"); }); };
    ok(/60 clientes previstos; 3 camareros \(2 Pub, 1 Terraza, 1 sin sitio\); 20 clientes por camarero$/.test(line("2026-11-09")), "lunes: " + line("2026-11-09"));
    ok(/30 clientes previstos; 0 camareros; nadie trabaja$/.test(line("2026-11-10")), "martes: " + line("2026-11-10"));
    ok(/sin clientes previstos; 0 camareros$/.test(line("2026-11-11")), "miércoles: " + line("2026-11-11"));
    ok(text.includes("una sola vez en el total"), "avisa de que quien trabaja en dos sitios cuenta una vez en el total");
    ok(!/ideal|verde|naranja|rojo|aviso/i.test(text), "sin ideal ni colores: " + text);
    ok(w.Fervis.tool("clientes_entre", { desde: "2026-11-12", hasta: "2026-11-09" }).includes("Fechas no válidas"), "fechas al revés");
    ok(w.Fervis.tool("clientes_entre", { desde: "2026-11-01", hasta: "2026-12-31" }).includes("Como mucho 31 días"), "tope de 31 días");
    const guide = w.Fervis.tool("manual_app", { tema: "clientes_camareros" });
    ok(guide.includes("Clientes previstos") && guide.includes("por camarero") && !/ideal|naranja|verde hasta/i.test(guide), "la guía explica la tabla, sin colores: " + guide);
    ok(w.FervisGuide.guideFor("¿cómo pongo los clientes previstos de cada día?").includes("Clientes previstos"), "y la guía relevante lo encuentra");
  });

  test("Fervis manda un mensaje pequeño: sin los turnos ni el manual (los pide con herramientas) y con las fechas de hoy, la semana y el mes", async function () {
    const w = await open(fixture());
    const ctx = w.Fervis.context(new w.Date(2026, 10, 10, 12, 0));
    ok(!ctx.includes("lunes, 9 de noviembre") && !ctx.includes("Cómo se usa la app"), "ni turnos ni manual");
    ok(ctx.includes("hoy 2026-11-10; esta semana 2026-11-09 a 2026-11-15; la semana que viene 2026-11-16 a 2026-11-22; este mes 2026-11-01 a 2026-11-30"), "las fechas: " + ctx.split("\n").pop());
    ok(ctx.length < 1500, "mensaje de datos corto: " + ctx.length + " letras");
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
    ok(sent[1].body.messages[0].content.includes("glosario (botón 📖 de arriba)"), "el modelo sabe remitir al glosario");
    ok(sent[1].body.tools.map(function (t) { return t.function.name; }).includes("clientes_entre"), "a Groq se le ofrece clientes_entre");
    ok(sent[1].body.messages[0].content.includes("clientes_entre da los clientes previstos"), "y el mensaje de sistema dice para qué sirve");
    const tool = sent[2].body.messages.find(function (m) { return m.role === "tool"; });
    ok(tool && tool.content.includes("Ana: Trabajo 09:00–17:00"), "la consulta devuelve el 1 de diciembre");
    replies.push({ status: 401 });
    $("#fervis-question").value = "¿Y mañana?";
    $("#fervis-form").requestSubmit();
    await wait(300);
    ok($$(".fervis-msg").pop().textContent.includes("no acepta tu clave: mira en Ajustes (el icono de las tres barras)"), "401: aviso de la clave, que remite a Ajustes (el botón «🔑 Clave» ya no existe)");
    equal(asked, ["Bearer " + FAKE_KEY], "la lista de modelos se pide una sola vez");
  });

  test("Fervis: preguntas de ejemplo como chips; al tocar una se manda sola (sin clave abre Ajustes y la deja escrita) y desaparecen; la papelera las devuelve", async function () {
    let w = await open(fixture());  // sin clave
    w.Fervis.open();
    equal($$(".fervis-chip").map(function (c) { return c.textContent; }),
      ["¿Quién trabaja hoy?", "¿Cuántos clientes hay previstos hoy?", "¿Cómo copio un turno?", "¿Quién tiene turno partido y quién seguido esta semana?", "Guía de la app"], "los chips: cuatro preguntas y la guía");
    $$(".fervis-chip")[0].click();
    ok(!$("#fervis-key-form").hidden && $("#fervis-question").value === "¿Quién trabaja hoy?" && $$(".fervis-chip").length === 5 && $$(".fervis-msg").length === 1,
      "sin clave: abre Ajustes, deja la pregunta escrita y los chips siguen");
    w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const bodies = [];
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ data: MODEL_IDS.map(function (id) { return { id: id }; }) }); } }); }
      bodies.push(JSON.parse(options.body));
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ choices: [{ finish_reason: "stop", message: { role: "assistant", content: "Nadie." } }] }); } });
    };
    w.Fervis.open();
    $$(".fervis-chip")[2].click();
    await wait(200);
    equal($$(".fervis-chip").length, 0, "al mandar una pregunta, los chips desaparecen");
    equal([$$(".fervis-msg").map(function (m) { return m.firstChild.textContent; }).slice(1, 3), bodies[0].messages[bodies[0].messages.length - 1].content],
      [["¿Cómo copio un turno?", "Nadie."], "¿Cómo copio un turno?"], "la pregunta del chip se manda tal cual");
    $("#fervis-clear").click();
    equal($$(".fervis-chip").length, 5, "la papelera devuelve los chips");
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
    equal($$(".fervis-msg").map(function (m) { return m.textContent; }), ["¡Hola! Soy Fervis, tu asistente personal. Estoy aquí para ayudarte. Puedes escribirme tu consulta directamente aquí abajo o, si no sabes por dónde empezar, pulsar el botón «📖 Guía» de arriba."], "solo el saludo");
    equal(localStorage.getItem("dp_groq_key"), FAKE_KEY, "la clave sigue");
    await ask("Segunda");
    release();
    await wait(100);
    equal(bodies[1].messages.filter(function (m) { return m.role !== "system"; }).map(function (m) { return m.content; }), ["Segunda"],
      "Fervis ya no recuerda lo anterior");
  });

  test("Fervis: una respuesta vacía (el modelo se gasta todo en pensar) pasa al siguiente modelo y nunca sale «(sin respuesta)»; gpt-oss piensa poco", async function () {
    const w = await open(fixture(), { extra: [["dp_groq_key", FAKE_KEY]] });
    const bodies = [];
    const replies = [
      { choices: [{ finish_reason: "length", message: { role: "assistant", content: "" } }] },
      { choices: [{ finish_reason: "stop", message: { role: "assistant", content: "Ana tiene turno partido." } }] },
    ];
    w.fetch = function (url, options) {
      if (url.endsWith("/models")) { return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve({ data: MODEL_IDS.map(function (id) { return { id: id }; }) }); } }); }
      bodies.push(JSON.parse(options.body));
      const reply = replies.shift();
      return Promise.resolve({ ok: true, status: 200, json: function () { return Promise.resolve(reply); } });
    };
    w.Fervis.open();
    $("#fervis-question").value = "¿Quién tiene turno partido?";
    $("#fervis-form").requestSubmit();
    await wait(300);
    const last = $$(".fervis-msg").pop();
    equal([last.firstChild.textContent, last.querySelector(".fervis-model").textContent], ["Ana tiene turno partido.", "groq · openai/gpt-oss-120b (respaldo)"], "contesta el siguiente");
    ok(!$$(".fervis-msg").some(function (m) { return m.textContent.includes("(sin respuesta)"); }), "ni rastro de «(sin respuesta)»");
    equal([bodies[0].model, bodies[0].reasoning_effort, bodies[1].model, bodies[1].reasoning_effort], ["llama-3.3-70b-versatile", undefined, "openai/gpt-oss-120b", "low"],
      "esfuerzo bajo solo en gpt-oss");
    ok(bodies.every(function (b) { return b.max_tokens >= 1500; }), "con margen de palabras: " + bodies.map(function (b) { return b.max_tokens; }));
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
