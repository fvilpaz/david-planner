// Saludo de Fervis al abrir la app (Nando, 12-nov): el robot SALTA de la barra al hueco entre «Cuadrante semanal» y «Gestión»,
// rebota y, al aterrizar, sale un bocadillo que llama la atención sin decir quién es (eso lo cuenta el chat al abrirlo). Al
// cerrarse el bocadillo, el robot vuelve de un salto a la barra. Si no hay sitio para saltar (la fila ya no está bajo la barra,
// o «reducir movimiento»), el de antes: se menea y el bocadillo sale bajo su sitio. Como el de la cartera (Crypto_Portafolio,
// commit 09f076e), pero en el color del tema. No usa Groq ni clave. Se va a los 9 s o al tocar en cualquier sitio; tocar el
// bocadillo abre el chat (como tocar el robot). En la 4.ª apertura avisa de que se puede desactivar, en Ajustes.
(function () {
  "use strict";
  const KEY_OFF = "dp_fervis_saludo";        // «off» = no saludar al abrir
  const KEY_COUNT = "dp_fervis_aperturas";   // cuántas veces se ha abierto la app en este aparato
  const KEY_VISIT = "dp_fervis_visita";      // marca de «ya he saludado en esta visita» (sessionStorage)
  const HINT_AT = 4;                         // en qué apertura sale el aviso de «puedes desactivarme»
  const START_AT = 2500;                     // ms tras abrir hasta que el robot se mueve (ya se está mirando la pantalla)
  const BUBBLE_AFTER = 1000;                 // ms de meneo hasta que sale el bocadillo (sin salto)
  const DROP_MS = 1300;                      // lo que dura la caída con rebotes (a juego con fervis-cae en css/app.css)
  const SHOW_MS = 9000;                      // cuánto se queda el bocadillo (12 s con el aviso, que es más largo)
  const hello = document.getElementById("fervis-hello");
  const hint = document.getElementById("fervis-hello-hint");
  const robot = document.getElementById("fervis-button");
  const toggle = document.getElementById("fervis-hello-toggle");
  const row = document.querySelector(".section-header");   // la fila de «Cuadrante semanal» y «Gestión»

  function read(key) { try { return localStorage.getItem(key); } catch (error) { return null; } }
  function write(key, value) { try { localStorage.setItem(key, value); } catch (error) { /* sin almacenamiento: saluda, pero no recuerda */ } }
  function isOff() { return read(KEY_OFF) === "off"; }

  // El botón de Ajustes (dentro del panel del chat): desactiva o vuelve a activar
  function paintToggle() { toggle.textContent = window.I18n.t(isOff() ? "fervis.helloOn" : "fervis.helloOff"); }
  toggle.addEventListener("click", function () {
    if (isOff()) { try { localStorage.removeItem(KEY_OFF); } catch (error) { /* nada que quitar */ } } else { write(KEY_OFF, "off"); }
    paintToggle();
  });
  paintToggle();
  document.addEventListener("i18n-change", paintToggle);   // al cambiar de idioma, el botón se vuelve a escribir

  if (isOff()) { return; }
  // Cambiar de semana recarga la página: el saludo sale y cuenta UNA vez por visita (sessionStorage se borra al cerrar la pestaña o la app)
  try { if (sessionStorage.getItem(KEY_VISIT)) { return; } sessionStorage.setItem(KEY_VISIT, "1"); } catch (error) { /* sin sessionStorage: saluda en cada carga */ }
  const count = (parseInt(read(KEY_COUNT), 10) || 0) + 1;
  write(KEY_COUNT, String(count));
  hint.hidden = count !== HINT_AT;

  const timers = [];
  let ghost = null;   // la copia del robot que salta (el de la barra se queda quieto, oculto, hasta que vuelve)
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // La copia sube de un salto a la barra y el robot de verdad reaparece. Si la animación no llegara a terminar (pestaña en
  // segundo plano), un temporizador lo devuelve igual: el robot nunca se queda oculto.
  function comeBack() {
    if (!ghost) { return; }
    const copy = ghost;
    ghost = null;
    let done = false;
    function finish() { if (done) { return; } done = true; copy.remove(); robot.classList.remove("ausente"); }
    copy.classList.add("sube");
    copy.addEventListener("animationend", finish, { once: true });
    setTimeout(finish, 800);
  }
  function hide() {
    timers.forEach(clearTimeout);
    hello.hidden = true;
    robot.classList.remove("saludando");
    comeBack();
  }

  // El bocadillo junto a `box` (el robot, donde esté): a su derecha, a su izquierda si no cabe, o debajo; la punta lo señala
  function showBubble(box, beside) {
    hello.hidden = false;
    hello.classList.remove("lateral", "lateral-izq");
    const w = hello.offsetWidth;
    const gap = 14;
    let left, top;
    if (beside && box.right + gap + w <= window.innerWidth - 8) {
      hello.classList.add("lateral"); left = box.right + gap; top = box.top + box.height / 2 - 20;
    } else if (beside && box.left - gap - w >= 8) {
      hello.classList.add("lateral-izq"); left = box.left - gap - w; top = box.top + box.height / 2 - 20;
    } else {
      left = Math.max(8, Math.min(window.innerWidth - w - 8, box.left + box.width / 2 - w / 2)); top = box.bottom + 10;
      hello.style.setProperty("--tail", (box.left + box.width / 2 - left) + "px");
    }
    hello.style.left = left + "px";
    hello.style.top = top + "px";
    later(hide, hint.hidden ? SHOW_MS : SHOW_MS + 3000);
  }

  // El salto: una copia del robot cae desde la barra hasta el centro de la fila de «Cuadrante semanal» y rebota
  function drop() {
    const from = robot.getBoundingClientRect();
    const to = row.getBoundingClientRect();
    ghost = document.createElement("div");
    ghost.className = "fervis-ghost no-print";
    ghost.setAttribute("aria-hidden", "true");
    ghost.append(robot.querySelector("svg").cloneNode(true));
    ghost.style.left = from.left + "px";
    ghost.style.top = from.top + "px";
    ghost.style.setProperty("--drop", (to.top + to.height / 2 - from.height / 2 - from.top) + "px");
    ghost.addEventListener("click", function () { robot.click(); });   // tocarlo abre el chat, como el de la barra (que está oculto)
    document.body.append(ghost);
    robot.classList.add("ausente");
    later(function () { showBubble(ghost.getBoundingClientRect(), true); }, DROP_MS);
  }

  // Con «reducir movimiento» no hay salto ni meneo: el bocadillo sale igual, sin esperar
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  later(function () {
    // Solo salta en pantalla ancha (900 px: el mismo corte de css/app.css en que el robot va centrado en la barra; en tablet y
    // móvil está junto a la persona y caería encima de «Gestión») y si la fila está bajo la barra (con la página desplazada no)
    if (!still && window.matchMedia("(min-width: 900px)").matches && row &&
        row.getBoundingClientRect().top > robot.getBoundingClientRect().bottom) { drop(); return; }
    if (!still) { robot.classList.add("saludando"); }
    later(function () { showBubble(robot.getBoundingClientRect(), false); }, still ? 0 : BUBBLE_AFTER);
  }, START_AT);

  hello.addEventListener("click", function () { robot.click(); });
  document.addEventListener("click", hide, { once: true });  // cualquier toque, también antes de que salga: cancela el saludo
})();
