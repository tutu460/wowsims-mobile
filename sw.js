const CACHE_NAME = 'wowsims-v13';

const CORE_ASSETS = [
  '/wowsims-mobile/',
  '/wowsims-mobile/index.html',
  '/wowsims-mobile/manifest.json',
  '/wowsims-mobile/mobile.css',
  '/wowsims-mobile/i18n_full.js',
  '/wowsims-mobile/assets/database/db.json',
  '/wowsims-mobile/assets/vendor/jquery.min.js',
  '/wowsims-mobile/assets/vendor/apexcharts.js',
  '/wowsims-mobile/assets/favicon_io/favicon.ico'
];

// Install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW v13] Pre-caching core assets');
      return cache.addAll(CORE_ASSETS).catch(err => {
        console.warn('[SW] Some core assets failed to cache:', err);
      });
    })
  );
});

// Activate: clean ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE_NAME) {
          console.log('[SW v13] Deleting old cache:', k);
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
  
  // Navigation requests (HTML pages): network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/wowsims-mobile/');
        });
      })
    );
    return;
  }
  
  // SVG icon requests → serve .jpg equivalent
  if (url.pathname.match(/\/wowsims-mobile\/icons\/large\/.*\.svg$/)) {
    const jpgPath = url.pathname.replace(/\.svg$/, '.jpg');
    event.respondWith(
      caches.match(jpgPath).then(cached => {
        if (cached) return cached;
        return fetch(jpgPath).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(new Request(jpgPath), clone));
          }
          return response;
        }).catch(() => caches.match(jpgPath));
      })
    );
    return;
  }
  
  // Other icon requests: cache-first
  if (url.pathname.match(/\/wowsims-mobile\/icons\//)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match(event.request));
      })
    );
    return;
  }
  
  // All other assets: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request));
    })
  );
});
