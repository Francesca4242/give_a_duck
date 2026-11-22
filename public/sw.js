/* Offline support. Bump VERSION whenever files change so phones pick up the new build. */
const VERSION = "gad-v3";
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/style.css",
  "js/ui.js", "js/content.js", "js/content-more.js", "js/online.js", "vendor/qrcode.js", "js/duck.js", "js/main.js", "js/install.js",
  "js/games/hat.js", "js/games/scrawl.js", "js/games/goose.js", "js/games/pecking.js", "js/games/quackers.js",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Network-first for our own files (so updates land), cache fallback when offline.
// Fonts: cache-first.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    })));
  }
});
