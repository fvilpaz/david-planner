// Datos del cuadrante en ESTE navegador, en «dp_data»: personas, estados y turnos (forma en PLAN.md).
// La primera vez no hay nada guardado: los estados y Camarero 1–4 (STARTER_DATA). Con «?demo» en la dirección, los
// 8 inventados, guardados APARTE en «dp_demo_data»: jugar con el ejemplo nunca toca los datos de verdad.
// Si lo guardado no se puede leer, NO se pisa: se aparta a «…_broken» antes de seguir (nada se borra sin respaldo).
window.Store = (function () {
  "use strict";
  const DEMO = new URLSearchParams(window.location.search).has("demo");
  const KEY = DEMO ? "dp_demo_data" : "dp_data";
  const BROKEN = KEY + "_broken";
  const VERSION = 1;

  function looksValid(data) {
    return Boolean(data) && data.version === VERSION && Array.isArray(data.employees) &&
      Array.isArray(data.statuses) && Boolean(data.shifts) && typeof data.shifts === "object" &&
      !Array.isArray(data.shifts);
  }

  // El primer color de la paleta que no lleve ya ninguna persona, estado ni punto de venta (lo usan estados nuevos
  // «a mano» en states.js; aquí, los puntos de venta nuevos y los de antes de tener color)
  function freeColor(data) {
    const used = [].concat(data.employees, data.statuses, data.places || []).map(function (x) { return x.color; });
    return window.PALETTE.find(function (c) { return !used.includes(c); }) ||
      window.PALETTE[(data.places || []).length % window.PALETTE.length];
  }

  // Lo que se añadió después de guardar los primeros datos (paso 7b: puntos de venta; paso 14a: su color) se completa
  // al cargar, para que unos datos de antes sigan sirviendo sin perder nada. Los colores se guardan con el siguiente cambio.
  function complete(data) {
    if (!Array.isArray(data.places)) { data.places = []; }
    // Paso 14b: clientes previstos por FECHA («2026-11-09»: 120) y máximo recomendado de clientes por camarero
    if (!data.clients || typeof data.clients !== "object" || Array.isArray(data.clients)) { data.clients = {}; }
    if (!Number.isFinite(data.ratioMax) || data.ratioMax < 1) { data.ratioMax = 20; }
    data.places.forEach(function (place) {
      if (!/^#[0-9a-fA-F]{6}$/.test(place.color || "")) { place.color = freeColor(data); }
    });
    return data;
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* sin almacenamiento (modo privado): los de ejemplo */ }
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);
        if (looksValid(data)) { return complete(data); }
      } catch (e) { /* ilegible: se aparta abajo */ }
      try { localStorage.setItem(BROKEN, raw); } catch (e) { /* no cabe: al menos no se ha tocado dp_data aún */ }
    }
    // Una copia: los de arranque y los de ejemplo no se modifican nunca
    return complete(JSON.parse(JSON.stringify(DEMO ? window.DEMO_DATA : window.STARTER_DATA)));
  }

  // Devuelve si se ha podido guardar (el navegador puede negarse: modo privado o sin espacio)
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  return { KEY: KEY, DEMO: DEMO, load: load, save: save, freeColor: freeColor };
})();
