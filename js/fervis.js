// Fervis (paso 12, idea de Nando): el asistente de la app. Este archivo es el CHAT: la ventana, la clave de Groq de David, la
// conversación con Groq (con cambio de modelo si uno falla), los chips, la papelera y el robot de la barra. Lo que calcula la app
// para el modelo está en fervis-datos.js y la guía en fervis-guia.js (se cargan antes; partido en la auditoría del 10-nov). Solo lee.
// La clave es de David (cuenta gratuita en console.groq.com) y vive SOLO en este navegador, en «dp_groq_key»: no está
// en el código (el repositorio es público) ni en la copia de seguridad (backup.js copia una lista fija de claves,
// SETTINGS, y esta no está). La limpieza al pegar es la de Crypto_Portafolio/js/fervis.js. Todo con textContent.
window.Fervis = (function () {
  "use strict";
  const KEY = "dp_groq_key";
  const t = window.I18n.t;   // los textos siguen al idioma elegido (js/i18n.js)
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

  function system(model, asked) {
    const found = window.FervisGuide.guideFor(asked);
    // Lo que va por delante: si la app ha encontrado en la guía lo que toca, el modelo explica SOLO con eso
    const help = found ? "\n\nGUÍA DE LA APP RELEVANTE PARA ESTA PREGUNTA (explica con esto; no digas que algo no se puede si no lo has visto aquí o en manual_app):\n" + found : "";
    return "Eres Fervis, el asistente personal de quien usa «David Planner», la app de turnos de este local de hostelería. " +
      "Contesta en " + t("fervis.replyLanguage") + ", breve y claro, en texto normal: sin markdown (ni asteriscos ni almohadillas); para listas, " +
      "una línea por punto empezando con «- ». Puedes charlar de cualquier tema general (por ejemplo, qué es un contrato " +
      "fijo o fijo discontinuo, descansos u horas extra): da información general y, para un caso concreto, recomienda mirar " +
      "el convenio o preguntar a la gestoría. Para CUALQUIER dato de los turnos llama a las herramientas, nunca lo " +
      "inventes ni lo cuentes tú a ojo: turnos_entre da los turnos concretos (qué turno tiene alguien, quién trabaja un " +
      "día; con «persona» solo los de esa persona), resumen_entre da lo ya contado por persona (días de turno partido o " +
      "seguido, libres, vacaciones, bajas, fines de semana completos sin trabajar y sábados o domingos sueltos), " +
      "clientes_entre da los clientes previstos de cada día, los camareros que trabajan (con sitios) y los clientes por camarero, ya calculados, y " +
      "manual_app(tema) es la guía de la app: cómo se hace cada cosa y qué puede hacer cada parte (úsala para todo «cómo hago…» y «qué puedes hacer»; si dudas del tema, sin tema da el índice). Si piden la guía o el manual en general, no la recites: di en una línea que pulsen el botón 📖 de arriba (el glosario de la app, por temas) y, si preguntan algo concreto, explícalo con manual_app. Nunca digas que algo «no se puede hacer» en la app si no lo has comprobado en la guía (manual_app o la guía relevante): si no estás seguro, dilo y remite al glosario. Cuando expliques cómo se hace algo de la app, termina con una línea breve: «Tienes más detalle en el glosario (botón 📖 de arriba).» Solo en esas respuestas. Si la pregunta es de fines de semana, di SIEMPRE los fines de semana " +
      "completos (sábado y domingo) y los días sueltos por separado, sin mezclarlos en «días libres». Para «quién tiene " +
      "más…» usa las líneas RANKING ya calculadas y di siempre el motivo: vacaciones o baja NO es librar. «Sin nada puesto» " +
      "es un día sin planificar: no es libre, dilo aparte. «Esta semana», " +
      "«este mes»… usa las fechas de abajo. Reconoce a cada persona aunque la escriban en minúsculas, sin tildes o solo " +
      "con el nombre; si hay dos posibles, pregunta. «Trabajando ahora mismo» ya está calculado: úsalo tal cual. Solo " +
      "lees: si piden cambiar un turno, explica cómo hacerlo en la app (manual_app). Si hay un AVISO de que falta personal " +
      "o turnos, dilo y ofrece explicar paso a paso cómo crearlos. Si preguntan qué IA eres: Fervis es tu nombre y te " +
      "ejecuta el modelo " + model + " en Groq.\n\nDATOS DE LA APP:\n" + window.FervisData.context(new Date()) + help;
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
    { type: "function", function: { name: "clientes_entre",
      description: "Clientes previstos de cada día entre dos fechas (hasta 31 días), cuántos camareros trabajan (total y por punto de venta) y los clientes por camarero (clientes entre camareros). Para «¿cuántos clientes hay previstos?», «¿cuántos camareros hay el sábado?» o «¿a cuántos clientes por camarero salimos cada día?».",
      parameters: { type: "object", required: ["desde", "hasta"], properties: { desde: DATE_PARAMS.desde, hasta: DATE_PARAMS.hasta } } } },
    { type: "function", function: { name: "manual_app",
      description: "La guía de la app, por temas: cómo se hace cada cosa y qué puede hacer cada parte (casillas, intercambiar, copiar, personal, estados, puntos de venta, imprimir, copia de seguridad, temas, instalar, Fervis…). Para «cómo hago…» y «qué puede hacer…». Sin «tema» devuelve el índice.",
      parameters: { type: "object", properties: { tema: { type: "string", enum: window.FervisGuide.GUIDE.map(function (item) { return item[0]; }), description: "el tema de la guía; si no sabes cuál, no lo pongas y verás el índice" } } } } },
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
    } catch (error) { throw failure(t("fervis.errConnect"), false); }
    if (response.status === 401) { throw failure(t("fervis.errKey"), false); }
    if (!response.ok) {
      let detail = "";
      try { if (typeof response.text === "function") { detail = (await response.text()).slice(0, 300); } } catch (error) { /* sin detalle */ }
      console.warn("Fervis: Groq " + response.status + " → " + detail);  // el motivo, para quien mire la consola (no sale al chat)
      throw failure(t("fervis.errCode", { code: response.status }), true, response.status === 429);
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
      if (!message) { throw failure(t("fervis.errEmpty"), true); }
      if (!message.tool_calls || !message.tool_calls.length) {
        const text = String(message.content || "").trim();
        // Una respuesta vacía no se enseña: se prueba con el siguiente modelo (nunca «(sin respuesta)»)
        if (!text) { throw failure(t("fervis.errNoText"), true); }
        return text;
      }
      turn.push({ role: "assistant", content: message.content || null, tool_calls: message.tool_calls });
      message.tool_calls.forEach(function (call) {
        let args = null;
        try { args = JSON.parse(call.function.arguments || "{}"); } catch (error) { args = null; }
        turn.push({ role: "tool", tool_call_id: call.id,
          content: window.FervisData.runTool(call.function.name, args) });
      });
    }
    throw failure(t("fervis.errTooMany"), true);
  }

  // Los modelos de MODELS que de verdad tiene la cuenta de David, en orden (como en la cartera): si Groq retira uno, no se
  // pierde una petición en él cada vez ni se etiqueta como «respaldo» lo que es el primero disponible.
  let ladder = null;
  async function accountModels(key) {
    if (ladder) { return ladder; }
    let ids = [];
    try {
      const response = await fetch(GROQ_MODELS, { headers: { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(15000) });
      if (response.status === 401) { throw failure(t("fervis.errKey"), false); }
      if (response.ok) { ids = ((await response.json()).data || []).map(function (m) { return m.id; }); }
    } catch (error) { if (error.tryNext === false) { throw error; } }  // sin red o sin lista: se prueban todos
    const mine = MODELS.filter(function (id) { return ids.includes(id); });
    if (ids.length && !mine.length) { throw failure(t("fervis.errNoModels"), false); }
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
    throw failure(t(limited ? "fervis.errLimit" : "fervis.errNone"), false);
  }

  function showKeyForm(show) {
    const key = readKey();
    keyForm.hidden = !show;
    keyToggle.setAttribute("aria-expanded", String(show));
    // Lo de la clave vive aquí, en el panel (como los Ajustes de la cartera), no en la conversación
    keyState.textContent = key ? t("fervis.keySaved", { mask: mask(key) }) : t("fervis.keyNone");
    keyRemove.hidden = !key;
    if (show) { keyInput.focus(); }
  }

  keyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const key = cleanKey(keyInput.value);
    if (!key) { keyState.textContent = t("fervis.keyPaste"); return; }
    if (!looksValid(key)) {
      keyState.textContent = t("fervis.keyInvalid");
      return;
    }
    if (!writeKey(key)) { keyState.textContent = t("fervis.keyNoSave"); return; }
    keyInput.value = "";  // la clave no se queda escrita en la página
    ladder = null;        // con otra clave, otra cuenta: los modelos se vuelven a preguntar
    showKeyForm(false);
    say("fervis", t("fervis.keySavedMsg", { mask: mask(key) }) + (key.startsWith("gsk_") ? "" : t("fervis.keyOdd")));
    question.focus();
  });

  keyRemove.addEventListener("click", function () {
    writeKey("");
    ladder = null;
    showKeyForm(true);
    say("fervis", t("fervis.keyRemoved"));
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

  // Cada pregunta de ejemplo con lo que contesta en la demo sin clave (lo calcula la app: ver demoAnswer). Una sola lista: cambiar
  // una pregunta no puede dejarla sin respuesta. La larga va la última: si no, en pantallas estrechas rompe la fila de chips.
  const demoReply = function (kind) { return function () { return window.FervisData.demoReply(kind, new Date()); }; };
  // Es una función (y no una lista fija) para que las preguntas salgan en el idioma de ese momento
  function questions() {
    return [["🕒", t("fervis.qToday"), demoReply("hoy")], ["👥", t("fervis.qClients"), demoReply("clientes")],
      ["📋", t("fervis.qCopy"), function () { return window.FervisGuide.manual("copiar_turno"); }],
      ["✂️", t("fervis.qSplit"), demoReply("partidoSeguido")]];
  }

  function exampleChips() {
    chipRow(questions().map(function (pair) {
      return [pair[0], pair[1], function () { question.value = pair[1]; chat.requestSubmit(); }];  // sin clave, abre Ajustes y deja la pregunta escrita
    }).concat([["📖", t("fervis.guideChip"), function () { window.FervisGuide.showGuide(true); }]]));
  }

  function greet() {
    say("fervis", t("fervis.greet") + (window.Store.DEMO && !readKey() ? t("fervis.greetDemo") : ""));
    exampleChips();
    messages.scrollTop = 0;  // el saludo se lee desde su primera línea (los chips lo bajarían al final)
  }

  // La demo (?demo) sin clave: cada chip se contesta con lo que calcula la app (las mismas herramientas que usa la IA, así que no gasta
  // nada de Groq). Cualquier otra pregunta recibe un aviso. Fuera de la demo, sin clave sigue abriéndose Ajustes.
  function demoAnswer(text) {
    const asked = questions().find(function (q) { return q[1] === text; });
    return (asked && asked[2]()) || t("fervis.demoOnly");
  }

  // La papelera: conversación nueva (Fervis olvida lo hablado; la clave no se toca). Con una respuesta a medias no, o
  // la respuesta llegaría a una conversación que ya no existe
  document.getElementById("fervis-clear").addEventListener("click", function () {
    if (busy) { return; }
    history.length = 0;
    window.FervisGuide.showGuide(false);
    messages.replaceChildren();
    greet();
    if (readKey()) { question.focus(); }
  });

  chat.addEventListener("submit", async function (event) {
    event.preventDefault();
    const text = question.value.trim();
    if (!text || busy) { return; }
    const key = readKey();
    if (!key && window.Store.DEMO) {  // demo sin clave: respuestas fijas de los botones (ver demoAnswer)
      question.value = "";
      say("david", text);
      say("fervis", demoAnswer(text));
      exampleChips();
      return;
    }
    if (!key) {  // sin clave no hay conversación: se abre el panel y la pregunta se queda escrita para cuando la pegue
      showKeyForm(true);
      return;
    }
    question.value = "";
    clearChips();
    say("david", text);
    busy = true;
    const reply = say("fervis", t("fervis.thinking"));
    history.push({ role: "user", content: text });
    try {
      const result = await answer(key, history.slice(-9));  // las últimas preguntas y respuestas, empezando por una pregunta
      reply.textContent = result.text;
      // Debajo, quién ha contestado (como en la cartera); «respaldo» si el primero estaba saturado
      const label = reply.appendChild(document.createElement("small"));
      label.className = "fervis-model" + (result.backup ? " backup" : "");
      label.textContent = "groq · " + result.model + (result.backup ? " " + t("fervis.backup") : "");
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
    window.FervisGuide.showGuide(false);  // siempre se abre en el chat
    const key = readKey();
    if (!messages.children.length) { greet(); }
    showKeyForm(!key && !window.Store.DEMO);   // en la demo no se pide la clave de entrada: los botones ya contestan (el icono de ajustes sigue ahí)
    // En el móvil, el cursor en la casilla saca el teclado y tapa el saludo: ahí se escribe al tocarla (como en la cartera)
    if (key && window.matchMedia("(pointer: fine)").matches) { question.focus(); }
  }

  // Al cambiar de idioma, los chips de ejemplo (si están a la vista) se vuelven a escribir; lo ya hablado se queda como está
  document.addEventListener("i18n-change", function () { if (messages.querySelector(".fervis-chips")) { exampleChips(); } });

  // Lo que usan las pruebas (context con una hora fija, las herramientas y la guía relevante)
  return { open: open, context: window.FervisData.context, tool: window.FervisData.runTool, guideFor: window.FervisGuide.guideFor };
})();
