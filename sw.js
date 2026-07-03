// Bump this version whenever the cached app changes so old caches are purged.
const CACHE_NAME = 'mmt-cache-v4';
const CACHE_URLS = [
  '/MMT-Inventory/app.html',
  '/MMT-Inventory/icon-192.png',
  '/MMT-Inventory/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap',
];

// Install — cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

// Allow the page to tell a waiting SW to activate immediately
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Activate — clean ALL old caches (this purges the old dashboard cache)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, bypassing the browser HTTP cache for app files
// (GitHub Pages sets a ~10-min cache header; without this the "network" fetch
//  returns the stale cached file and updates never appear).
self.addEventListener('fetch', event => {
  // Skip non-GET and API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('api.')) return;

  const url = event.request.url;
  const isAppFile = event.request.mode === 'navigate' ||
                    url.includes('app.html') ||
                    url.includes('/MMT-Inventory/');

  const fetchOpts = isAppFile ? { cache: 'reload' } : {};

  event.respondWith(
    fetch(event.request, fetchOpts)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
