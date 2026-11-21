// QuadratNotes offline cache. Bump the version when you change jszip, fonts, icons or the list of cached files.
const CACHE = "quadratnotes-v8";
const CORE = ["./", "./index.html", "./jszip.min.js", "./leaflet/leaflet.js", "./leaflet/leaflet.css", "./manifest.webmanifest", "./privacy.html", "./help.html", "./icon-192.png", "./icon-512.png",
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

  // The page itself: try the network first so updates arrive, but don't wait more than a few
  // seconds. On weak signal ("one bar" on the shore) a request can hang for a long time before it
  // fails, so after NAV_TIMEOUT the saved copy is shown and the network copy, if it arrives, is
  // saved for next time. Offline, the saved copy is shown straight away.
  if (req.mode === "navigate") {
    const NAV_TIMEOUT = 3000;
    // Only the app itself is saved as the offline copy; other pages (privacy.html, help.html) are cached under their own address.
    const path = new URL(req.url).pathname;
    const isApp = path.endsWith("/") || path.endsWith("/index.html");
    const key = isApp ? "./index.html" : req;
    const net = fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); return caches.open(CACHE).then(c => c.put(key, copy)).then(() => res); }
      return res;
    });
    e.waitUntil(net.catch(() => {}));
    e.respondWith(
      caches.match(key).then(cached => {
        if (!cached) return net; // first visit: nothing saved yet, so wait for the network
        const timer = new Promise(resolve => setTimeout(() => resolve(cached), NAV_TIMEOUT));
        return Promise.race([net.then(res => res.ok ? res : cached, () => cached), timer]);
      })
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
