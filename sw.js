const CACHE_NAME = 'wowsims-v2';
const BASE = '/';

// Core files to pre-cache
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/wowsims-mobile/lib.wasm',
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

// Install: pre-cache core assets
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

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for static assets, network-first for dynamic
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;
  
  // For WASM and large files: cache first (they never change)
  if (url.pathname.includes('.wasm') || 
      url.pathname.includes('db.json') ||
      url.pathname.includes('/vendor/') ||
      url.pathname.includes('/bundle/')) {
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
      })
    );
    return;
  }
  
  // For HTML pages: network first, fallback to cache
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
