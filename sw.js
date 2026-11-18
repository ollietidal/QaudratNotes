// QuadratNotes offline cache. Bump the version when you change jszip, fonts or icons.
const CACHE = "quadratnotes-v6";
const CORE = ["./", "./index.html", "./jszip.min.js", "./leaflet/leaflet.js", "./leaflet/leaflet.css", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png",
  "./fonts/atkinson-hyperlegible-latin-400-normal.woff2", "./fonts/atkinson-hyperlegible-latin-400-italic.woff2",
  "./fonts/atkinson-hyperlegible-latin-700-normal.woff2", "./fonts/barlow-condensed-latin-600-normal.woff2",
  "./fonts/barlow-condensed-latin-700-normal.woff2", "./fonts/nunito-latin-800-normal.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // The page itself: try the network first so updates arrive, fall back to the cached copy offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // OpenStreetMap tiles are not cached here: their tile policy doesn't allow offline use, so the
  // browser fetches them normally (and honours their caching headers).
  if (new URL(req.url).hostname === "tile.openstreetmap.org") return;

  // Everything else (script, icons, fonts): cached copy first, refreshed in the background.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});
