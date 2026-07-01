const CACHE_NAME = 'wowsims-v1';

// Critical files to cache immediately
const CRITICAL_CACHE = [
  './',
  './index.html',
  './lib.wasm',
  './sim_worker.js',
  './net_worker.js',
  './mobile.css',
  './manifest.json',
  './assets/database/db.json',
  './assets/vendor/jquery.min.js',
  './assets/vendor/fontawesome.css',
  './assets/vendor/jquery.tablesorter.min.js',
  './assets/vendor/apexcharts.js',
  './assets/vendor/webfonts/fa-solid-900.woff2',
  './assets/vendor/webfonts/fa-brands-400.woff2',
  './assets/vendor/webfonts/fa-regular-400.woff2',
  './assets/favicon_io/favicon.ico',
  './assets/favicon_io/android-chrome-192x192.png',
  './assets/favicon_io/android-chrome-512x512.png'
];

// Install: cache critical files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CRITICAL_CACHE).catch(err => {
        console.log('Cache addAll failed for some resources:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first, then network, then cache fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only handle requests within our scope
  if (url.pathname.includes('/wotlk/') || url.pathname.startsWith('./')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        
        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response.ok && (
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.wasm') ||
            url.pathname.endsWith('.json') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.ico') ||
            url.pathname.endsWith('.woff2') ||
            url.pathname.endsWith('.html')
          )) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Final fallback: try to serve from cache
          return caches.match(event.request);
        });
      })
    );
  }
});
