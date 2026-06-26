// Service Worker for Pastillero Inteligente
// Handles push notifications and offline caching

const CACHE_NAME = 'pastillero-v1';

// Install event — cache essential assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push event — display notification when server sends a push message
self.addEventListener('push', (event) => {
  let data = { title: 'Pastillero Inteligente', body: 'Es hora de tomar tu medicamento.' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'medication-reminder',
    renotify: true,
    requireInteraction: true,
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: '📋 Ver Calendario' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(urlToOpen);
    })
  );
});
