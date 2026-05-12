const CACHE_NAME = 'APP_VERSION_PLACEHOLDER';

const ASSETS = ASSETS_PLACEHOLDER;

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request, { ignoreSearch: true }).then((response) => {
            return response || fetch(e.request);
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'get-version') {
        event.ports[0].postMessage(CACHE_NAME);
    }
});
