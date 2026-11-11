// Tema de ESTE aparato (Claro, Lino, Oscuro o Carbón), guardado en «dp_theme», y el color de las etiquetas (de 0, suave como
// siempre, a 100, vivo; en todos los temas; 11-nov, idea de Nando), guardado en «dp_intensity».
// Se carga en el <head>, antes de pintar la página: si se aplicara al final, se vería un momento el tema por
// defecto y luego el elegido (un parpadeo). El navegador puede negar el almacenamiento (modo privado): try/catch.
window.Theme = (function () {
  "use strict";
  const KEY = "dp_theme";
  const THEMES = ["claro", "lino", "oscuro", "carbon"];
  const INTENSITY_KEY = "dp_intensity";

  // Leer y guardar en este aparato. Sin almacenamiento (modo privado), leer da null y guardar no hace nada: el tema y el color se
  // aplican igual, pero no se recordarán.
  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* se aplica igual, pero no se recordará */ }
  }

  function current() {
    const saved = read(KEY);
    return THEMES.includes(saved) ? saved : "claro";
  }

  function apply(name) {
    if (!THEMES.includes(name)) { return; }
    document.documentElement.dataset.theme = name;
    write(KEY, name);
  }

  // Un entero de 0 a 100 (lo que no lo sea, 0)
  function intensity() {
    const saved = read(INTENSITY_KEY);
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
    write(INTENSITY_KEY, String(n));
  }

  document.documentElement.dataset.theme = current();
  show(intensity());
  return { current: current, apply: apply, intensity: intensity, applyIntensity: applyIntensity };
})();
