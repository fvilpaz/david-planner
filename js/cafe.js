/* Café: ventana de apoyo voluntario (PayPal y USDC). Abre desde el pie, cierra con ✕ / fuera, y copia las direcciones. */
(function () {
  "use strict";
  var dialog = document.getElementById("cafe-dialog");
  var open = document.getElementById("cafe-open");
  if (!dialog || !open) { return; }

  open.addEventListener("click", function () { dialog.showModal(); });
  dialog.querySelector("[data-close]").addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (event) { if (event.target === dialog) { dialog.close(); } });  // clic fuera = cerrar

  dialog.querySelectorAll("button.cafe-copy").forEach(function (button) {
    button.addEventListener("click", function () {
      var text;
      navigator.clipboard.writeText(button.dataset.addr).then(
        function () { text = window.I18n.t("cafe.copied"); },
        function () { text = window.I18n.t("cafe.copyFail"); }
      ).then(function () {
        button.textContent = text;
        setTimeout(function () { button.textContent = window.I18n.t("cafe.copy"); }, 1600);
      });
    });
  });
})();
