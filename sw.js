/* Service worker: network-first with an offline cache of the app shell.
   Bump VERSION when the SHELL list changes. */
const VERSION = 'mic-v3';
const SHELL = [
  './', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/model.js', './js/storage.js', './js/version.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];
const FONTS = 'mic-fonts';

self.addEventListener('install', (e) => {
  // cache: 'reload' bypasses the browser's HTTP cache so a new worker never installs stale files.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: stale-while-revalidate so typography survives offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App files: network first (so updates land immediately), cache when offline.
  // cache: 'no-cache' revalidates with the server every time; GitHub Pages otherwise lets the
  // browser reuse files for up to 10 minutes without asking.
  // Navigations fall back to the shell: the app is a single page.
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy)); }
      return res;
    }).catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: true }))
  );
});
