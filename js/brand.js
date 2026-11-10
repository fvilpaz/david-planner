// Barra de arriba: el local y su ciudad (izquierda, con el lápiz) y la persona (derecha, tocando el círculo).
// Se guardan en «dp_name», «dp_city» y «dp_person». Vacío = el de por defecto (o nada, en ciudad y persona).
// Las iniciales salen solas de los nombres. El local va también en la pestaña y en el título del PDF.
(function () {
  "use strict";
  const DEFAULT_NAME = "David Planner";

  function read(key) {
    try { return (localStorage.getItem(key) || "").trim(); } catch (e) { return ""; }
  }

  function write(key, value) {
    try {
      if (value) { localStorage.setItem(key, value); } else { localStorage.removeItem(key); }
    } catch (e) { /* sin almacenamiento: se ve ahora, pero no se recordará */ }
  }

  // «Beach Club Marea» → BC; «Chiringuito» → CH. Solo cuentan letras (con tilde también, \p{L}) y números (\p{N}):
  // «<b>Bar</b>» o «🍹 Chiringuito» no dejan símbolos en el cuadrado.
  function initials(name, fallback) {
    const words = name.split(/\s+/).map(function (word) { return word.match(/[\p{L}\p{N}]/gu) || []; })
      .filter(function (letters) { return letters.length; });
    if (!words.length) { return fallback; }
    const letters = words.length > 1 ? [words[0][0], words[1][0]] : words[0].slice(0, 2);
    return letters.join("").toUpperCase();
  }

  function show() {
    const name = read("dp_name") || DEFAULT_NAME;
    const person = read("dp_person");
    document.getElementById("brand-name").textContent = name;
    document.getElementById("brand-avatar").textContent = initials(name, "DP");
    document.getElementById("brand-city").textContent = read("dp_city");
    document.getElementById("person-name").textContent = person;
    document.getElementById("person-avatar").textContent = person ? initials(person, "👤") : "👤";
    document.getElementById("print-name").textContent = name;
    document.title = name;
  }

  // Una pieza para los dos lados: el botón [data-open] abre el formulario y esconde lo que se ve ([data-view]);
  // Intro o ✓ guarda cada campo en su clave (data-key); Escape cancela.
  function editor(root) {
    const form = root.querySelector("form");
    const opener = root.querySelector("[data-open]");
    const views = root.querySelectorAll("[data-view]");
    const inputs = form.querySelectorAll("input[data-key]");

    function editing(on) {
      views.forEach(function (view) { view.hidden = on; });
      opener.hidden = on;
      form.hidden = !on;
      if (on) {
        inputs.forEach(function (input) { input.value = read(input.dataset.key); });
        inputs[0].focus();
        inputs[0].select();
      }
    }

    opener.addEventListener("click", function () { editing(true); });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      inputs.forEach(function (input) { write(input.dataset.key, input.value.trim().slice(0, input.maxLength)); });
      show();
      editing(false);
      opener.focus();
    });
    form.addEventListener("keydown", function (event) {
      if (event.key === "Escape") { editing(false); opener.focus(); }
    });
  }

  document.querySelectorAll(".topbar .editor").forEach(editor);
  show();
})();
