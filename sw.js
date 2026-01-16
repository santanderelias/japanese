const CACHE_NAME = 'santael-v4';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './main.css',
    './app.js',
    './home.js',
    './filler.js',
    './learning.js',
    './stats.js',
    './srs.js',
    './study.js',
    './particles.js',
    './reorder.js',
    './kanji.js',
    './installer.js',
    './data.json',
    './manifest.json',
    './favicon.ico',
    './vendor/bootstrap.min.css',
    './vendor/bootstrap.bundle.min.js',
    './icon-192x192.png',
    './icon-512x512.png'
];

// Install Event - Cache Files
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event - Cleanup Old Caches
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activate');
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// Fetch Event - Serve from Cache
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Fetching resource: ' + e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    console.log('[Service Worker] Caching new resource: ' + e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});
