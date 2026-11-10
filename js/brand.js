// Nombre de la barra de arriba (el del local o el que quiera David), guardado en «dp_name». Se cambia con el lápiz:
// Intro o ✓ guarda, Escape cancela; vacío vuelve a «David Planner». Las iniciales del cuadrado salen solas del nombre.
// También va en la pestaña del navegador y en el título del PDF.
(function () {
  "use strict";
  const KEY = "dp_name";
  const DEFAULT = "David Planner";
  const nameEl = document.getElementById("brand-name");
  const avatar = document.getElementById("brand-avatar");
  const form = document.getElementById("brand-form");
  const input = document.getElementById("brand-input");
  const edit = document.getElementById("brand-edit");

  function saved() {
    try { return (localStorage.getItem(KEY) || "").trim() || DEFAULT; } catch (e) { return DEFAULT; }
  }

  // «Beach Club Marea» → BC; «Chiringuito» → CH. Solo cuentan letras (con tilde también, \p{L}) y números (\p{N}):
  // «<b>Bar</b>» o «🍹 Chiringuito» no dejan símbolos en el cuadrado.
  function initials(name) {
    const words = name.split(/\s+/).map(function (word) { return word.match(/[\p{L}\p{N}]/gu) || []; })
      .filter(function (letters) { return letters.length; });
    if (!words.length) { return "DP"; }
    const letters = words.length > 1 ? [words[0][0], words[1][0]] : words[0].slice(0, 2);
    return letters.join("").toUpperCase();
  }

  function show(name) {
    nameEl.textContent = name;
    avatar.textContent = initials(name);
    document.getElementById("print-name").textContent = name;
    document.title = name;
  }

  function editing(on) {
    nameEl.hidden = on;
    form.hidden = !on;
    edit.hidden = on;
    if (on) { input.value = nameEl.textContent; input.focus(); input.select(); }
  }

  edit.addEventListener("click", function () { editing(true); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = input.value.trim().slice(0, 40);
    try {
      if (name && name !== DEFAULT) { localStorage.setItem(KEY, name); } else { localStorage.removeItem(KEY); }
    } catch (e) { /* sin almacenamiento: se ve ahora, pero no se recordará */ }
    show(name || DEFAULT);
    editing(false);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") { editing(false); edit.focus(); }
  });

  show(saved());
})();
