// 離線快取
// - 開啟頁面（index.html）：網路優先，但網路 1.5 秒沒回應就先用快取開起來（新版在背景下載存進快取，下次開啟生效）
// - 其他檔案：跟著這次頁面的來源走，避免新舊檔案混用——頁面用了快取，接下來 30 秒內的檔案也先用快取；頁面是新版，檔案就照常網路優先
// - 離線時一律用快取
const CACHE = 'tobi-v126';
const FILES = ['./', 'index.html', 'style.css', 'lang.js', 'music.js', 'art.js', 'foes2.js', 'chars.js', 'sidebg.js', 'cut.js', 'game.js', 'ads.js', 'stagefx.js', 'levels.js', 'tutorial.js', 'help.js', 'history.js', 'manifest.webmanifest', 'assets/icon-64.png', 'assets/icon-512.png', 'assets/hero.png', 'assets/logo.webp', 'assets/team_logo.webp', 'assets/icon-180.png', 'assets/icon-192.png'];
const NET_WAIT = 1500;
let cachedAt = 0;   // 最近一次頁面改用快取開啟的時間
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const q = e.request; if (q.method !== 'GET') return;
  const net = fetch(q).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(q, cp)); } return r; });
  e.waitUntil(net.then(() => { }, () => { }));   // 先回了快取的話，網路下載仍然跑完、存進快取
  e.respondWith(caches.match(q).then(hit => {
    if (!hit) return net;   // 沒有快取：只能等網路
    if (q.mode === 'navigate') return new Promise(res => {   // 開啟頁面：最多等網路 1.5 秒
      const to = setTimeout(() => { cachedAt = Date.now(); res(hit); }, NET_WAIT);
      net.then(r => { clearTimeout(to); if (r.ok) { cachedAt = 0; res(r); } else { cachedAt = Date.now(); res(hit); } }, () => { clearTimeout(to); cachedAt = Date.now(); res(hit); });
    });
    if (Date.now() - cachedAt < 30000) return hit;   // 這次頁面是快取版：檔案也用快取，版本一致
    return net.catch(() => hit);
  }));
});
