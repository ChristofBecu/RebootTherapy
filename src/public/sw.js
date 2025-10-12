const CACHE_NAME = 'reboot-therapy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/public/styles.css',
  '/scripts/main.js',
  '/scripts/api.js',
  '/scripts/commits.js',
  '/scripts/config.js',
  '/scripts/darkMode.js',
  '/scripts/navigation.js',
  '/scripts/postRenderer.js',
  '/scripts/reactions.js',
  '/scripts/syntaxHighlight.js',
  '/scripts/tagFilter.js',
  '/scripts/utils.js',
  '/public/logo.svg',
  '/public/logo-mobile.svg',
  'https://cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((err) => {
          console.error('Failed to cache:', err);
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
