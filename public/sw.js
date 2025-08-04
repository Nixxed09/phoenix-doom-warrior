// Service Worker for Phoenix DOOM Warrior
const CACHE_NAME = 'phoenix-doom-warrior-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.js',
  '/src/Game.js',
  '/src/Player.js',
  '/src/Enemy.js',
  '/src/Weapon.js',
  '/src/Level.js',
  '/src/UI.js',
  '/src/Audio.js',
  '/src/Multiplayer.js',
  '/src/Performance.js',
  '/src/ParticleSystem.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for dynamic content
          if (event.request.url.includes('/assets/') || 
              event.request.url.includes('.js') ||
              event.request.url.includes('.css')) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for multiplayer
self.addEventListener('sync', event => {
  if (event.tag === 'sync-game-state') {
    event.waitUntil(syncGameState());
  }
});

async function syncGameState() {
  // Sync saved game state when back online
  const cache = await caches.open(CACHE_NAME);
  const savedState = await cache.match('/saved-state');
  
  if (savedState) {
    const state = await savedState.json();
    // Send to server when implemented
    console.log('Syncing game state:', state);
  }
}

// Push notifications for multiplayer invites
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New multiplayer invite!',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'join',
        title: 'Join Game',
        icon: '/icon-check.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icon-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Phoenix DOOM Warrior', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'join') {
    event.waitUntil(
      clients.openWindow('/?join=true')
    );
  }
});