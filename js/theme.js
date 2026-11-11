// Tema de ESTE aparato (Claro, Lino, Oscuro o Carbón), guardado en «dp_theme», y el color de las etiquetas en los temas claros
// (de 0, suave como siempre, a 100, vivo; 11-nov, idea de Nando), guardado en «dp_intensity».
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

  const INTENSITY_KEY = "dp_intensity";

  // Un entero de 0 a 100 (lo que no lo sea, 0)
  function intensity() {
    let saved = null;
    try { saved = localStorage.getItem(INTENSITY_KEY); } catch (e) { /* sin almacenamiento: la de por defecto */ }
    const n = Number(saved);
    return saved !== null && Number.isInteger(n) && n >= 0 && n <= 100 ? n : 0;
  }

  // La página lleva el número (data-intensity) y, para el CSS, la proporción de 0 a 1 (--intensity)
  function show(n) {
    document.documentElement.dataset.intensity = String(n);
    document.documentElement.style.setProperty("--intensity", String(n / 100));
  }

  function applyIntensity(n) {
    if (!Number.isInteger(n) || n < 0 || n > 100) { return; }
    show(n);
    try { localStorage.setItem(INTENSITY_KEY, String(n)); } catch (e) { /* se aplica igual, pero no se recordará */ }
  }

  document.documentElement.dataset.theme = current();
  show(intensity());
  return { current: current, apply: apply, intensity: intensity, applyIntensity: applyIntensity };
})();
