const CACHE_NAME = 'aura-v1-cache-core';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app-state.js',
    './js/ui-render.js'
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] A instalar...');
    // Forçar ativação imediata após instalação
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] A fazer cache dos ficheiros app shell');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] A ativar...');
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
    // Garantir que o SW controla as páginas imediatamente
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Estratégia Stale-While-Revalidate para melhor experiência
    // Tenta servir do cache, mas vai à network atualizar em background
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // Se a resposta for válida, atualiza o cache
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            });

            // Retorna o cache se existir, senão espera pelo network
            return cachedResponse || fetchPromise;
        })
    );
});

// Listener para mensagens de controlo
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
