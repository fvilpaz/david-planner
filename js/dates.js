// Fechas del cuadrante, siempre con la hora LOCAL del aparato. Se guardan como texto «AAAA-MM-DD».
// Ojo: toISOString() da la fecha en hora UTC; en España, de 00:00 a 01:00 (02:00 en verano) devolvería el día anterior.
window.Dates = (function () {
  "use strict";

  function pad(n) { return String(n).padStart(2, "0"); }

  function toIso(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  // «AAAA-MM-DD» → fecha, o null si no es una fecha que exista (2026-02-31 no existe: Date la pasaría a marzo)
  function parseIso(text) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text || "");
    if (!match) { return null; }
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return toIso(date) === text ? date : null;
  }

  function addDays(date, days) {
    const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    result.setDate(result.getDate() + days);
    return result;
  }

  // El lunes de la semana de `date`. getDay() cuenta desde el domingo (0); (getDay() + 6) % 7 cuenta desde el lunes.
  function weekStart(date) { return addDays(date, -((date.getDay() + 6) % 7)); }

  return { toIso: toIso, parseIso: parseIso, addDays: addDays, weekStart: weekStart };
})();
