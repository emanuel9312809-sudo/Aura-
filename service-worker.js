const CACHE_NAME = 'aura-v1.9.5-cache';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css?v=1.9.0',
    './js/app-state.js?v=1.9.5',
    './js/ui-render.js?v=1.9.5',
    './js/ui-settings.js?v=1.9.5',
    './js/ui-personal.js?v=1.9.1'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar v1.7.5_fix...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] A fazer cache dos ficheiros app shell v1.7.3');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar v1.7.3...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] A remover cache antiga:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

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
            });
            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
