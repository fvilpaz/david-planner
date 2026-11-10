// Datos del cuadrante en ESTE navegador, en «dp_data»: personas, estados y turnos (forma en PLAN.md).
// La primera vez no hay nada guardado y se usan los datos de ejemplo. Si lo guardado no se puede leer, NO se pisa:
// se aparta a «dp_data_broken» antes de seguir (nada se borra sin respaldo).
window.Store = (function () {
  "use strict";
  const KEY = "dp_data";
  const BROKEN = "dp_data_broken";
  const VERSION = 1;

  function looksValid(data) {
    return Boolean(data) && data.version === VERSION && Array.isArray(data.employees) &&
      Array.isArray(data.statuses) && Boolean(data.shifts) && typeof data.shifts === "object" &&
      !Array.isArray(data.shifts);
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* sin almacenamiento (modo privado): los de ejemplo */ }
    if (raw !== null) {
      try {
        const data = JSON.parse(raw);
        if (looksValid(data)) { return data; }
      } catch (e) { /* ilegible: se aparta abajo */ }
      try { localStorage.setItem(BROKEN, raw); } catch (e) { /* no cabe: al menos no se ha tocado dp_data aún */ }
    }
    return JSON.parse(JSON.stringify(window.DEMO_DATA));  // una copia: los de ejemplo no se modifican nunca
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

  return { KEY: KEY, load: load, save: save };
})();
