const CACHE_NAME = 'wowsims-v12';

const CORE_ASSETS = [
  '/wowsims-mobile/',
  '/wowsims-mobile/index.html',
  '/wowsims-mobile/manifest.json',
  '/wowsims-mobile/sim_worker.js',
  '/wowsims-mobile/net_worker.js',
  '/wowsims-mobile/mobile.css',
  '/wowsims-mobile/i18n_full.js',
  '/wowsims-mobile/icon-fallback.css',
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
  '/wowsims-mobile/assets/favicon_io/android-chrome-512x512.png',
  '/wowsims-mobile/icons/socket/socket-blue.svg',
  '/wowsims-mobile/icons/socket/socket-meta.svg',
  '/wowsims-mobile/icons/socket/socket-prismatic.svg',
  '/wowsims-mobile/icons/socket/socket-red.svg',
  '/wowsims-mobile/icons/socket/socket-yellow.svg'
];

// Install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW v12] Pre-caching core assets');
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Some core assets failed to cache:', err);
      });
    })
  );
});

// Activate: aggressively clean ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('[SW v12] Deleting old cache:', k);
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;
  
  // SVG icon requests → redirect to .jpg equivalent
  if (url.pathname.match(/\/wowsims-mobile\/icons\/large\/.*\.svg$/)) {
    const jpgUrl = url.pathname.replace(/\.svg$/, '.jpg');
    const jpgRequest = new Request(jpgUrl, {
      method: 'GET',
      headers: event.request.headers
    });
    event.respondWith(
      caches.match(jpgRequest).then(cached => {
        if (cached) return cached;
        return fetch(jpgRequest).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(jpgRequest, clone));
          }
          return response;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }
  
  // All icon requests: network-first, then cache
  if (url.pathname.match(/\/wowsims-mobile\/icons\//)) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // All other assets: cache-first (core assets pre-cached)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match(event.request))
  );
});
