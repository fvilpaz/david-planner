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
    return pick(inOrder(data.employees), name).map(function (e) {
      const counts = {};
      const order = [];
      const single = [];   // sábados o domingos sueltos sin trabajar
      const full = [];     // fines de semana completos (sábado y domingo) sin trabajar
      for (let i = 0; i < days; i++) {
        const date = Dates.addDays(from, i);
        if (e.leftFrom && e.leftFrom <= Dates.toIso(date)) { continue; }
        const day = dayLabel(data, e, date);
        if (!counts[day.label]) { counts[day.label] = 0; order.push(day.label); }
        counts[day.label]++;
        const weekday = date.getDay();
        if (weekday === 6 && i + 1 < days) {  // sábado con su domingo dentro del período
          const sunday = Dates.addDays(date, 1);
          const second = dayLabel(data, e, sunday);
          if (isOff(day) && isOff(second) && !(e.leftFrom && e.leftFrom <= Dates.toIso(sunday))) {
            // con el motivo (libre, vacaciones, baja…): no es lo mismo librar que estar de vacaciones
            const why = day.label === second.label ? day.label : day.label + " y " + second.label;
            full.push(DAY_NUMBER.format(date) + "–" + DAY_NUMBER.format(sunday) + " " + MONTH_SHORT.format(sunday).replace(".", "") + " (" + why + ")");
          }
        }
        if ((weekday === 6 || weekday === 0) && isOff(day)) { single.push(SHORT_DATE.format(date).replace(/\./g, "") + " (" + day.label + ")"); }
      }
      order.sort(function (a, b) {  // primero los de trabajo
        const rank = function (l) { return l === "turno partido" ? 0 : l === "turno seguido" ? 1 : 2; };
        return rank(a) - rank(b);
      });
      return "- " + e.name + ": " + (order.map(function (l) { return l + " " + counts[l] + (counts[l] === 1 ? " día" : " días"); }).join("; ") || "nada") +
        " | fines de semana completos sin trabajar (sábado y domingo): " + full.length + (full.length ? " (" + full.join(", ") + ")" : "") +
        " | sábados o domingos sin trabajar, sueltos o no: " + (single.join(", ") || "ninguno");
    }).join("\n");
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
    if (name === "manual_app") { return MANUAL; }
    if (name !== "turnos_entre" && name !== "resumen_entre") { return "No existe esa herramienta."; }
    const asked = range(args, name === "resumen_entre" ? MAX_SUMMARY_DAYS : MAX_DAYS);
    if (asked.error) { return asked.error; }
    const who = args && args.persona ? String(args.persona) : "";
    if (who && !pick(inOrder(data.employees), who).length) { return "No encuentro a nadie que se llame «" + who + "» en el personal."; }
    return name === "turnos_entre" ? rangeLines(data, asked.from, asked.days, who) : summaryLines(data, asked.from, asked.days, who);
  }

  const MANUAL = [
    "Cómo se usa la app (para explicarlo si preguntan):",
    "- Cuadrante semanal, de lunes a domingo: ‹ y › cambian de semana, tocar el título abre el calendario, «Hoy» vuelve a esta semana.",
    "- Tocar una casilla abre su ventana: estado (Trabajo, Libre, Vacaciones…), horario (si el fin es antes que el inicio, acaba al día siguiente), «+ Segundo tramo» para el turno partido, «Dónde» (punto de venta) y horas extra con su motivo. «Guardar»; «Vaciar» la deja vacía.",
    "- «⇄ Intercambiar con…» (en la ventana de una casilla) y tocar otra casilla: se cambian, también entre personas o semanas; «Deshacer» unos segundos.",
    "- Tocar el nombre de una persona en el cuadrante abre su ficha.",
    "- Menú «Gestión»: Imprimir / PDF; Copiar la semana anterior (en 1 a 8 semanas, solo en casillas vacías); Personal (añadir, nombre, color y orden arrastrando ⠿ o con el número; «Quitar»: sin turnos se borra, con turnos deja de salir desde la semana que se ve); Estados; Puntos de venta; Copia de seguridad (descargar y cargar el archivo; copias automáticas semanales); Tema.",
    "- El lápiz de arriba a la izquierda cambia el nombre del local y la ciudad; el círculo de la derecha, el nombre de quien la usa.",
    "- Los datos viven solo en este navegador: conviene descargar la copia de seguridad a menudo y guardarla fuera del móvil.",
  ].join("\n");

  function system(model) {
    return "Eres Fervis, el asistente personal de quien usa «David Planner», la app de turnos de este local de hostelería. " +
      "Contesta en castellano, breve y claro, en texto normal: sin markdown (ni asteriscos ni almohadillas); para listas, " +
      "una línea por punto empezando con «- ». Puedes charlar de cualquier tema general (por ejemplo, qué es un contrato " +
      "fijo o fijo discontinuo, descansos u horas extra): da información general y, para un caso concreto, recomienda mirar " +
      "el convenio o preguntar a la gestoría. Para CUALQUIER dato de los turnos llama a las herramientas, nunca lo " +
      "inventes ni lo cuentes tú a ojo: turnos_entre da los turnos concretos (qué turno tiene alguien, quién trabaja un " +
      "día; con «persona» solo los de esa persona), resumen_entre da lo ya contado por persona (días de turno partido o " +
      "seguido, libres, vacaciones, bajas, fines de semana completos sin trabajar y sábados o domingos sueltos) y " +
      "manual_app explica cómo se usa la app. Si la pregunta es de fines de semana, di SIEMPRE los fines de semana " +
      "completos (sábado y domingo) y los días sueltos por separado, sin mezclarlos en «días libres». «Sin nada puesto» " +
      "es un día sin planificar: no es libre, dilo aparte. «Esta semana», " +
      "«este mes»… usa las fechas de abajo. Reconoce a cada persona aunque la escriban en minúsculas, sin tildes o solo " +
      "con el nombre; si hay dos posibles, pregunta. «Trabajando ahora mismo» ya está calculado: úsalo tal cual. Solo " +
      "lees: si piden cambiar un turno, explica cómo hacerlo en la app (manual_app). Si hay un AVISO de que falta personal " +
      "o turnos, dilo y ofrece explicar paso a paso cómo crearlos. Si preguntan qué IA eres: Fervis es tu nombre y te " +
      "ejecuta el modelo " + model + " en Groq.\n\nDATOS DE LA APP:\n" + context(new Date());
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
      description: "Cómo se usa la app (casillas, intercambiar, copiar, personal, estados, copias de seguridad…). Para preguntas de «cómo hago…».",
      parameters: { type: "object", properties: {} } } },
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
    const turn = [{ role: "system", content: system(model) }].concat(conversation);
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

  function greet() { say("fervis", "Hola, soy Fervis, tu asistente personal. ¿En qué te puedo ayudar?"); }

  // La papelera: conversación nueva (Fervis olvida lo hablado; la clave no se toca). Con una respuesta a medias no, o
  // la respuesta llegaría a una conversación que ya no existe
  document.getElementById("fervis-clear").addEventListener("click", function () {
    if (busy) { return; }
    history.length = 0;
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
    const key = readKey();
    if (!messages.children.length) { greet(); }
    showKeyForm(!key);
    // En el móvil, el cursor en la casilla saca el teclado y tapa el saludo: ahí se escribe al tocarla (como en la cartera)
    if (key && window.matchMedia("(pointer: fine)").matches) { question.focus(); }
  }

  return { open: open, context: context, tool: runTool };  // context: para las pruebas (con una hora fija)
})();
