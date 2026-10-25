// Auto-generated Service Worker - Version 1.0.8
// Target URL: https://santael.com | Strategy: stale-while-revalidate
const CACHE_NAME = '1.0.8';
const PRECACHE_ASSETS = [
  "/",
  "/offline.html",
  "/favicon-32x32.png",
  "/styles.css",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/index.html",
  "/js/orchestrator.js",
  "/js/main.js",
  "/js/ui.js",
  "/js/audio.js",
  "/js/data.js",
  "/js/storage.js",
  "/assets/icon-192.png",
  "/assets/icon-512.png",
  "/content/marugoto_a1_vocabulary.json",
  "/content/genki_lessons.json",
  "/content/audio_map.json",
  "/js/modules/section2.js",
  "/js/modules/settings.js",
  "/js/modules/studying.js",
  "/js/modules/minigames.js",
  "/js/modules/quiz.js",
  "/js/modules/navbar.js",
  "/js/modules/section1.js",
  "/js/modules/base.js",
  "/js/modules/japanese.js",
  "/js/modules/home.js",
  "/js/modules/flashcards.js",
  "/js/modules/kana.js",
  "/js/modules/section2/content.html",
  "/js/modules/section2/section2.css",
  "/js/modules/section2/counter.js",
  "/js/modules/section2/index.js",
  "/js/modules/section2/loader.js",
  "/js/modules/section2/assets/banner.svg"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching application assets...');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
      cacheAudioInBatches();
    })
  );
});

async function cacheAudioInBatches() {
  try {
    const response = await fetch('/content/audio_map.json');
    if (!response.ok) return;
    const audioMap = await response.json();
    const filenames = Array.from(new Set(Object.values(audioMap)));
    const audioUrls = filenames.map(f => `/content/audio/${f}`);

    const cache = await caches.open(CACHE_NAME);
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 1000;

    for (let i = 0; i < audioUrls.length; i += BATCH_SIZE) {
      const batch = audioUrls.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (url) => {
          const match = await cache.match(url);
          if (!match) {
            try {
              const res = await fetch(url);
              if (res.ok) {
                await cache.put(url, res);
              }
            } catch {
              // Ignore background fetch error
            }
          }
        })
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  } catch {
    // Ignore background cache error
  }
}

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, rely on cache or offline page
      });

      return cachedResponse || fetchPromise.catch(() => { return caches.match('/offline.html') || Response.error(); });
    })
  );
});
