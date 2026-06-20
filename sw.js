const CACHE_NAME = 'mmt-cache-v1';
const CACHE_URLS = [
  '/MMT-Inventory/dashboard.html',
  '/MMT-Inventory/team.html',
  '/MMT-Inventory/staff.html',
  '/MMT-Inventory/tasks.html',
  '/MMT-Inventory/index.html',
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

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('api.')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
