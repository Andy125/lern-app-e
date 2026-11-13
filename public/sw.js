// Offline: alle Dateien beim Installieren laden. Cache-Name muss zur Version in version.js passen.
const CACHE = "puppenstube-v1";
const DATEIEN = ["./", "index.html", "style.css", "version.js", "logic.js", "erklaerungen.js", "puppe.js", "app.js", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((res) => { const kopie = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, kopie)); return res; }).catch(() => caches.match("index.html"))));
});
