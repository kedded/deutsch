// Offline cache. Bump VERSION when you want to force a full refresh.
const VERSION = 'deutsch-v1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Open instantly from the cache; refresh the cache in the background so the next start has the newest version.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => { if (res && res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => null);
    if (cached) { e.waitUntil(network); return cached; }
    const res = await network;
    return res || (e.request.mode === 'navigate' ? cache.match('./index.html') : Response.error());
  }));
});
