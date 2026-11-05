// 離線快取：網路優先（拿到新版就更新快取），離線時才用快取
const CACHE = 'tobi-v16';
const FILES = ['./', 'index.html', 'style.css', 'lang.js', 'music.js', 'game.js', 'manifest.webmanifest', 'icon.svg', 'assets/hero.png', 'assets/logo.webp', 'assets/icon-180.png', 'assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
