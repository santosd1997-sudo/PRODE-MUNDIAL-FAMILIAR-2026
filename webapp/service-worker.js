// ============================================
// PRODE MUNDIAL 2026 - Service Worker
// ============================================

const CACHE_NAME = 'prode-mundial-2026-v9';
const STATIC_CACHE = 'prode-static-v9';
const DYNAMIC_CACHE = 'prode-dynamic-v9';
const API_CACHE = 'prode-api-v9';

// Static assets to cache on install (app shell)
const APP_SHELL = [
  './',
  'index.html',
  'css/app.css',
  'manifest.json',
  'icons/icon-512.png',
  'icons/icon-192.png',
  'icons/icon-72.png'
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v1...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Cache install failed:', err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !currentCaches.includes(name))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - routing strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests we don't control
  if (!url.origin.includes(self.location.origin) && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  // Google Fonts - cache first, long-lived
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API calls - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, DYNAMIC_CACHE)
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ============================================
// Caching Strategies
// ============================================

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.error('[SW] Cache-first fetch failed:', err);
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Return offline fallback for navigation
    if (request.mode === 'navigate') {
      return caches.match('index.html');
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// ============================================
// Push Notifications
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'PRODE Mundial 2026',
    body: 'Tienes una nueva notificación',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-72.png',
    type: 'general',
    url: './'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || 'icons/icon-192.png',
    badge: data.badge || 'icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './',
      type: data.type || 'general',
      dateOfArrival: Date.now()
    },
    actions: getNotificationActions(data.type),
    tag: data.type,
    renotify: true,
    requireInteraction: data.type === 'match_reminder'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

function getNotificationActions(type) {
  switch (type) {
    case 'match_reminder':
      return [
        { action: 'predict', title: '⚽ Pronosticar', icon: '/icons/icon-72.png' },
        { action: 'dismiss', title: 'Descartar' }
      ];
    case 'result_available':
      return [
        { action: 'view_result', title: '📊 Ver resultado', icon: '/icons/icon-72.png' },
        { action: 'dismiss', title: 'Descartar' }
      ];
    case 'ranking_update':
      return [
        { action: 'view_ranking', title: '🏆 Ver ranking', icon: '/icons/icon-72.png' },
        { action: 'dismiss', title: 'Descartar' }
      ];
    default:
      return [
        { action: 'open', title: 'Abrir', icon: '/icons/icon-72.png' },
        { action: 'dismiss', title: 'Descartar' }
      ];
  }
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  let targetUrl = './';
  const data = event.notification.data;

  if (event.action === 'dismiss') return;

  switch (event.action) {
    case 'predict':
      targetUrl = './#pronosticos';
      break;
    case 'view_result':
      targetUrl = './#pronosticos';
      break;
    case 'view_ranking':
      targetUrl = './#ranking';
      break;
    default:
      targetUrl = data?.url || './';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window
        return self.clients.openWindow(targetUrl);
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// ============================================
// Background Sync
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-predictions') {
    event.waitUntil(syncPendingPredictions());
  }

  if (event.tag === 'sync-profile') {
    event.waitUntil(syncProfileData());
  }
});

async function syncPendingPredictions() {
  try {
    // Get pending predictions from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-predictions', 'readonly');
    const store = tx.objectStore('pending-predictions');
    const predictions = await getAllFromStore(store);

    for (const prediction of predictions) {
      try {
        const response = await fetch('/api/predictions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prediction)
        });

        if (response.ok) {
          // Remove synced prediction
          const deleteTx = db.transaction('pending-predictions', 'readwrite');
          deleteTx.objectStore('pending-predictions').delete(prediction.id);
        }
      } catch (err) {
        console.error('[SW] Failed to sync prediction:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync predictions failed:', err);
  }
}

async function syncProfileData() {
  try {
    const db = await openDB();
    const tx = db.transaction('pending-profile', 'readonly');
    const store = tx.objectStore('pending-profile');
    const data = await getAllFromStore(store);

    for (const item of data) {
      try {
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });

        const deleteTx = db.transaction('pending-profile', 'readwrite');
        deleteTx.objectStore('pending-profile').delete(item.id);
      } catch (err) {
        console.error('[SW] Failed to sync profile:', err);
      }
    }
  } catch (err) {
    console.error('[SW] Sync profile failed:', err);
  }
}

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('prode-mundial-2026', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-predictions')) {
        db.createObjectStore('pending-predictions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-profile')) {
        db.createObjectStore('pending-profile', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// Message handling (from main app)
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) =>
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }

  if (event.data?.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) =>
        cache.addAll(event.data.urls || [])
      )
    );
  }
});
