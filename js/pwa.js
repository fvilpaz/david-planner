// App instalable (paso 10): registra el service worker (sw.js: la app se abre sin conexión) y pide al navegador que
// no borre los datos por su cuenta cuando le falte espacio (navigator.storage.persist()). Esto último no protege de
// «Borrar datos del sitio»: para eso está la copia descargada (backup.js).
(function () {
  "use strict";
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* sin service worker la app funciona igual, con red */ });
  }
  // Solo cuando ya hay algo que proteger: en Firefox, pedirlo enseña un aviso, y el primer día sobraría
  let saved = null;
  try { saved = localStorage.getItem(window.Store.KEY); } catch (e) { /* sin almacenamiento */ }
  if (saved !== null && !window.Store.DEMO && navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(function (already) { return already || navigator.storage.persist(); })
      .catch(function () { /* si el navegador no quiere, la copia descargada sigue siendo la protección */ });
  }
})();
