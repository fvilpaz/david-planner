// Fervis (paso 12, idea de Nando): el asistente de los turnos. Paso 12a: la ventana y la clave de Groq de David.
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
  const NO_KEY = "Para contestarte necesito tu clave gratuita de Groq: pégala en «🔑 Clave».";

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
  }

  function showKeyForm(show) {
    const key = readKey();
    keyForm.hidden = !show;
    keyToggle.setAttribute("aria-expanded", String(show));
    keyState.textContent = key ? "Clave guardada: " + mask(key) : "Sin clave todavía.";
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
    showKeyForm(false);
    say("fervis", "Clave guardada (" + mask(key) + ")." +
      (key.startsWith("gsk_") ? "" : " Ojo: las de Groq empiezan por gsk_; si no funciona, mira que esté entera."));
    question.focus();
  });

  keyRemove.addEventListener("click", function () {
    writeKey("");
    showKeyForm(true);
    say("fervis", "Clave quitada de este navegador.");
  });

  keyToggle.addEventListener("click", function () { showKeyForm(keyForm.hidden); });

  chat.addEventListener("submit", function (event) {
    event.preventDefault();
    const text = question.value.trim();
    if (!text) { return; }
    question.value = "";
    say("david", text);
    if (!readKey()) {
      say("fervis", NO_KEY);
      showKeyForm(true);
      return;
    }
    say("fervis", "Ya tengo tu clave. Las respuestas llegan en el paso siguiente (12b).");  // lo sustituye el 12b
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
    if (!messages.children.length) {
      say("fervis", "Hola, soy Fervis, el asistente de los turnos. " + (key ? "¿Qué quieres saber?" : NO_KEY));
    }
    showKeyForm(!key);
    // En el móvil, el cursor en la casilla saca el teclado y tapa el saludo: ahí se escribe al tocarla (como en la cartera)
    if (key && window.matchMedia("(pointer: fine)").matches) { question.focus(); }
  }

  return { open: open };
})();
