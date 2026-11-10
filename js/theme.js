// Tema de ESTE aparato (Claro, Lino, Oscuro o Carbón), guardado en «dp_theme».
// Se carga en el <head>, antes de pintar la página: si se aplicara al final, se vería un momento el tema por
// defecto y luego el elegido (un parpadeo). El navegador puede negar el almacenamiento (modo privado): try/catch.
window.Theme = (function () {
  "use strict";
  const KEY = "dp_theme";
  const THEMES = ["claro", "lino", "oscuro", "carbon"];

  function current() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* sin almacenamiento: el de por defecto */ }
    return THEMES.includes(saved) ? saved : "claro";
  }

  function apply(name) {
    if (!THEMES.includes(name)) { return; }
    document.documentElement.dataset.theme = name;
    try { localStorage.setItem(KEY, name); } catch (e) { /* se aplica igual, pero no se recordará */ }
  }

  document.documentElement.dataset.theme = current();
  return { current: current, apply: apply };
})();
