// Idioma de la app: español (por defecto) o inglés.
// Los textos están aquí, no en el HTML: el HTML marca cada texto con data-i18n="clave".
// La elección se guarda en dp_lang, igual que el tema (dp_theme).
(function () {
  // Los textos viven en js/lang-es.js y js/lang-en.js (se cargan antes que este archivo): aquí solo está el motor.
  // Para añadir un idioma: un archivo nuevo js/lang-xx.js, y darlo de alta en LOCALES y en readSaved().
  const TEXTS = window.I18nTexts || { es: {}, en: {} };

  function readSaved() {
    try {
      return localStorage.getItem("dp_lang") === "en" ? "en" : "es";
    } catch (e) {
      return "es";   // sin acceso al almacenamiento (modo privado): español
    }
  }

  function saveLang(lang) {
    try { localStorage.setItem("dp_lang", lang); } catch (e) { /* no pasa nada: solo no se recuerda */ }
  }

  let current = readSaved();

  // t("clave") devuelve el texto; t("clave", { from: "2 nov" }) cambia {from} por "2 nov"
  function t(key, params) {
    let text = (TEXTS[current] && TEXTS[current][key]) || TEXTS.es[key] || key;
    if (params) {
      Object.keys(params).forEach(function (name) {
        text = text.split("{" + name + "}").join(params[name]);
      });
    }
    return text;
  }

  // Singular y plural: tn("states.inUse", 3) busca «states.inUse.one» (si n es 1) o «states.inUse.other»; {n} lleva el número
  function tn(key, n, params) {
    return t(key + (n === 1 ? ".one" : ".other"), Object.assign({ n: n }, params));
  }

  // Formatos de fecha y número que siguen al idioma elegido: se crean al usarlos y se guardan por idioma.
  // en-GB y no en-US: «Monday 9», «9–15 Nov 2026» (el día delante, como en español).
  const LOCALES = { es: "es-ES", en: "en-GB" };
  function formatter(Format, options) {
    const cache = {};
    function now() {
      const locale = LOCALES[current];
      if (!cache[locale]) { cache[locale] = new Format(locale, options); }
      return cache[locale];
    }
    return {
      format: function (value) { return now().format(value); },
      formatRange: function (from, to) { return now().formatRange(from, to); }
    };
  }

  // Los nombres que crea la app la primera vez («Camarero 1»…) se ven en el idioma elegido; lo que escriba el
  // usuario, tal cual. Solo es lo que se MUESTRA: lo guardado no cambia.
  const FACTORY_NAME = /^Camarero (\d+)$/;
  function displayName(name) {
    const match = FACTORY_NAME.exec(name);
    return match ? t("name.waiter") + " " + match[1] : name;
  }

  // Igual con lo que trae la app de fábrica (los estados Trabajo, Libre, Vacaciones, Baja y los puntos de venta de la
  // demo): se reconoce por su id y solo si nadie le ha cambiado el nombre. Lo que creó el usuario, o lo de fábrica que
  // renombró, se ve tal cual lo escribió.
  function factoryLabel(prefix, item) {
    const key = prefix + "." + item.id;
    return TEXTS.es[key] && item.name === TEXTS.es[key] ? t(key) : item.name;
  }
  function displayStatus(status) { return factoryLabel("status", status); }
  function displayPlace(place) { return factoryLabel("place", place); }

  // Pone cada texto marcado con data-i18n en el idioma actual
function apply() {
    document.documentElement.lang = current;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    // Para los textos con negrita u otro formato: SOLO textos propios de js/lang-*.js, nunca datos del usuario
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll("[data-lang-choice]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.langChoice === current));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
  }

  function setLang(lang) {
    current = lang === "en" ? "en" : "es";
    saveLang(current);
    apply();
    document.dispatchEvent(new Event("i18n-change"));   // para que app.js vuelva a escribir lo suyo
  }

  window.I18n = { t: t, tn: tn, apply: apply, setLang: setLang, formatter: formatter, displayName: displayName, displayStatus: displayStatus, displayPlace: displayPlace,
                  current: function () { return current; } };

  // Los botones ES | EN llevan data-lang-choice="es" o "en"
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-lang-choice]");
    if (btn) { setLang(btn.dataset.langChoice); }
  });

  apply();   // el script va al final del body: los textos ya existen
})();
