// Bump this version whenever the cached app changes so old caches are purged.
const CACHE_NAME = 'mmt-cache-v6';
const CACHE_URLS = [
  '/MMT-Inventory/app.html',
  '/MMT-Inventory/cue-list.html',
  '/MMT-Inventory/next-notes.html',
  '/MMT-Inventory/icon-192.png',
  '/MMT-Inventory/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap',
];

// Install — cache core files. One miss shouldn't fail the whole install.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(CACHE_URLS.map(u => cache.add(u).catch(() => {})))
    )
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

// Fetch — stale-while-revalidate for app files.
//
// This used to be network-first with cache:'reload', so every launch waited on
// a full re-download of app.html before anything appeared. Now the cached copy
// is served immediately and a fresh copy is fetched in the background for next
// time. The page already listens for 'controllerchange' and handles
// skipWaiting, so updates still land — on the next open instead of blocking
// this one.
//
// GitHub Pages sets a ~10-minute cache header, so the background refresh keeps
// cache:'reload' to bypass the browser HTTP cache and get the real file.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return;
  if (event.request.url.includes('api.')) return;

  const url = event.request.url;
  const isAppFile = event.request.mode === 'navigate' ||
                    url.includes('app.html') ||
                    url.includes('/MMT-Inventory/');

  if (!isAppFile) {
    // Fonts, CDN libraries: cache first, then network.
    event.respondWith(
      caches.match(event.request).then(hit =>
        hit || fetch(event.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fresh = fetch(event.request, { cache: 'reload' })
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => cached);
      // Cached copy wins when we have one; the fetch still runs and refreshes
      // the cache for the next launch.
      return cached || fresh;
    })
  );
});
