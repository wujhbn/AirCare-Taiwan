// AirCare Taiwan PWA - Service Worker
const CACHE_NAME = 'aircare-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
];

// Install Event - Pre-cache essential shells
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline structures');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Failed to pre-cache some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network First with Cached Fallback holding dynamic client routing
self.addEventListener('fetch', (event) => {
  const reqUrl = new URL(event.request.url);

  // Skip browser extensions and API requests, letting API call go live or fail properly
  if (reqUrl.origin !== self.location.origin) {
    // If external font or stylesheet, cache it on fly or load from cache
    if (reqUrl.hostname.includes('fonts.googleapis.com') || reqUrl.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request).then((networkResponse) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }).catch(() => caches.match('/'));
        })
      );
      return;
    }
    return; // Pass-through other third parties
  }

  // Handle local API requests - pass-through
  if (reqUrl.pathname.startsWith('/api/')) {
    return;
  }

  // SPA fallback + regular assets
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache successful requests for assets (js, css, images) dynamically
        if (
          networkResponse.status === 200 &&
          (reqUrl.pathname.endsWith('.js') ||
            reqUrl.pathname.endsWith('.css') ||
            reqUrl.pathname.endsWith('.png') ||
            reqUrl.pathname.endsWith('.xml') ||
            reqUrl.pathname.endsWith('.ico'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline recovery
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If seeking home or navigation, feed the offline fallback index shell
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Handle notification click event to focus or open the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
            break;
          }
        }
        return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

