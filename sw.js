const CACHE_NAME = 'wowsims-v9';

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
  '/wowsims-mobile/assets/favicon_io/android-chrome-512x512.png'
];

// Install: pre-cache small core assets only
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

// Fetch: intercept local icon requests -> redirect to CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Rewrite local icon paths to wow.zamimg.com CDN
  if (url.origin === location.origin) {
    const iconMatch = url.pathname.match(/\/wowsims-mobile\/icons\/(large|medium|small)\/(.+)\.svg$/);
    if (iconMatch) {
      const size = iconMatch[1];
      const name = iconMatch[2];
      const cdnUrl = `https://wow.zamimg.com/images/wow/icons/${size}/${name}.jpg`;
      event.respondWith(fetch(cdnUrl).catch(() => fetch(event.request)));
      return;
    }
    
    const socketMatch = url.pathname.match(/\/wowsims-mobile\/icons\/socket\/(socket-\w+)\.svg$/);
    if (socketMatch) {
      const name = socketMatch[1];
      const cdnUrl = `https://wow.zamimg.com/images/icons/${name}.gif`;
      event.respondWith(fetch(cdnUrl).catch(() => fetch(event.request)));
      return;
    }
  }
  
  // For non-origin requests, pass through
  if (url.origin !== location.origin) return;
  
  // Network-first for all other requests
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
