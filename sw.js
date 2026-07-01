const CACHE_NAME = 'wowsims-v2';
const BASE = '/';

// Core files to pre-cache
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/wotlk/lib.wasm',
  '/wotlk/sim_worker.js',
  '/wotlk/net_worker.js',
  '/wotlk/mobile.css',
  '/wotlk/assets/database/db.json',
  '/wotlk/assets/vendor/jquery.min.js',
  '/wotlk/assets/vendor/fontawesome.css',
  '/wotlk/assets/vendor/jquery.tablesorter.min.js',
  '/wotlk/assets/vendor/apexcharts.js',
  '/wotlk/assets/vendor/webfonts/fa-solid-900.woff2',
  '/wotlk/assets/vendor/webfonts/fa-brands-400.woff2',
  '/wotlk/assets/vendor/webfonts/fa-regular-400.woff2',
  '/wotlk/assets/favicon_io/favicon.ico',
  '/wotlk/assets/favicon_io/apple-touch-icon.png',
  '/wotlk/assets/favicon_io/android-chrome-192x192.png',
  '/wotlk/assets/favicon_io/android-chrome-512x512.png'
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
