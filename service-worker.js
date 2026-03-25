const CACHE_NAME = 'wticket-v3';
const BASE_URL = self.location.href.replace(/\/service-worker\.js.*/, '') || 'https://wisrovi.github.io/wticket';
const STATIC_ASSETS = [
  '',
  'index.html',
  'login.html',
  'dashboard.html',
  'admin.html',
  'contact.html',
  'profile.html',
  'css/styles.css',
  'js/app.js',
  'js/toast.js',
  'js/shortcuts.js',
  'js/utils.js',
  'js/db.js',
  'js/i18n.js',
  'js/achievements.js',
  'manifest.json'
].map(path => `${BASE_URL}/${path}`);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        const results = await Promise.allSettled(
          STATIC_ASSETS.map(url => 
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) return cache.add(url);
                console.warn(`Skipping ${url} - not found`);
              })
              .catch(err => {
                console.warn(`Failed to cache ${url}:`, err.message);
              })
          )
        );
        console.log(`Service Worker: Cached ${results.filter(r => r.status === 'fulfilled').length}/${STATIC_ASSETS.length} assets`);
      })
      .then(() => self.skipWaiting())
      .catch(err => {
        console.error('Service Worker install failed:', err);
        self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('jsonbin.io')) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;
  if (event.request.url.includes('fonts.gstatic.com')) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(`${BASE_URL}/index.html`);
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
