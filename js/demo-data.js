// Datos de ejemplo INVENTADOS (ninguna persona real): solo se ven abriendo la app con «?demo» (storage.js los guarda
// aparte, en «dp_demo_data»). Abajo, PALETTE y STARTER_DATA: lo que ve David la primera vez.
// Forma de los datos: la propuesta de PLAN.md. Los turnos se generan para esta semana y la anterior a partir de un
// patrón semanal por persona (de lunes a domingo): «10-18» = un tramo, «10-14,18-22» = turno partido,
// «18-02» = acaba al día siguiente, y si no es un horario, el id de un estado (off, vacation, sick). El 3.er dato es el
// patrón de esta semana; el 4.º, opcional, el de la semana pasada (si no, el mismo). Así hay quien libra dos fines de
// semana (Marcos), uno (Lucía) y quien está de vacaciones (Hugo): para probar las preguntas de fines de semana de Fervis.
window.DEMO_DATA = (function () {
  "use strict";

  const statuses = [
    { id: "work", name: "Trabajo", color: "#2f5d8a", countsAsWork: true, position: 0 },
    { id: "off", name: "Libre", color: "#8e44ad", countsAsWork: false, position: 1 },
    { id: "vacation", name: "Vacaciones", color: "#16a085", countsAsWork: false, position: 2 },
    { id: "sick", name: "Baja", color: "#c0392b", countsAsWork: false, position: 3 },
  ];

  const people = [
    ["Lucía Ferreiro", "#2c7be5", "off off 10-18 10-18 10-18 10-18 10-18", "off off 10-18 10-18 10-18 off off"],
    ["Marcos Otero", "#e67e22", "12-20 off off 12-20 12-20 off off"],
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

  // Puntos de venta del ejemplo (paso 7b): cada persona trabaja siempre en el mismo
  const places = [
    { id: "p1", name: "Chiringuito", color: "#2c7be5", position: 0 },   // colores que no se confunden con Libre, Vacaciones ni Baja
    { id: "p2", name: "Cafetería", color: "#e67e22", position: 1 },
    { id: "p3", name: "Pub", color: "#b7950b", position: 2 },
  ];

  const employees = [];
  const shifts = {};
  const thisMonday = window.Dates.weekStart(new Date());
  people.forEach(function (person, index) {
    const id = "e" + (index + 1);
    employees.push({ id: id, name: person[0], color: person[1], position: index, leftFrom: null });
    [[-7, person[3] || person[2]], [0, person[2]]].forEach(function (pair) {
      const offset = pair[0];
      pair[1].split(" ").forEach(function (code, day) {
        const date = window.Dates.addDays(thisMonday, offset + day);
        const shift = parseDay(code);
        shift.slots.forEach(function (slot) { slot.placeId = places[index % places.length].id; });
        shifts[id + "|" + window.Dates.toIso(date)] = shift;
      });
    });
  });

  // Un ejemplo de horas extra: Diego, el sábado de esta semana
  shifts["e4|" + window.Dates.toIso(window.Dates.addDays(thisMonday, 5))].overtime = { hours: 2, reason: "Cierre tarde" };

  // Clientes previstos de las dos semanas con turnos (más a fin de semana)
  const clients = {};
  [[-7, [210, 225, 240, 280, 340, 360, 300]], [0, [220, 230, 250, 290, 350, 370, 310]]].forEach(function (week) {
    week[1].forEach(function (n, day) { clients[window.Dates.toIso(window.Dates.addDays(window.Dates.addDays(thisMonday, week[0]), day))] = n; });
  });

  return { version: 1, employees: employees, statuses: statuses, places: places, shifts: shifts, clients: clients };
})();

// Los colores que se ofrecen para el personal: bien distintos entre sí y sin fucsia ni rosas (son el aviso de horas extra)
// Los colores de las personas y de los estados. Los 10 primeros no se mueven de sitio (los cuatro camareros de la
// primera vez y los datos ya guardados dependen de su orden); los 10 siguientes (Nando, 10-nov) se añaden al final.
// Ninguno rosa ni fucsia: ese tono es solo del aviso de horas extra.
window.PALETTE = ["#2c7be5", "#e67e22", "#27ae60", "#8e44ad", "#16a085", "#d35400", "#c0392b", "#7f8c8d", "#2c3e50", "#b7950b",
                  "#0ea5c6", "#7cb518", "#8d5524", "#4f46e5", "#6b8e23", "#9b7fd4", "#1e6b43", "#7b2d26", "#3d5a80", "#c2b280"];

// Lo que ve David la primera vez: los estados y cuatro camareros genéricos sin turnos, para que vea la forma del
// cuadrante y solo tenga que cambiar los nombres (tocando el nombre). Idea de Nando, 10-nov-2026.
window.STARTER_DATA = {
  version: 1,
  statuses: window.DEMO_DATA.statuses,
  employees: [1, 2, 3, 4].map(function (n) {
    return { id: "e" + n, name: "Camarero " + n, color: window.PALETTE[n - 1], position: n - 1, leftFrom: null };
  }),
  places: [],  // sin puntos de venta: «Dónde» no aparece hasta que David cree alguno
  shifts: {},
};
