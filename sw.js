/* Muqriʼ service worker.
   Goals: instant loads + offline app shell, and cache the big immutable assets
   (fonts + the King Fahd Complex text data on jsDelivr). Audio streams and the
   CORS relays are deliberately left untouched so playback and the proxy
   fallback behave exactly as before. Bump CACHE to invalidate on deploy. */
const CACHE = 'muqri-v15';
const RUNTIME = 'muqri-v15-runtime';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Stale-while-revalidate: serve from cache immediately, refresh in the background.
function staleWhileRevalidate(request) {
  return caches.open(RUNTIME).then(cache =>
    cache.match(request).then(cached => {
      const network = fetch(request)
        .then(res => { if (res && res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  const host = url.hostname;

  // Never intercept audio (range requests / streaming) or the CORS relays.
  if (url.pathname.endsWith('.mp3')) return;
  if (host.indexOf('allorigins.win') !== -1 || host.indexOf('corsproxy.io') !== -1) return;

  // App-shell navigations: try network, fall back to the cached page offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('./index.html').then(r => r || caches.match('./'))
      )
    );
    return;
  }

  // Big immutable assets — fonts and the KFGQPC data — from jsDelivr / Google Fonts.
  if (host === 'cdn.jsdelivr.net' || host === 'fonts.googleapis.com' || host === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Same-origin static files (icons, manifest, the html): cache-first.
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // Everything else (mp3quran API, etc.): straight to the network.
});
