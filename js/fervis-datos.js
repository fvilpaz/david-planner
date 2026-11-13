// Fervis — los DATOS (refactor de la auditoría, 10-nov; antes dentro de fervis.js). Lo que la APP calcula para el modelo, que no
// cuenta nada a ojo: el mensaje pequeño de cada pregunta (context: personal, estados, puntos de venta, quién trabaja ahora y las
// fechas) y las herramientas que pide el modelo (runTool: turnos_entre, resumen_entre y clientes_entre; manual_app la contesta la guía, en
// fervis-guia.js). Solo lee los datos (window.Schedule.getData). Se carga antes que fervis-guia.js y fervis.js.
// Los textos salen en el idioma elegido (js/lang-*.js, claves «fd.*»): también los de la demo, que se enseñan tal cual al usuario.
window.FervisData = (function () {
  "use strict";
  const t = window.I18n.t;

  // ---------- Lo que sabe Fervis (paso 12b): los datos de la app como texto. Lo arma la app, no la IA ----------
  const DAY = window.I18n.formatter(Intl.DateTimeFormat, { weekday: "long", day: "numeric", month: "long" });
  const MAX_DAYS = 31;  // la consulta de otras fechas: como mucho un mes de una vez

  function minutes(time) { const parts = String(time).split(":"); return Number(parts[0]) * 60 + Number(parts[1]); }

  function inOrder(list) { return list.slice().sort(function (a, b) { return a.position - b.position; }); }

  function statusOf(data, shift) { return shift && data.statuses.find(function (s) { return s.id === shift.statusId; }); }

  // Quien ya no trabaja aquí desde una fecha no sale ese día ni después (como en el cuadrante)
  function staffOn(data, iso) {
    return inOrder(data.employees).filter(function (e) { return !e.leftFrom || e.leftFrom > iso; });
  }

  // Un número de horas con la coma decimal en español y el punto en inglés
  function decimal(n) { return String(n).replace(".", window.I18n.current() === "es" ? "," : "."); }

  function slotText(data, slot) {
    const place = slot.placeId && data.places.find(function (p) { return p.id === slot.placeId; });
    return slot.start + "–" + slot.end + (place ? t("fd.at", { place: window.I18n.displayPlace(place) }) : "");
  }

  function shiftText(data, shift) {
    const status = statusOf(data, shift);
    if (!status) { return t("fd.nothing"); }
    let text = window.I18n.displayStatus(status);
    if (status.countsAsWork && shift.slots.length) {
      text += " " + shift.slots.map(function (slot) { return slotText(data, slot); }).join(t("fd.and"));
    }
    if (shift.overtime) {
      text += t("fd.overtime", { hours: decimal(shift.overtime.hours) }) +
        (shift.overtime.reason ? " (" + shift.overtime.reason + ")" : "");
    }
    return text;
  }

  const norm = function (text) { return String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // El filtro opcional de las herramientas: una persona, por su nombre o parte (sin tildes ni mayúsculas). Vale el nombre
  // guardado y también el que se ve en el idioma elegido («Camarero 1» / «Waiter 1»).
  function pick(people, name) {
    if (!name) { return people; }
    const wanted = norm(name);
    return people.filter(function (e) {
      return norm(e.name).includes(wanted) || norm(window.I18n.displayName(e.name)).includes(wanted);
    });
  }

  function rangeLines(data, from, days, name) {
    const lines = [];
    for (let i = 0; i < days; i++) {
      const date = Dates.addDays(from, i);
      const iso = Dates.toIso(date);
      const people = pick(staffOn(data, iso), name);
      lines.push("- " + DAY.format(date) + " (" + iso + "): " + (people.length ? people.map(function (e) {
        return window.I18n.displayName(e.name) + ": " + shiftText(data, data.shifts[e.id + "|" + iso]);
      }).join("; ") : t("fd.nobodyStaff")));
    }
    return lines.join("\n");
  }

  // Resumen por persona, CONTADO POR LA APP (el modelo, contando a ojo, se equivocaba: decía que alguien trabajaba de lunes
  // a viernes cuando libraba jueves y viernes, y contestaba «2 días libres» sin decir si eran días sueltos o fines de
  // semana enteros). Días de turno partido (dos tramos), de turno seguido (uno) y de cada estado sin horario; y de los
  // fines de semana: los COMPLETOS sin trabajar (sábado y domingo) aparte de los sábados o domingos sueltos.
  const SHORT_DATE = window.I18n.formatter(Intl.DateTimeFormat, { weekday: "short", day: "numeric", month: "short" });
  const DAY_NUMBER = window.I18n.formatter(Intl.DateTimeFormat, { day: "numeric" });
  const MONTH_SHORT = window.I18n.formatter(Intl.DateTimeFormat, { month: "short" });
  function dayLabel(data, e, date) {  // cómo cuenta ese día: trabaja (con qué turno) o su estado
    const shift = data.shifts[e.id + "|" + Dates.toIso(date)];
    const status = statusOf(data, shift);
    const works = !!(status && status.countsAsWork && shift.slots.length);
    return { works: works, empty: !status, label: !status ? t("fd.nothing") : works ? (shift.slots.length > 1 ? t("fd.split") : t("fd.straight")) : window.I18n.displayStatus(status).toLowerCase() };
  }
  // «Libre» de verdad: un estado sin horario puesto a propósito. Un día SIN NADA PUESTO es un día sin planificar, no libre.
  function isOff(day) { return !day.works && !day.empty; }
  function summaryLines(data, from, days, name) {
    const SPLIT = t("fd.split");        // las etiquetas de trabajo en el idioma de ahora: así se comparan y se ordenan
    const STRAIGHT = t("fd.straight");
    const rows = pick(inOrder(data.employees), name).map(function (e) {
      const counts = Object.create(null);  // sin prototipo: un estado llamado «constructor» o «__proto__» no choca (auditoría 10-nov)
      const order = [];
      const off = [];                 // sábados y domingos sin trabajar: { iso, saturday, text }
      const full = [];                // fines de semana completos (sábado y domingo) sin trabajar: { saturday, text }
      for (let i = 0; i < days; i++) {
        const date = Dates.addDays(from, i);
        const iso = Dates.toIso(date);
        if (e.leftFrom && e.leftFrom <= iso) { continue; }
        const day = dayLabel(data, e, date);
        if (!counts[day.label]) { counts[day.label] = 0; order.push(day.label); }
        counts[day.label]++;
        const weekday = date.getDay();
        if ((weekday === 6 || weekday === 0) && isOff(day)) {
          off.push({ saturday: weekday === 6 ? iso : Dates.toIso(Dates.addDays(date, -1)), text: SHORT_DATE.format(date).replace(/\./g, "") + " (" + day.label + ")" });
        }
        if (weekday === 6 && i + 1 < days) {  // sábado con su domingo dentro del período
          const sunday = Dates.addDays(date, 1);
          const second = dayLabel(data, e, sunday);
          if (isOff(day) && isOff(second) && !(e.leftFrom && e.leftFrom <= Dates.toIso(sunday))) {
            // con el motivo (libre, vacaciones, baja…): no es lo mismo librar que estar de vacaciones
            const why = day.label === second.label ? day.label : day.label + t("fd.and") + second.label;
            full.push({ saturday: iso, text: DAY_NUMBER.format(date) + "–" + DAY_NUMBER.format(sunday) + " " + MONTH_SHORT.format(sunday).replace(".", "") + " (" + why + ")" });
          }
        }
      }
      order.sort(function (a, b) {  // primero los de trabajo
        const rank = function (l) { return l === SPLIT ? 0 : l === STRAIGHT ? 1 : 2; };
        return rank(a) - rank(b);
      });
      const fullSaturdays = full.map(function (f) { return f.saturday; });
      const loose = off.filter(function (d) { return !fullSaturdays.includes(d.saturday); });  // los que no forman un fin de semana completo
      return { name: window.I18n.displayName(e.name), counts: counts, order: order, full: full, loose: loose };
    });
    const lines = rows.map(function (r) {
      return "- " + r.name + ": " + (r.order.map(function (l) { return l + " " + window.I18n.tn("fd.days", r.counts[l]); }).join("; ") || t("fd.none")) +
        t("fd.fullLabel") + r.full.length + (r.full.length ? " (" + r.full.map(function (f) { return f.text; }).join(", ") + ")" : "") +
        t("fd.looseLabel") + r.loose.length + (r.loose.length ? " (" + r.loose.map(function (d) { return d.text; }).join(", ") + ")" : "");
    });
    if (rows.length > 1) {  // el ranking, ya hecho: el modelo lo repite, no ordena él
      const rank = function (list, key, detail) {
        const top = list.filter(function (r) { return r[key].length > 0; }).sort(function (a, b) { return b[key].length - a[key].length; });
        return top.length ? top.map(function (r) { return r.name + " " + r[key].length + " (" + detail(r) + ")"; }).join(", ") : t("fd.nobody");
      };
      lines.push(t("fd.rankFull", { list: rank(rows, "full", function (r) { return r.full.map(function (f) { return f.text; }).join(", "); }) }));
      lines.push(t("fd.rankLoose", { list: rank(rows, "loose", function (r) { return r.loose.map(function (d) { return d.text; }).join(", "); }) }));
    }
    return lines.join("\n");
  }

  // Quién está trabajando AHORA: los tramos de hoy y los de ayer que cruzan la medianoche (22:00–02:00 acaba hoy)
  function onShiftNow(data, now) {
    const time = now.getHours() * 60 + now.getMinutes();
    const days = [[Dates.toIso(now), false], [Dates.toIso(Dates.addDays(now, -1)), true]];
    const found = [];
    inOrder(data.employees).forEach(function (e) {
      days.forEach(function (day) {
        const shift = data.shifts[e.id + "|" + day[0]];
        const status = statusOf(data, shift);
        if (!status || !status.countsAsWork || (e.leftFrom && e.leftFrom <= day[0])) { return; }
        shift.slots.forEach(function (slot) {
          if (!slot.start || !slot.end) { return; }
          const start = minutes(slot.start);
          const end = minutes(slot.end);
          const crosses = end <= start;
          const working = day[1] ? crosses && time < end : time >= start && (crosses || time < end);
          if (working) { found.push(window.I18n.displayName(e.name) + " (" + slotText(data, slot) + (day[1] ? t("fd.startedYesterday") : "") + ")"); }
        });
      });
    });
    return found;
  }

  function context(now) {
    const data = window.Schedule.getData();
    const monday = Dates.weekStart(now);
    const people = inOrder(data.employees);
    const working = onShiftNow(data, now);
    const setting = function (key) { try { return localStorage.getItem(key) || ""; } catch (error) { return ""; } };
    const lines = [
      t("fd.now", { day: DAY.format(now), year: now.getFullYear(),
        time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0") }),
      t("fd.venue", { name: setting("dp_name") || t("fd.noName") }) + (setting("dp_city") ? ", " + setting("dp_city") : "") +
        (setting("dp_person") ? t("fd.whoUses", { person: setting("dp_person") }) : "") + ".",
      t("fd.staff", { n: people.length, list: people.map(function (e) {
        return window.I18n.displayName(e.name) + (e.leftFrom ? t("fd.leftFrom", { date: e.leftFrom }) : "");
      }).join(", ") || t("fd.nobody") }),
    ];
    if (!people.length) { lines.push(t("fd.warnNoStaff")); }
    else if (people.every(function (e) { return /^Camarero \d+$/.test(e.name); })) {
      lines.push(t("fd.warnFactory"));
    }
    if (!Object.keys(data.shifts).length) { lines.push(t("fd.warnNoShifts")); }
    lines.push(
      t("fd.statuses", { list: inOrder(data.statuses).map(function (s) { return window.I18n.displayStatus(s) + (s.countsAsWork ? t("fd.withHours") : ""); }).join(", ") }),
      t("fd.places", { list: inOrder(data.places).map(function (p) { return window.I18n.displayPlace(p); }).join(", ") || t("fd.noneM") }),
      t("fd.workingNow", { list: working.join("; ") || t("fd.nobody") }),
      t("fd.dates", { today: Dates.toIso(now), w1: Dates.toIso(monday), w2: Dates.toIso(Dates.addDays(monday, 6)),
        n1: Dates.toIso(Dates.addDays(monday, 7)), n2: Dates.toIso(Dates.addDays(monday, 13)),
        m1: Dates.toIso(new Date(now.getFullYear(), now.getMonth(), 1)),
        m2: Dates.toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) }));
    return lines.join("\n");
  }

  // Las herramientas de Fervis: las funciones de la app calculan y le dan al modelo la respuesta ya hecha (así no recibe todos
  // los turnos en cada pregunta —gasta muchos menos tokens— ni cuenta él a ojo). Las llama el modelo; también las pruebas.
  const MAX_SUMMARY_DAYS = 93;
  function range(args, max) {
    const from = Dates.parseIso(args && args.desde);
    const to = Dates.parseIso(args && args.hasta);
    if (!from || !to || to < from) { return { error: t("fd.errDates") }; }
    const days = Math.round((to - from) / 86400000) + 1;  // redondeo: un día con cambio de hora no mide 24 h
    if (days > max) { return { error: t("fd.errMax", { max: max }) }; }
    return { from: from, days: days };
  }

  // Clientes previstos, camareros y clientes por camarero de cada día (paso 14b): lo calcula la app (Schedule.crew / ratioInfo, lo
  // mismo que ve David en la tabla de debajo del cuadrante), el modelo solo lo repite. «hasta 31 días» como turnos_entre.
  const RATIO_FORMAT = window.I18n.formatter(Intl.NumberFormat, { maximumFractionDigits: 1 });
  function clientLines(from, days) {
    const lines = [t("fd.crewNote")];
    for (let i = 0; i < days; i++) {
      const date = Dates.addDays(from, i);
      const iso = Dates.toIso(date);
      const info = window.Schedule.ratioInfo(iso);
      const crew = window.Schedule.crew(iso);
      const places = crew.byPlace.map(function (p) { return p.n + " " + window.I18n.displayPlace(p); });
      if (crew.noPlace && crew.byPlace.length) { places.push(t("clients.noPlace", { n: crew.noPlace })); }
      const ratio = info.ratio !== null ? t("fd.ratioSuffix", { ratio: RATIO_FORMAT.format(info.ratio) }) :
        info.clients ? t("fd.nobodyWorks") : "";
      lines.push("- " + DAY.format(date) + " (" + iso + "): " + (info.clients === null ? t("fd.clientsNone") : t("fd.clientsSome", { n: info.clients })) +
        "; " + t("fd.waiters", { n: crew.total }) + (places.length ? " (" + places.join(", ") + ")" : "") + ratio);
    }
    return lines.join("\n");
  }

  function runTool(name, args) {
    const data = window.Schedule.getData();
    if (name === "manual_app") { return window.FervisGuide.manual(args && args.tema); }  // la guía está en fervis-guia.js
    if (name !== "turnos_entre" && name !== "resumen_entre" && name !== "clientes_entre") { return t("fd.noTool"); }
    if (name === "clientes_entre") {
      const wanted = range(args, MAX_DAYS);
      return wanted.error || clientLines(wanted.from, wanted.days);
    }
    const asked = range(args, name === "resumen_entre" ? MAX_SUMMARY_DAYS : MAX_DAYS);
    if (asked.error) { return asked.error; }
    const who = args && args.persona ? String(args.persona) : "";
    if (who && !pick(inOrder(data.employees), who).length) { return t("fd.noPerson", { who: who }); }
    return name === "turnos_entre" ? rangeLines(data, asked.from, asked.days, who) : summaryLines(data, asked.from, asked.days, who);
  }

  // Los chips de la demo (sin IA ni clave): cada uno contesta SOLO a lo que dice, con lo que calcula la app.
  // kind: hoy | clientes | partidoSeguido; otro → null (quien llama da el aviso de que eso no lo sé)
  function demoReply(kind, now) {
    const data = window.Schedule.getData();
    const monday = Dates.weekStart(now);
    const names = function (items) { return items.length ? items.join(", ") : t("fd.nobody"); };
    const days = function (n) { return window.I18n.tn("fd.days", n); };
    if (kind === "hoy") {
      const works = [], rest = [];
      staffOn(data, Dates.toIso(now)).forEach(function (e) {
        const day = dayLabel(data, e, now);
        const shown = window.I18n.displayName(e.name);
        if (day.works) { works.push("- " + shown + ": " + data.shifts[e.id + "|" + Dates.toIso(now)].slots.map(function (s) { return slotText(data, s); }).join(t("fd.and"))); }
        else { rest.push(shown + " (" + day.label + ")"); }
      });
      return t("fd.todayHeader", { day: DAY.format(now) }) + "\n" + (works.join("\n") || t("fd.todayNobody")) + "\n" + t("fd.todayRest", { list: names(rest) });
    }
    if (kind === "clientes") {
      const iso = Dates.toIso(now);
      const info = window.Schedule.ratioInfo(iso);
      const crew = window.Schedule.crew(iso);
      if (info.clients === null) { return t("fd.todayNoClients"); }
      return t("fd.todayClients", { n: info.clients, crew: crew.total }) +
        (info.ratio !== null ? t("fd.todayRatio", { ratio: RATIO_FORMAT.format(info.ratio) }) : ".");
    }
    if (kind !== "partidoSeguido") { return null; }
    const SPLIT = t("fd.split");
    const split = [], straight = [];
    // Quien está el lunes: si causa baja a media semana, cuentan los días que trabajó antes (el bucle se salta los de después)
    staffOn(data, Dates.toIso(monday)).forEach(function (e) {
      // Solo días de trabajo: un estado sin horario que se llame «Turno partido» no cuenta (su etiqueta es su nombre)
      let splitDays = 0, straightDays = 0;
      for (let i = 0; i < 7; i++) {
        const date = Dates.addDays(monday, i);
        if (e.leftFrom && e.leftFrom <= Dates.toIso(date)) { continue; }
        const day = dayLabel(data, e, date);
        if (day.works && day.label === SPLIT) { splitDays++; } else if (day.works) { straightDays++; }
      }
      if (splitDays) { split.push(window.I18n.displayName(e.name) + " (" + days(splitDays) + ")"); }
      if (straightDays) { straight.push(window.I18n.displayName(e.name) + " (" + days(straightDays) + ")"); }
    });
    return t("fd.weekHeader", { split: names(split), straight: names(straight) });
  }

  return { norm: norm, context: context, runTool: runTool, demoReply: demoReply };
})();
