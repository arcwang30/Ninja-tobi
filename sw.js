// 離線快取：網路優先（拿到新版就更新快取），離線時才用快取
const CACHE = 'tobi-v17';
const FILES = ['./', 'index.html', 'style.css', 'lang.js', 'music.js', 'game.js', 'manifest.webmanifest', 'icon.svg', 'assets/hero.png', 'assets/logo.webp', 'assets/icon-180.png', 'assets/icon-192.png', 'assets/art/bg_hayashi_far.webp','assets/art/bg_hayashi_mid.webp','assets/art/bg_hayashi_sky.webp','assets/art/enemy_00.webp','assets/art/enemy_01.webp','assets/art/enemy_02.webp','assets/art/enemy_03.webp','assets/art/enemy_04.webp','assets/art/enemy_05.webp','assets/art/enemy_06.webp','assets/art/enemy_07_a.webp','assets/art/enemy_07_b.webp','assets/art/hero_base.webp','assets/art/hero_dash.webp','assets/art/hero_dive.webp','assets/art/hero_fall.webp','assets/art/hero_fly.webp','assets/art/hero_hurt.webp','assets/art/hero_lose.webp','assets/art/hero_up.webp','assets/art/hero_win.webp','assets/art/wall_hayashi.webp'];
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
