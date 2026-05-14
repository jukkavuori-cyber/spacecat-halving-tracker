// SpaceCat service worker — offline cache + smart strategies.
// Version bump = forces all clients to pick up the new cache.
const VERSION = 'spacecat-v1';
const CACHE_STATIC = `${VERSION}-static`;
const CACHE_API = `${VERSION}-api`;

// Pre-cache the essentials so the app loads instantly offline.
const PRECACHE = [
  '/',
  '/about/',
  '/price/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.png',
  '/hero/frame1.png',
  '/hero/frame2.png',
  '/hero/frame3.png',
  '/hero/frame4.png',
  '/hero/frame5.png',
  '/hero/frame6.png',
  '/meow1.mp3',
  '/meow2.mp3',
];

// ── Install: pre-cache critical assets ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(PRECACHE).catch((err) => {
        console.warn('[SW] Precache failed:', err);
      })
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches, take control of all clients ──────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(VERSION))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route by URL type ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only GETs cacheable
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API calls (mempool.space, binance, coingecko, alternative.me)
  // → Network-first with stale-while-revalidate fallback
  const isApi =
    url.hostname.includes('mempool.space') ||
    url.hostname.includes('binance.com') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('alternative.me');

  if (isApi) {
    event.respondWith(networkFirst(req, CACHE_API));
    return;
  }

  // Same-origin: cache-first for assets, network-first for HTML
  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
      event.respondWith(networkFirst(req, CACHE_STATIC));
    } else {
      event.respondWith(cacheFirst(req, CACHE_STATIC));
    }
    return;
  }

  // Cross-origin assets (fonts, CDN libs): cache-first
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('api.qrserver.com')
  ) {
    event.respondWith(cacheFirst(req, CACHE_STATIC));
    return;
  }
});

// ── Strategy: cache-first (good for immutable static assets) ─────────────
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp.ok || resp.type === 'opaque') {
      const cache = await caches.open(cacheName);
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  } catch (err) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

// ── Strategy: network-first (good for HTML and live data) ────────────────
async function networkFirst(req, cacheName) {
  try {
    const resp = await fetch(req);
    if (resp.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, resp.clone()).catch(() => {});
    }
    return resp;
  } catch (err) {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === 'navigate') {
      // Fallback to the app shell so users see something
      return caches.match('/');
    }
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

// ── Message handler: skipWaiting trigger from page ───────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
