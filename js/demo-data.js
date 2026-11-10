// Datos de ejemplo INVENTADOS (ninguna persona real). En el paso 3 se sustituyen por lo guardado en el navegador.
// Forma de los datos: la propuesta de PLAN.md. Los turnos se generan para esta semana y la anterior a partir de un
// patrón semanal por persona (de lunes a domingo): «10-18» = un tramo, «10-14,18-22» = turno partido,
// «18-02» = acaba al día siguiente, y si no es un horario, el id de un estado (off, vacation, sick).
window.DEMO_DATA = (function () {
  "use strict";

  const statuses = [
    { id: "work", name: "Trabajo", color: "#2f5d8a", countsAsWork: true, position: 0 },
    { id: "off", name: "Libre", color: "#8e44ad", countsAsWork: false, position: 1 },
    { id: "vacation", name: "Vacaciones", color: "#16a085", countsAsWork: false, position: 2 },
    { id: "sick", name: "Baja", color: "#c0392b", countsAsWork: false, position: 3 },
  ];

  const people = [
    ["Lucía Ferreiro", "#2c7be5", "off off 10-18 10-18 10-18 10-18 10-18"],
    ["Marcos Otero", "#e67e22", "12-20 off off 12-20 12-20 12-20 12-20"],
    ["Ana Castro", "#d35400", "10-14,18-22 10-14,18-22 off off 10-14,18-22 10-14,18-22 10-14,18-22"],
    ["Diego Barreiro", "#8e44ad", "12-20 12-20 12-20 off off 18-02 18-02"],
    ["Sara Lema", "#c0392b", "10-14,18-22 10-14,18-22 10-14,18-22 10-14,18-22 off off 12-20"],
    ["Hugo Rial", "#16a085", "vacation vacation vacation vacation vacation vacation vacation"],
    ["Carmen Souto", "#27ae60", "off 10-14,18-22 10-14,18-22 10-14,18-22 10-14,18-22 off 10-18"],
    ["Iván Pena", "#7f8c8d", "off off 18-02 18-02 18-02 18-02 sick"],
  ];

  function hour(h) { return h.padStart(2, "0") + ":00"; }

  function parseDay(code) {
    if (!/^\d/.test(code)) { return { statusId: code, slots: [], overtime: null }; }
    const slots = code.split(",").map(function (range) {
      const parts = range.split("-");
      return { start: hour(parts[0]), end: hour(parts[1]) };
    });
    return { statusId: "work", slots: slots, overtime: null };
  }

  const employees = [];
  const shifts = {};
  const thisMonday = window.Dates.weekStart(new Date());
  people.forEach(function (person, index) {
    const id = "e" + (index + 1);
    employees.push({ id: id, name: person[0], color: person[1], position: index, leftFrom: null });
    const week = person[2].split(" ");
    [-7, 0].forEach(function (offset) {
      week.forEach(function (code, day) {
        const date = window.Dates.addDays(thisMonday, offset + day);
        shifts[id + "|" + window.Dates.toIso(date)] = parseDay(code);
      });
    });
  });

  // Un ejemplo de horas extra: Diego, el sábado de esta semana
  shifts["e4|" + window.Dates.toIso(window.Dates.addDays(thisMonday, 5))].overtime = { hours: 2, reason: "Cierre tarde" };

  return { version: 1, employees: employees, statuses: statuses, shifts: shifts };
})();
