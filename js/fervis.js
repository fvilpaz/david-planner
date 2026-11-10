// Fervis (paso 12, idea de Nando): el asistente de los turnos. 12a: la ventana y la clave de Groq de David. 12b: que
// conteste. Habla de lo general y sabe de la app: un manual corto y los datos como texto (personal, estados, puntos de
// venta, quién trabaja ahora, esta semana y la siguiente); otras fechas, con la consulta turnos_entre. Solo lee.
// La clave es de David (cuenta gratuita en console.groq.com) y vive SOLO en este navegador, en «dp_groq_key»: no está
// en el código (el repositorio es público) ni en la copia de seguridad (backup.js copia una lista fija de claves,
// SETTINGS, y esta no está). La limpieza al pegar es la de Crypto_Portafolio/js/fervis.js. Todo con textContent.
window.Fervis = (function () {
  "use strict";
  const KEY = "dp_groq_key";
  const dialog = document.getElementById("fervis-dialog");
  const keyForm = document.getElementById("fervis-key-form");
  const keyInput = document.getElementById("fervis-key");
  const keyState = document.getElementById("fervis-key-state");
  const keyRemove = document.getElementById("fervis-key-remove");
  const keyToggle = document.getElementById("fervis-key-toggle");
  const messages = document.getElementById("fervis-messages");
  const chat = document.getElementById("fervis-form");
  const question = document.getElementById("fervis-question");

  function readKey() { try { return localStorage.getItem(KEY) || ""; } catch (error) { return ""; } }

  function writeKey(value) {
    try {
      if (value) { localStorage.setItem(KEY, value); } else { localStorage.removeItem(KEY); }
      return true;
    } catch (error) { return false; }
  }

  // Lo que se pega suele venir de un .env: «GROQ_API_KEY=gsk_…», con comillas, o con «export» o «Bearer» delante
  function cleanKey(text) {
    return String(text || "").trim().replace(/^export\s+/i, "").replace(/^bearer\s+/i, "")
      .replace(/^[A-Za-z][A-Za-z0-9_]*\s*=\s*/, "").replace(/^["'`]+|["'`]+$/g, "").trim();
  }

  // Solo que lo parezca (sin espacios, de un largo razonable); si vale o no, se sabe al usarla
  function looksValid(key) { return /^[\w.-]{20,300}$/.test(key); }

  function mask(key) { return (key.startsWith("gsk_") ? "gsk_" : "") + "…" + key.slice(-4); }

  function say(who, text) {
    const item = messages.appendChild(document.createElement("li"));
    item.className = "fervis-msg " + who;
    item.textContent = text;
    messages.scrollTop = messages.scrollHeight;
    return item;
  }

  // ---------- Lo que sabe Fervis (paso 12b): los datos de la app como texto. Lo arma la app, no la IA ----------
  const DAY = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" });
  const MAX_DAYS = 31;  // la consulta de otras fechas: como mucho un mes de una vez

  function minutes(time) { const parts = String(time).split(":"); return Number(parts[0]) * 60 + Number(parts[1]); }

  function inOrder(list) { return list.slice().sort(function (a, b) { return a.position - b.position; }); }

  function statusOf(data, shift) { return shift && data.statuses.find(function (s) { return s.id === shift.statusId; }); }

  // Quien ya no trabaja aquí desde una fecha no sale ese día ni después (como en el cuadrante)
  function staffOn(data, iso) {
    return inOrder(data.employees).filter(function (e) { return !e.leftFrom || e.leftFrom > iso; });
  }

  function slotText(data, slot) {
    const place = slot.placeId && data.places.find(function (p) { return p.id === slot.placeId; });
    return slot.start + "–" + slot.end + (place ? " en " + place.name : "");
  }

  function shiftText(data, shift) {
    const status = statusOf(data, shift);
    if (!status) { return "sin nada puesto"; }
    let text = status.name;
    if (status.countsAsWork && shift.slots.length) {
      text += " " + shift.slots.map(function (slot) { return slotText(data, slot); }).join(" y ");
    }
    if (shift.overtime) {
      text += ", +" + String(shift.overtime.hours).replace(".", ",") + " h extra" +
        (shift.overtime.reason ? " (" + shift.overtime.reason + ")" : "");
    }
    return text;
  }

  const norm = function (text) { return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };

  // El filtro opcional de las herramientas: una persona, por su nombre o parte (sin tildes ni mayúsculas)
  function pick(people, name) {
    if (!name) { return people; }
    const wanted = norm(name);
    return people.filter(function (e) { return norm(e.name).includes(wanted); });
  }

  function rangeLines(data, from, days, name) {
    const lines = [];
    for (let i = 0; i < days; i++) {
      const date = Dates.addDays(from, i);
      const iso = Dates.toIso(date);
      const people = pick(staffOn(data, iso), name);
      lines.push("- " + DAY.format(date) + " (" + iso + "): " + (people.length ? people.map(function (e) {
        return e.name + ": " + shiftText(data, data.shifts[e.id + "|" + iso]);
      }).join("; ") : "nadie en el personal"));
    }
    return lines.join("\n");
  }

  // Resumen por persona, CONTADO POR LA APP (el modelo, contando a ojo, se equivocaba: decía que alguien trabajaba de lunes
  // a viernes cuando libraba jueves y viernes, y contestaba «2 días libres» sin decir si eran días sueltos o fines de
  // semana enteros). Días de turno partido (dos tramos), de turno seguido (uno) y de cada estado sin horario; y de los
  // fines de semana: los COMPLETOS sin trabajar (sábado y domingo) aparte de los sábados o domingos sueltos.
  const SHORT_DATE = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" });
  const DAY_NUMBER = new Intl.DateTimeFormat("es-ES", { day: "numeric" });
  const MONTH_SHORT = new Intl.DateTimeFormat("es-ES", { month: "short" });
  function dayLabel(data, e, date) {  // cómo cuenta ese día: trabaja (con qué turno) o su estado
    const shift = data.shifts[e.id + "|" + Dates.toIso(date)];
    const status = statusOf(data, shift);
    const works = !!(status && status.countsAsWork && shift.slots.length);
    return { works: works, empty: !status, label: !status ? "sin nada puesto" : works ? (shift.slots.length > 1 ? "turno partido" : "turno seguido") : status.name.toLowerCase() };
  }
  // «Libre» de verdad: un estado sin horario puesto a propósito. Un día SIN NADA PUESTO es un día sin planificar, no libre.
  function isOff(day) { return !day.works && !day.empty; }
  function summaryLines(data, from, days, name) {
    const rows = pick(inOrder(data.employees), name).map(function (e) {
      const counts = {};
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
            const why = day.label === second.label ? day.label : day.label + " y " + second.label;
            full.push({ saturday: iso, text: DAY_NUMBER.format(date) + "–" + DAY_NUMBER.format(sunday) + " " + MONTH_SHORT.format(sunday).replace(".", "") + " (" + why + ")" });
          }
        }
      }
      order.sort(function (a, b) {  // primero los de trabajo
        const rank = function (l) { return l === "turno partido" ? 0 : l === "turno seguido" ? 1 : 2; };
        return rank(a) - rank(b);
      });
      const fullSaturdays = full.map(function (f) { return f.saturday; });
      const loose = off.filter(function (d) { return !fullSaturdays.includes(d.saturday); });  // los que no forman un fin de semana completo
      return { name: e.name, counts: counts, order: order, full: full, loose: loose };
    });
    const lines = rows.map(function (r) {
      return "- " + r.name + ": " + (r.order.map(function (l) { return l + " " + r.counts[l] + (r.counts[l] === 1 ? " día" : " días"); }).join("; ") || "nada") +
        " | fines de semana completos sin trabajar (sábado y domingo): " + r.full.length + (r.full.length ? " (" + r.full.map(function (f) { return f.text; }).join(", ") + ")" : "") +
        " | sábados o domingos sueltos sin trabajar: " + r.loose.length + (r.loose.length ? " (" + r.loose.map(function (d) { return d.text; }).join(", ") + ")" : "");
    });
    if (rows.length > 1) {  // el ranking, ya hecho: el modelo lo repite, no ordena él
      const rank = function (list, key, detail) {
        const top = list.filter(function (r) { return r[key].length > 0; }).sort(function (a, b) { return b[key].length - a[key].length; });
        return top.length ? top.map(function (r) { return r.name + " " + r[key].length + " (" + detail(r) + ")"; }).join(", ") : "nadie";
      };
      lines.push("RANKING de fines de semana completos sin trabajar (de más a menos; ojo al motivo: vacaciones o baja no es librar): " +
        rank(rows, "full", function (r) { return r.full.map(function (f) { return f.text; }).join(", "); }));
      lines.push("RANKING de sábados o domingos sueltos sin trabajar (de más a menos): " +
        rank(rows, "loose", function (r) { return r.loose.map(function (d) { return d.text; }).join(", "); }));
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
          if (working) { found.push(e.name + " (" + slotText(data, slot) + (day[1] ? ", empezó ayer" : "") + ")"); }
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
      "Ahora: " + DAY.format(now) + " de " + now.getFullYear() + ", " + String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0") + ".",
      "Local: " + (setting("dp_name") || "sin nombre") + (setting("dp_city") ? ", " + setting("dp_city") : "") +
        (setting("dp_person") ? ". Quien usa la app: " + setting("dp_person") : "") + ".",
      "Personal (" + people.length + "): " + (people.map(function (e) {
        return e.name + (e.leftFrom ? " (ya no trabaja aquí desde el " + e.leftFrom + ")" : "");
      }).join(", ") || "nadie") + ".",
    ];
    if (!people.length) { lines.push("AVISO: no hay nadie en el personal."); }
    else if (people.every(function (e) { return /^Camarero \d+$/.test(e.name); })) {
      lines.push("AVISO: son los nombres que trae la app la primera vez (Camarero 1, 2…): aún no está el personal de verdad.");
    }
    if (!Object.keys(data.shifts).length) { lines.push("AVISO: todavía no hay ningún turno puesto en ninguna semana."); }
    lines.push(
      "Estados: " + inOrder(data.statuses).map(function (s) { return s.name + (s.countsAsWork ? " (con horario)" : ""); }).join(", ") + ".",
      "Puntos de venta: " + (inOrder(data.places).map(function (p) { return p.name; }).join(", ") || "ninguno") + ".",
      "Trabajando ahora mismo: " + (working.join("; ") || "nadie") + ".",
      "Fechas: hoy " + Dates.toIso(now) + "; esta semana " + Dates.toIso(monday) + " a " + Dates.toIso(Dates.addDays(monday, 6)) +
        "; la semana que viene " + Dates.toIso(Dates.addDays(monday, 7)) + " a " + Dates.toIso(Dates.addDays(monday, 13)) +
        "; este mes " + Dates.toIso(new Date(now.getFullYear(), now.getMonth(), 1)) + " a " +
        Dates.toIso(new Date(now.getFullYear(), now.getMonth() + 1, 0)) + ".");
    return lines.join("\n");
  }

  // Las herramientas de Fervis: las funciones de la app calculan y le dan al modelo la respuesta ya hecha (así no recibe todos
  // los turnos en cada pregunta —gasta muchos menos tokens— ni cuenta él a ojo). Las llama el modelo; también las pruebas.
  const MAX_SUMMARY_DAYS = 93;
  function range(args, max) {
    const from = Dates.parseIso(args && args.desde);
    const to = Dates.parseIso(args && args.hasta);
    if (!from || !to || to < from) { return { error: "Fechas no válidas: AAAA-MM-DD, y «hasta» no puede ser antes que «desde»." }; }
    const days = Math.round((to - from) / 86400000) + 1;  // redondeo: un día con cambio de hora no mide 24 h
    if (days > max) { return { error: "Como mucho " + max + " días de una vez." }; }
    return { from: from, days: days };
  }

  function runTool(name, args) {
    const data = window.Schedule.getData();
    if (name === "manual_app") { return manual(args && args.tema); }
    if (name !== "turnos_entre" && name !== "resumen_entre") { return "No existe esa herramienta."; }
    const asked = range(args, name === "resumen_entre" ? MAX_SUMMARY_DAYS : MAX_DAYS);
    if (asked.error) { return asked.error; }
    const who = args && args.persona ? String(args.persona) : "";
    if (who && !pick(inOrder(data.employees), who).length) { return "No encuentro a nadie que se llame «" + who + "» en el personal."; }
    return name === "turnos_entre" ? rangeLines(data, asked.from, asked.days, who) : summaryLines(data, asked.from, asked.days, who);
  }

  // La guía de la app, por temas y en pasos. Sale de dos formas: el botón 📖 y los chips la enseñan SIN el modelo (la responde la
  // app: instantánea, gratis y sin clave de Groq), y el modelo la consulta con manual_app para los «cómo hago…». Si cambia algo de
  // la app, se cambia aquí: una prueba comprueba que cada botón del menú y de la casilla sale en la guía. Cada tema: id, emoji,
  // título y pasos.
  const GUIDE = [
    ["empezar", "🧭", "Moverse por el cuadrante", [
      "El cuadrante muestra una semana, de lunes a domingo.",
      "‹ y › cambian de semana.",
      "Toca el título (con el 📅) para abrir un calendario y saltar a cualquier fecha.",
      "«Hoy» vuelve a esta semana (solo sale si estás en otra).",
      "Los nombres y los días se quedan fijos al deslizar.",
      "Toca una casilla para editarla y un nombre para abrir la ficha de esa persona."]],
    ["casilla", "✏️", "Poner o cambiar un turno", [
      "Toca la casilla del día y la persona.",
      "Elige el Estado (Trabajo, Libre, Vacaciones, Baja…).",
      "Si es de trabajo: pon inicio y fin (si el fin es antes que el inicio, acaba al día siguiente: 22:00–02:00).",
      "«+ Segundo tramo» para un turno partido.",
      "«Dónde» elige el punto de venta (si los has creado).",
      "Guardar. «Vaciar» deja la casilla en blanco."]],
    ["horas_extra", "⏱️", "Horas extra", [
      "En la ventana de la casilla, en «Horas extra», pon cuántas: de 0,5 a 16, con coma o punto, en medias horas.",
      "Si quieres, escribe el motivo.",
      "En el cuadrante, la casilla lleva una franja fucsia a la derecha con «+2 h extra»; también sale al imprimir.",
      "Vacío = sin horas extra."]],
    ["intercambiar", "⇄", "Intercambiar dos turnos", [
      "Abre una casilla y pulsa «⇄ Intercambiar con…».",
      "Toca la otra casilla: de otra persona, otro día o incluso otra semana.",
      "Se cambian los dos turnos, con sus horas extra y su sitio. Si la otra está vacía, el turno se mueve.",
      "«Deshacer» unos segundos; «Cancelar» o tocar la misma casilla lo anula."]],
    ["copiar_turno", "📋", "Copiar un turno a otras casillas", [
      "Abre una casilla con turno y pulsa «📋 Copiar a…».",
      "Toca las casillas libres donde lo quieras (de cualquier persona, día o semana).",
      "Cada una recibe el estado, el horario y el sitio, sin horas extra.",
      "Lo que ya tiene algo no se pisa.",
      "«Deshacer» quita la última copia; «Hecho» termina."]],
    ["copiar_semanas", "🗓️", "Copiar semanas", [
      "Gestión → «Copiar la semana anterior».",
      "Elige en cuántas semanas (de 1 a 8) y pulsa Copiar.",
      "La semana anterior a la que ves se repite en esta y en las siguientes.",
      "Solo en casillas vacías, sin horas extra y sin quien ya no trabaje aquí; el sitio sí se copia."]],
    ["personal", "👥", "Personal", [
      "Gestión → «Personal»: la lista. «+ Añadir persona».",
      "Toca a alguien para cambiar su nombre y su color (hay 20).",
      "El orden: arrastra el ⠿ o escribe el número del puesto.",
      "«Quitar»: sin turnos se borra; con turnos, «Dar de baja desde el…» (la semana que ves): deja de salir desde entonces y se conserva el histórico. «Volver a dar de alta» la recupera.",
      "La primera vez salen «Camarero 1» a «Camarero 4»: renómbralos tocando el nombre."]],
    ["estados", "🏷️", "Estados (Libre, Vacaciones, Baja…)", [
      "Gestión → «Estados»: los tipos de casilla.",
      "Vienen Trabajo, Libre, Vacaciones y Baja (baja médica). Puedes crear más, como «Asuntos propios».",
      "Cada estado tiene nombre, color y si «Cuenta como trabajo» (lleva horario y horas extra y usa el color de la persona; los demás usan su propio color).",
      "El primero es el que sale al abrir una casilla vacía.",
      "Uno que ya se usa no se puede quitar ni cambiar si cuenta como trabajo."]],
    ["puntos_de_venta", "📍", "Puntos de venta", [
      "Gestión → «Puntos de venta»: crea los sitios (Chiringuito, Cafetería, Pub…).",
      "Hasta que no haya uno, «Dónde» no sale en la casilla.",
      "Con puntos creados, cada tramo tiene su «Dónde» y el nombre sale pequeño debajo de la hora.",
      "Uno en uso no se puede quitar."]],
    ["imprimir", "🖨️", "Imprimir o guardar en PDF", [
      "Gestión → «Imprimir / PDF» abre la impresión del navegador con la semana que ves.",
      "Sale en una hoja A4 apaisada y siempre en colores claros.",
      "Para guardar un PDF, elige «Guardar como PDF» como destino.",
      "También se lee bien en blanco y negro (se pierde el color por persona)."]],
    ["copia_seguridad", "💾", "Copia de seguridad", [
      "Gestión → «Copia de seguridad».",
      "«Descargar copia» guarda un archivo con todo: guárdalo también fuera del móvil (Drive, correo, el PC).",
      "«Cargar una copia…» lo recupera, pide confirmación y descarga antes lo que había.",
      "Hay copias automáticas dentro del navegador: una por semana, las 5 últimas, con «Recuperar».",
      "Si pasan 7 días sin descargar copia, sale un aviso arriba.",
      "Los datos viven solo en el navegador de ese aparato: si se borran, se pierden."]],
    ["temas", "🎨", "Temas de color", [
      "Gestión → «Tema»: Claro, Lino, Oscuro y Carbón.",
      "Se recuerda en cada aparato.",
      "Al imprimir siempre sale en claro."]],
    ["local_y_persona", "🏢", "Nombre del local y de la persona", [
      "Arriba a la izquierda, el cuadrado con el lápiz cambia el nombre del local y la ciudad (las iniciales salen solas).",
      "Arriba a la derecha, el círculo con el lápiz cambia el nombre de quien usa la app."]],
    ["instalar", "📲", "Instalar la app y usarla sin conexión", [
      "Se puede instalar como una aplicación: en el navegador, menú → «Instalar aplicación» o «Añadir a la pantalla de inicio» (depende del navegador).",
      "Una vez instalada, abre sin conexión.",
      "Fervis es lo único que necesita internet."]],
    ["fervis", "🤖", "Qué puede hacer Fervis", [
      "Se abre con el robot de arriba.",
      "Dice quién trabaja ahora o cualquier día y qué turno tiene cada persona.",
      "Cuenta: turnos partidos o seguidos, fines de semana libres, vacaciones, bajas.",
      "Explica cómo se usa la app y charla de cosas generales (contratos, descansos…), siempre orientativo.",
      "Solo lee los turnos: no cambia nada.",
      "Necesita la clave gratuita de Groq: icono de tres barras → Ajustes (se crea en console.groq.com).",
      "La papelera borra la conversación. Con muchas preguntas seguidas, el plan gratuito puede pedir esperar un minuto."]],
  ];

  // Para el modelo (manual_app): el tema como texto seguido, o el índice si no hay tema o no existe
  function manual(topic) {
    const wanted = norm(topic).replace(/[^a-z_]/g, "_");
    const found = GUIDE.find(function (item) { return item[0] === wanted; });
    if (found) { return found[2] + ": " + found[3].join(" "); }
    return "Temas de la guía (pídelos uno a uno con manual_app y «tema»): " + GUIDE.map(function (item) { return item[0] + " (" + item[2] + ")"; }).join("; ") + ".";
  }

  // Cuando la pregunta es de «cómo se hace…», la APP busca en la guía los temas que tocan y se los pone delante al modelo (el modelo, solo,
  // contestó de memoria que «no se puede cambiar el color de una persona», y sí se puede). Se comparan las palabras de la pregunta con las
  // de cada tema (por sus 4 primeras letras: cambio/cambiar, copio/copiar, persona/personal) y salen los 2 que más coinciden.
  const HOW_TO = /\b(como|donde|se puede|puedo|puede|manual|guia|ayuda|funcion|opcion|para que sirve|que hace|que puedes)\b/;
  const STOP = ["para", "como", "donde", "puedo", "puede", "quiero", "tengo", "hacer", "esta", "este", "esto", "unas", "unos", "tiene", "tienen", "sobre", "desde", "hasta"];
  const stems = function (text) {
    return norm(text).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && !STOP.includes(w); }).map(function (w) { return w.slice(0, 4); });
  };
  function guideFor(asked) {
    if (!HOW_TO.test(norm(asked))) { return ""; }
    const words = stems(asked);
    const scored = GUIDE.map(function (item) {
      const own = stems(item[0].replace(/_/g, " ") + " " + item[2] + " " + item[3].join(" "));
      return { item: item, score: words.filter(function (w) { return own.includes(w); }).length };
    }).filter(function (x) { return x.score >= 2; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2);
    return scored.map(function (x) { return x.item[2] + ": " + x.item[3].join(" "); }).join("\n");
  }

  function system(model, asked) {
    const found = guideFor(asked);
    // Lo que va por delante: si la app ha encontrado en la guía lo que toca, el modelo explica SOLO con eso
    const help = found ? "\n\nGUÍA DE LA APP RELEVANTE PARA ESTA PREGUNTA (explica con esto; no digas que algo no se puede si no lo has visto aquí o en manual_app):\n" + found : "";
    return "Eres Fervis, el asistente personal de quien usa «David Planner», la app de turnos de este local de hostelería. " +
      "Contesta en castellano, breve y claro, en texto normal: sin markdown (ni asteriscos ni almohadillas); para listas, " +
      "una línea por punto empezando con «- ». Puedes charlar de cualquier tema general (por ejemplo, qué es un contrato " +
      "fijo o fijo discontinuo, descansos u horas extra): da información general y, para un caso concreto, recomienda mirar " +
      "el convenio o preguntar a la gestoría. Para CUALQUIER dato de los turnos llama a las herramientas, nunca lo " +
      "inventes ni lo cuentes tú a ojo: turnos_entre da los turnos concretos (qué turno tiene alguien, quién trabaja un " +
      "día; con «persona» solo los de esa persona), resumen_entre da lo ya contado por persona (días de turno partido o " +
      "seguido, libres, vacaciones, bajas, fines de semana completos sin trabajar y sábados o domingos sueltos) y " +
      "manual_app(tema) es la guía de la app: cómo se hace cada cosa y qué puede hacer cada parte (úsala para todo «cómo hago…» y «qué puedes hacer»; si dudas del tema, sin tema da el índice). Si piden la guía o el manual en general, no la recites: di en una línea que pulsen el botón 📖 de arriba (el glosario de la app, por temas) y, si preguntan algo concreto, explícalo con manual_app. Nunca digas que algo «no se puede hacer» en la app si no lo has comprobado en la guía (manual_app o la guía relevante): si no estás seguro, dilo y remite al glosario. Cuando expliques cómo se hace algo de la app, termina con una línea breve: «Tienes más detalle en el glosario (botón 📖 de arriba).» Solo en esas respuestas. Si la pregunta es de fines de semana, di SIEMPRE los fines de semana " +
      "completos (sábado y domingo) y los días sueltos por separado, sin mezclarlos en «días libres». Para «quién tiene " +
      "más…» usa las líneas RANKING ya calculadas y di siempre el motivo: vacaciones o baja NO es librar. «Sin nada puesto» " +
      "es un día sin planificar: no es libre, dilo aparte. «Esta semana», " +
      "«este mes»… usa las fechas de abajo. Reconoce a cada persona aunque la escriban en minúsculas, sin tildes o solo " +
      "con el nombre; si hay dos posibles, pregunta. «Trabajando ahora mismo» ya está calculado: úsalo tal cual. Solo " +
      "lees: si piden cambiar un turno, explica cómo hacerlo en la app (manual_app). Si hay un AVISO de que falta personal " +
      "o turnos, dilo y ofrece explicar paso a paso cómo crearlos. Si preguntan qué IA eres: Fervis es tu nombre y te " +
      "ejecuta el modelo " + model + " en Groq.\n\nDATOS DE LA APP:\n" + context(new Date()) + help;
  }

  // ---------- Groq, con la clave de David. Si un modelo está saturado o falla, se prueba el siguiente ----------
  const GROQ = "https://api.groq.com/openai/v1/chat/completions";
  const GROQ_MODELS = "https://api.groq.com/openai/v1/models";
  const MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant"];
  const DATE_PARAMS = { desde: { type: "string", description: "AAAA-MM-DD" }, hasta: { type: "string", description: "AAAA-MM-DD" },
    persona: { type: "string", description: "opcional: nombre (o parte) de una persona; si no, todo el personal" } };
  const TOOLS = [
    { type: "function", function: { name: "turnos_entre",
      description: "Turnos (horario, sitio, horas extra) día a día de todo el personal, o de una persona, entre dos fechas (hasta 31 días). Para saber QUÉ turno tiene alguien o QUIÉN trabaja un día.",
      parameters: { type: "object", required: ["desde", "hasta"], properties: DATE_PARAMS } } },
    { type: "function", function: { name: "resumen_entre",
      description: "Resumen YA CONTADO por persona entre dos fechas (hasta 93 días): cuántos días de turno partido, de turno seguido y de cada estado (libre, vacaciones, baja…), cuántos fines de semana completos (sábado y domingo) no trabaja y qué sábados o domingos sueltos. Para CONTAR o comparar: «quién ha librado los fines de semana», «cuántos días libra cada uno», «quién tiene turno partido».",
      parameters: { type: "object", required: ["desde", "hasta"], properties: DATE_PARAMS } } },
    { type: "function", function: { name: "manual_app",
      description: "La guía de la app, por temas: cómo se hace cada cosa y qué puede hacer cada parte (casillas, intercambiar, copiar, personal, estados, puntos de venta, imprimir, copia de seguridad, temas, instalar, Fervis…). Para «cómo hago…» y «qué puede hacer…». Sin «tema» devuelve el índice.",
      parameters: { type: "object", properties: { tema: { type: "string", enum: GUIDE.map(function (item) { return item[0]; }), description: "el tema de la guía; si no sabes cuál, no lo pongas y verás el índice" } } } } },
  ];
  const history = [];  // la conversación, para entender «¿y mañana?» (hasta recargar la página)
  let busy = false;

  function failure(text, tryNext, limit) {
    const error = new Error(text);
    error.tryNext = tryNext;
    error.limit = limit;
    return error;
  }

  async function post(key, body) {
    let response;
    try {
      response = await fetch(GROQ, { method: "POST", body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
        headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" } });
    } catch (error) { throw failure("No he podido conectar con Groq (¿sin internet?).", false); }
    if (response.status === 401) { throw failure("Groq no acepta tu clave: mira en «🔑 Clave» que esté entera.", false); }
    if (!response.ok) {
      let detail = "";
      try { if (typeof response.text === "function") { detail = (await response.text()).slice(0, 300); } } catch (error) { /* sin detalle */ }
      console.warn("Fervis: Groq " + response.status + " → " + detail);  // el motivo, para quien mire la consola (no sale al chat)
      throw failure("Groq ha fallado (código " + response.status + ").", true, response.status === 429);
    }
    return response.json();
  }

  async function converse(key, model, conversation) {
    const lastUser = conversation.slice().reverse().find(function (m) { return m.role === "user"; });
    const turn = [{ role: "system", content: system(model, lastUser ? lastUser.content : "") }].concat(conversation);
    for (let round = 0; round < 4; round++) {
      // Los modelos «gpt-oss» piensan antes de contestar y ese pensamiento cuenta dentro de max_tokens: con 700 se lo
      // gastaban todo en preguntas de repasar a todo el personal y salía una respuesta vacía. Esfuerzo bajo y más margen.
      const request = { model: model, temperature: 0.2, max_tokens: 1500, tools: TOOLS, tool_choice: "auto", messages: turn };
      if (model.startsWith("openai/gpt-oss")) { request.reasoning_effort = "low"; }
      const reply = await post(key, request);
      const message = reply && reply.choices && reply.choices[0] && reply.choices[0].message;
      if (!message) { throw failure("Groq ha contestado algo vacío.", true); }
      if (!message.tool_calls || !message.tool_calls.length) {
        const text = String(message.content || "").trim();
        // Una respuesta vacía no se enseña: se prueba con el siguiente modelo (nunca «(sin respuesta)»)
        if (!text) { throw failure("El modelo no ha escrito respuesta (se quedó pensando).", true); }
        return text;
      }
      turn.push({ role: "assistant", content: message.content || null, tool_calls: message.tool_calls });
      message.tool_calls.forEach(function (call) {
        let args = null;
        try { args = JSON.parse(call.function.arguments || "{}"); } catch (error) { args = null; }
        turn.push({ role: "tool", tool_call_id: call.id,
          content: runTool(call.function.name, args) });
      });
    }
    throw failure("Demasiadas consultas para una sola pregunta.", true);
  }

  // Los modelos de MODELS que de verdad tiene la cuenta de David, en orden (como en la cartera): si Groq retira uno, no se
  // pierde una petición en él cada vez ni se etiqueta como «respaldo» lo que es el primero disponible.
  let ladder = null;
  async function accountModels(key) {
    if (ladder) { return ladder; }
    let ids = [];
    try {
      const response = await fetch(GROQ_MODELS, { headers: { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(15000) });
      if (response.status === 401) { throw failure("Groq no acepta tu clave: mira en «🔑 Clave» que esté entera.", false); }
      if (response.ok) { ids = ((await response.json()).data || []).map(function (m) { return m.id; }); }
    } catch (error) { if (error.tryNext === false) { throw error; } }  // sin red o sin lista: se prueban todos
    const mine = MODELS.filter(function (id) { return ids.includes(id); });
    if (ids.length && !mine.length) { throw failure("Tu cuenta de Groq no tiene ninguno de los modelos que uso.", false); }
    if (mine.length) { ladder = mine; }
    return mine.length ? mine : MODELS;
  }

  async function answer(key, conversation) {
    let limited = false;
    const models = await accountModels(key);
    for (const model of models) {
      try { return { text: await converse(key, model, conversation), model: model, backup: model !== models[0] }; } catch (error) {
        console.warn("Fervis: " + model + " no ha contestado → " + error.message);  // para saber por qué se pasó al siguiente
        if (!error.tryNext) { throw error; }
        limited = limited || error.limit;
      }
    }
    throw failure(limited ? "Los modelos gratuitos de Groq están al límite ahora mismo. Prueba otra vez en un minuto."
      : "Ningún modelo de Groq ha podido contestar. Prueba a preguntarlo de otra forma.", false);
  }

  function showKeyForm(show) {
    const key = readKey();
    keyForm.hidden = !show;
    keyToggle.setAttribute("aria-expanded", String(show));
    // Lo de la clave vive aquí, en el panel (como los Ajustes de la cartera), no en la conversación
    keyState.textContent = key ? "Clave guardada: " + mask(key) : "Sin clave todavía: Fervis la necesita para contestarte.";
    keyRemove.hidden = !key;
    if (show) { keyInput.focus(); }
  }

  keyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const key = cleanKey(keyInput.value);
    if (!key) { keyState.textContent = "Pega primero la clave en el campo."; return; }
    if (!looksValid(key)) {
      keyState.textContent = "Eso no parece una clave: tiene espacios o no mide entre 20 y 300 letras. No se ha guardado.";
      return;
    }
    if (!writeKey(key)) { keyState.textContent = "No se ha podido guardar: el navegador no lo deja (¿modo privado?)."; return; }
    keyInput.value = "";  // la clave no se queda escrita en la página
    ladder = null;        // con otra clave, otra cuenta: los modelos se vuelven a preguntar
    showKeyForm(false);
    say("fervis", "Clave guardada (" + mask(key) + ")." +
      (key.startsWith("gsk_") ? "" : " Ojo: las de Groq empiezan por gsk_; si no funciona, mira que esté entera."));
    question.focus();
  });

  keyRemove.addEventListener("click", function () {
    writeKey("");
    ladder = null;
    showKeyForm(true);
    say("fervis", "Clave quitada de este navegador.");
  });

  keyToggle.addEventListener("click", function () { showKeyForm(keyForm.hidden); });

  // Las filas de chips (botones redondos con emoji) que salen en la conversación: preguntas de ejemplo y temas de la guía. Solo hay una
  // fila a la vez: al mandar una pregunta o elegir algo, la anterior se quita.
  function clearChips() { messages.querySelectorAll(".fervis-chips").forEach(function (row) { row.remove(); }); }

  function chipRow(items) {  // items: [emoji, texto, qué hacer al tocarlo]
    clearChips();
    const row = messages.appendChild(document.createElement("li"));
    row.className = "fervis-chips";
    items.forEach(function (item) {
      const chip = row.appendChild(document.createElement("button"));
      chip.type = "button";
      chip.className = "fervis-chip";  // sin «secondary»: su estilo (fondo transparente) pisaría el del chip
      chip.dataset.icon = item[0];     // el emoji va aparte, con CSS: no forma parte del texto ni de lo que se manda
      chip.textContent = item[1];
      chip.addEventListener("click", item[2]);
    });
    messages.scrollTop = messages.scrollHeight;
  }

  // La guía como GLOSARIO (Nando: «que el botón, en vez de modo bot, se convierta en glosario: vas pulsando y va desplegando»): una
  // vista aparte dentro de la ventana, con grupos y temas que se despliegan. No es el chat: no añade burbujas, no llama a Groq y no
  // necesita clave. El botón 📖 (y el chip «Guía de la app» del saludo) alterna entre el chat y el glosario.
  const GUIDE_GROUPS = [
    ["turnos", "📅", "Turnos y casillas", ["empezar", "casilla", "horas_extra", "intercambiar", "copiar_turno"]],
    ["gestion", "🛠️", "Menú Gestión", ["copiar_semanas", "personal", "estados", "puntos_de_venta", "imprimir", "copia_seguridad", "temas"]],
    ["app", "🏢", "Mi local, la app y Fervis", ["local_y_persona", "instalar", "fervis"]],
  ];
  const guideView = document.getElementById("fervis-guide-view");
  const guideButton = document.getElementById("fervis-guide");

  // Cada fila es una tarjeta como las de health-tracker (Nando: «me mola más cómo has puesto los botones»): círculo con el emoji a la izquierda,
  // el título con su subtítulo («5 pasos», «3 temas») y el triangulito de desplegable a la derecha (lo pone el CSS).
  function guideSummary(icon, title, subtitle) {
    const summary = document.createElement("summary");
    summary.appendChild(document.createElement("span")).className = "fervis-guide-badge";
    summary.lastChild.textContent = icon;
    const text = summary.appendChild(document.createElement("span"));
    text.className = "fervis-guide-text";
    text.appendChild(document.createElement("strong")).className = "fervis-guide-title";
    text.lastChild.textContent = title;
    text.appendChild(document.createElement("small")).className = "fervis-guide-sub";
    text.lastChild.textContent = subtitle;
    return summary;
  }

  function buildGuide() {
    guideView.replaceChildren();
    GUIDE_GROUPS.forEach(function (group) {
      const groupBox = guideView.appendChild(document.createElement("details"));
      groupBox.className = "fervis-guide-group";
      groupBox.appendChild(guideSummary(group[1], group[2], group[3].length + (group[3].length === 1 ? " tema" : " temas")));
      group[3].forEach(function (topicId) {
        const item = GUIDE.find(function (it) { return it[0] === topicId; });
        const topic = groupBox.appendChild(document.createElement("details"));
        topic.className = "fervis-guide-topic";
        topic.appendChild(guideSummary(item[1], item[2], item[3].length + (item[3].length === 1 ? " paso" : " pasos")));
        const steps = topic.appendChild(document.createElement("ul"));
        item[3].forEach(function (step) { steps.appendChild(document.createElement("li")).textContent = step; });
      });
    });
  }

  // Acordeón (Nando: «si se despliega una que se pliegue otra, para que no ocupe toda la pantalla»): al abrir un grupo se cierran los
  // otros grupos, y al abrir un tema se cierran los demás temas de ese grupo. «toggle» no sube por el árbol: se escucha en captura.
  guideView.addEventListener("toggle", function (event) {
    const opened = event.target;
    if (!opened.open || opened.tagName !== "DETAILS") { return; }
    Array.from(opened.parentElement.children).forEach(function (sibling) {
      if (sibling !== opened && sibling.tagName === "DETAILS" && sibling.open) { sibling.open = false; }
    });
  }, true);

  function showGuide(show) {  // el glosario o el chat: uno u otro
    if (show && !guideView.children.length) { buildGuide(); }
    guideView.hidden = !show;
    messages.hidden = show;
    chat.hidden = show;
    if (show) { keyForm.hidden = true; guideView.scrollTop = 0; }
    guideButton.setAttribute("aria-expanded", String(show));
  }

  const QUESTIONS = [["🕒", "¿Quién trabaja hoy?"], ["🌴", "¿Quién libra este fin de semana?"],
    ["✂️", "¿Quién tiene turno partido y quién seguido esta semana?"], ["📋", "¿Cómo copio un turno?"]];

  function greet() {
    say("fervis", "Hola, soy Fervis, tu asistente personal. ¿En qué te puedo ayudar? Si tienes dudas, pulsa el botón «📖 Guía» de arriba.");
    chipRow(QUESTIONS.map(function (pair) {
      return [pair[0], pair[1], function () { question.value = pair[1]; chat.requestSubmit(); }];  // sin clave, abre Ajustes y deja la pregunta escrita
    }).concat([["📖", "Guía de la app", function () { showGuide(true); }]]));
    messages.scrollTop = 0;  // el saludo se lee desde su primera línea (los chips lo bajarían al final)
  }

  // La papelera: conversación nueva (Fervis olvida lo hablado; la clave no se toca). Con una respuesta a medias no, o
  // la respuesta llegaría a una conversación que ya no existe
  guideButton.addEventListener("click", function () { showGuide(guideView.hidden); });

  document.getElementById("fervis-clear").addEventListener("click", function () {
    if (busy) { return; }
    history.length = 0;
    showGuide(false);
    messages.replaceChildren();
    greet();
    if (readKey()) { question.focus(); }
  });

  chat.addEventListener("submit", async function (event) {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || busy) { return; }
    const key = readKey();
    if (!key) {  // sin clave no hay conversación: se abre el panel y la pregunta se queda escrita para cuando la pegue
      showKeyForm(true);
      return;
    }
    question.value = "";
    clearChips();
    say("david", text);
    busy = true;
    const reply = say("fervis", "Pensando…");
    history.push({ role: "user", content: text });
    try {
      const result = await answer(key, history.slice(-9));  // las últimas preguntas y respuestas, empezando por una pregunta
      reply.textContent = result.text;
      // Debajo, quién ha contestado (como en la cartera); «respaldo» si el primero estaba saturado
      const label = reply.appendChild(document.createElement("small"));
      label.className = "fervis-model" + (result.backup ? " backup" : "");
      label.textContent = "groq · " + result.model + (result.backup ? " (respaldo)" : "");
      history.push({ role: "assistant", content: result.text });
    } catch (error) {
      reply.textContent = error.message;
      history.pop();  // la pregunta sin respuesta no se queda en la conversación
    }
    messages.scrollTop = messages.scrollHeight;
    busy = false;
  });

  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });
  // Al tocar el robot hace un movimiento (los de Crypto_Portafolio) y al acabar se abre el chat. Uno al azar, nunca el
  // mismo dos veces seguidas; las duraciones (ms) van a juego con css/app.css. Con «reducir movimiento», al instante.
  const MOVES = [["pulso", 450], ["hunde", 300], ["gesto", 650], ["bote", 800], ["giro", 700], ["asoma", 800], ["balon", 1000]];
  const robot = document.getElementById("fervis-button");
  let lastMove = null;
  let moving = false;
  robot.addEventListener("click", function () {
    if (moving) { return; }  // un segundo toque durante el movimiento no abre otra vez
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { open(); return; }
    const options = MOVES.filter(function (move) { return move[0] !== lastMove; });
    const move = options[Math.floor(Math.random() * options.length)];
    lastMove = move[0];
    moving = true;
    robot.classList.add("move-" + move[0]);
    setTimeout(function () { robot.classList.remove("move-" + move[0]); moving = false; open(); }, move[1]);
  });

  // La conversación se queda al cerrar y volver a abrir (hasta recargar la página)
  function open() {
    dialog.showModal();
    showGuide(false);  // siempre se abre en el chat
    const key = readKey();
    if (!messages.children.length) { greet(); }
    showKeyForm(!key);
    // En el móvil, el cursor en la casilla saca el teclado y tapa el saludo: ahí se escribe al tocarla (como en la cartera)
    if (key && window.matchMedia("(pointer: fine)").matches) { question.focus(); }
  }

  return { open: open, context: context, tool: runTool, guideFor: guideFor };  // context: para las pruebas (con una hora fija)
})();
