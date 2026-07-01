const CACHE_NAME = 'wowsims-v3';

const CORE_ASSETS = [
  '/wowsims-mobile/',
  '/wowsims-mobile/index.html',
  '/wowsims-mobile/manifest.json',
  '/wowsims-mobile/sim_worker.js',
  '/wowsims-mobile/net_worker.js',
  '/wowsims-mobile/mobile.css',
  '/wowsims-mobile/assets/database/db.json',
  '/wowsims-mobile/assets/vendor/jquery.min.js',
  '/wowsims-mobile/assets/vendor/fontawesome.css',
  '/wowsims-mobile/assets/vendor/jquery.tablesorter.min.js',
  '/wowsims-mobile/assets/vendor/apexcharts.js',
  '/wowsims-mobile/assets/vendor/webfonts/fa-solid-900.woff2',
  '/wowsims-mobile/assets/vendor/webfonts/fa-brands-400.woff2',
  '/wowsims-mobile/assets/vendor/webfonts/fa-regular-400.woff2',
  '/wowsims-mobile/assets/favicon_io/favicon.ico',
  '/wowsims-mobile/assets/favicon_io/apple-touch-icon.png',
  '/wowsims-mobile/assets/favicon_io/android-chrome-192x192.png',
  '/wowsims-mobile/assets/favicon_io/android-chrome-512x512.png'
];

// Install: pre-cache small core assets only (NOT the 40MB WASM)
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
});

// Activate: clean ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for everything, simple fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  
  // Network-first for all requests
  event.respondWith(
    fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
