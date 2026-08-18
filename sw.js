/* Service worker minimal : réseau d'abord, cache en secours.
   Stratégie choisie pour ne jamais servir une version périmée quand tu es
   connecté, tout en gardant l'outil utilisable hors réseau. */
const CACHE = "devis-ape-v1";
const FICHIERS = [
  "index.html", "manifest.webmanifest",
  "apple-touch-icon.png", "icone-192.png", "icone-512.png"
];

self.addEventListener("install", evenement => {
  evenement.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", evenement => {
  evenement.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(c => c !== CACHE).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evenement => {
  if (evenement.request.method !== "GET") return;
  // Les appels d'itinéraire ne sont jamais mis en cache.
  if (evenement.request.url.includes("nominatim")
      || evenement.request.url.includes("osrm")) return;

  evenement.respondWith(
    fetch(evenement.request)
      .then(reponse => {
        const copie = reponse.clone();
        caches.open(CACHE).then(cache => cache.put(evenement.request, copie));
        return reponse;
      })
      .catch(() => caches.match(evenement.request).then(r => r || caches.match("index.html")))
  );
});
