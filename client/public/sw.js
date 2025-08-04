const CACHE_NAME = 'segarow-offline-v9';
const OFFLINE_URL = '/offline.html';
const SONIC_GAME_URL = './dino_sonic/sonic_dino_game.html';

// Fichiers à mettre en cache
const urlsToCache = [
  OFFLINE_URL,
  SONIC_GAME_URL,
  // Sprites du jeu Dino Sonic
  './dino_sonic/background.png',
  './dino_sonic/start.png',
  './dino_sonic/run_1.png',
  './dino_sonic/run_2.png',
  './dino_sonic/jump.png',
  './dino_sonic/crouch.png',
  './dino_sonic/game_over.png',
  './dino_sonic/enemy.png',
  './dino_sonic/robotnik.png',
  './dino_sonic/spike.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Essayer de mettre en cache tous les fichiers un par un
        const cachePromises = urlsToCache.map((url) => {
          return fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response.clone());
              }
            })
            .catch((error) => {
              // Erreur de cache
            });
        });
        
        return Promise.allSettled(cachePromises);
      })
  );
  
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation du Service Worker
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Configuration du serveur Node.js
const NODE_SERVER_URL = self.location.origin;

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-GET
  if (request.method !== 'GET') return;
  
  // Ignorer les requêtes externes
  if (url.origin !== self.location.origin) return;
  
  event.respondWith(
    fetch(request, { 
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'same-origin'
    })
      .then((response) => {
        // Si la réponse est OK, la retourner
        if (response.ok) {
          return response;
        }
        
        // Si erreur serveur (404, 500, etc.), essayer le cache
        throw new Error(`Server error: ${response.status}`);
      })
      .catch((error) => {
        
        // Cas 1: Requête pour le jeu Sonic ou ses assets
        if (url.pathname.startsWith('/dino_sonic/')) {
          // Essayer d'abord avec l'URL exacte
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              
              // Si pas trouvé, essayer sans les paramètres de requête
              const cleanUrl = url.origin + url.pathname;
              
              return caches.match(cleanUrl)
                .then((cleanCachedResponse) => {
                  if (cleanCachedResponse) {
                    return cleanCachedResponse;
                  } else {
                    return new Response('Jeu Sonic non disponible hors ligne', {
                      status: 404,
                      statusText: 'Not Found'
                    });
                  }
                });
            });
        }
        
        // Cas 2: Requête de navigation (page HTML) - Vérifier la connexion internet ET les serveurs
        if (request.mode === 'navigate') {
          // Si la requête contient un paramètre de timestamp, forcer le rechargement
          const hasTimestamp = url.searchParams.has('t');
          
          // Vérifier d'abord la connexion internet
          return navigator.onLine ? 
            // Si en ligne, essayer directement la requête React
            fetch(request, { 
              cache: hasTimestamp ? 'no-cache' : 'default',
              headers: hasTimestamp ? { 'Cache-Control': 'no-cache' } : {}
            }).then(response => {
              if (response.ok) {
                return response;
              } else {
                // Si la requête React échoue, retourner offline.html
                return caches.match(OFFLINE_URL);
              }
            }).catch(() => {
              // Erreur lors de la requête, retourner offline.html
              return caches.match(OFFLINE_URL);
            }) :
            // Si hors ligne, retourner directement offline.html
            caches.match(OFFLINE_URL);
        }
        
        // Cas 3: Autres ressources
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            } else {
              return new Response('Ressource non disponible hors ligne', {
                status: 404,
                statusText: 'Not Found'
              });
            }
          });
      })
  );
});

// Messages depuis l'application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 