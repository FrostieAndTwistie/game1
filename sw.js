// Názov cache - zmeňte pri každej aktualizácii assetov, aby sa cache obnovila
const CACHE_NAME = 'frostie-game-cache-v1.1';

// Zoznam súborov, ktoré sa majú cachovať pri inštalácii
// !!! DÔLEŽITÉ: Pridajte SEM VŠETKY súbory potrebné pre beh hry offline !!!
const assetsToCache = [
  '/', // Koreňový adresár (často rovnaký ako index.html)
  '/index.html',
  '/game.js',
  '/manifest.json',
  '/player1.png',
  '/player2.png',
  '/background.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon-180x180.png'
  // Pridajte ďalšie zvuky, obrázky, fonty, knižnice atď.
];

// --- Install Event ---
// Cachuje assety pri prvej inštalácii service workera
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(assetsToCache);
      })
      .then(() => {
        console.log('[Service Worker] All assets cached');
        return self.skipWaiting(); // Aktivuje nový SW hneď (nie je nutné čakať na reload)
      })
      .catch(error => {
          console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
});

// --- Activate Event ---
// Odstráni staré cache, keď sa service worker aktivuje
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim(); // Prevezme kontrolu nad otvorenými stránkami hneď
    })
  );
});

// --- Fetch Event ---
// Interceptuje sieťové požiadavky a vracia odpoveď z cache, ak je dostupná (Cache First stratégia)
self.addEventListener('fetch', event => {
  // Ignorujeme non-GET requesty
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Ak je požiadavka v cache, vrátime ju
        if (cachedResponse) {
          // console.log('[Service Worker] Returning response from cache:', event.request.url);
          return cachedResponse;
        }

        // Ak nie je v cache, skúsime ju získať zo siete
        // console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
            networkResponse => {
                // Voliteľné: Ak chceme dynamicky cachovať aj nové požiadavky (napr. API)
                 /*
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                }
                */
               return networkResponse;
            }
        ).catch(error => {
            console.error('[Service Worker] Fetch failed; returning offline page instead.', error);
            // Voliteľné: Môžete vrátiť fallback offline stránku alebo asset
            // return caches.match('/offline.html');
        });

      })
  );
});