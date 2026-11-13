// Service worker de David Planner (paso 10): la app se abre sin conexión. Mismo sistema que health-tracker
// (src/sw.js): red primero con tope de 3 s y, sin red o con la red lenta, la copia guardada.
// Diferencia: el nombre de la caché es fijo. health-tracker lo cambia en cada subida con un proceso automático de
// GitHub que aquí no hay; como aquí la red va primero, lo guardado se renueva solo cada vez que hay conexión.
// El dominio fvilpaz.github.io lo comparten varias apps (health-tracker, nplayer…): este service worker SOLO toca
// sus propias cachés, las que empiezan por «david-planner-». Y SOLO atiende sus propios archivos (los de ESSENTIAL)
// y la página de la app: todo lo demás de la misma dirección pasa sin tocarlo ni guardarlo. Así, si algún día
// coincidiera dirección con otra cosa (en local, el ERP también usa localhost), no se mete en lo ajeno.
const PREFIX = "david-planner-";
const CACHE = PREFIX + "v1";

// Lo necesario para abrir la app sin conexión desde la primera visita
const ESSENTIAL = [
  "./", "index.html", "manifest.webmanifest", "css/themes.css", "css/app.css",
  "js/theme.js", "js/lang-es.js", "js/lang-en.js", "js/i18n.js", "js/dates.js", "js/demo-data.js", "js/storage.js", "js/brand.js", "js/clientes.js", "js/app.js", "js/cell.js",
  "js/swap.js", "js/lists.js", "js/staff.js", "js/states.js", "js/places.js", "js/backup.js", "js/fervis-datos.js", "js/guide-es.js", "js/guide-en.js", "js/fervis-guia.js", "js/fervis.js", "js/fervis-saludo.js",
  "js/pwa.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", function (event) {
  // Uno a uno: si falta alguno, se guardan los demás (addAll fallaría entero)
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return Promise.allSettled(ESSENTIAL.map(function (url) { return cache.add(new Request(url, { cache: "reload" })); }));
  }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys()
    .then(function (keys) {
      const old = keys.filter(function (key) { return key.startsWith(PREFIX) && key !== CACHE; });  // solo las nuestras
      return Promise.all(old.map(function (key) { return caches.delete(key); }));
    })
    .then(function () { return self.clients.claim(); }));
});

// Espera a la red como mucho `ms`; si tarda más (mala cobertura en el local), se usa la copia guardada
function withLimit(promise, ms) {
  return new Promise(function (resolve, reject) {
    const timer = setTimeout(function () { reject(new Error("red lenta")); }, ms);
    promise.then(function (value) { clearTimeout(timer); resolve(value); }, function (error) { clearTimeout(timer); reject(error); });
  });
}

// La copia guardada; «?week=…» no cuenta
function fromCache(request) {
  return caches.match(request, { ignoreSearch: true });
}

// Las direcciones completas de lo nuestro (sin «?…»): ESSENTIAL, con la página de la app («./»)
const OWN = new Set(ESSENTIAL.map(function (path) { return new URL(path, self.registration.scope).href; }));

function isOwn(request) {
  const url = new URL(request.url);
  return request.method === "GET" && OWN.has(url.origin + url.pathname);
}

self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (!isOwn(request)) { return; }  // lo ajeno, ni se toca ni se guarda
  // Red primero (así las actualizaciones llegan solas). cache: "no-cache" obliga a preguntar al servidor: sin él,
  // GitHub Pages sirve el JS y el CSS viejos hasta 10 minutos.
  const network = fetch(request, { cache: "no-cache" }).then(function (response) {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
    }
    return response;
  });
  // Sin red o con la red lenta: la copia guardada; si no hay copia, se sigue esperando a la red
  event.respondWith(withLimit(network, 3000).catch(function () {
    return fromCache(request).then(function (response) { return response || network; });
  }));
});
