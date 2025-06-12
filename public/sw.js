
// Service Worker for background notifications and mobile support
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle background sync for signal monitoring
self.addEventListener('sync', (event) => {
  if (event.tag === 'signal-check') {
    event.waitUntil(checkSignals());
  }
});

async function checkSignals() {
  // This would typically check stored signals and trigger notifications
  console.log('Checking signals in background');
}

// Handle notification clicks - focus the app and wake screen aggressively
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        // Focus existing client and attempt screen wake
        return clients[0].focus().then(() => {
          // Send message to client to trigger screen wake
          return clients[0].postMessage({
            type: 'WAKE_SCREEN',
            source: 'notification_click'
          });
        });
      }
      return self.clients.openWindow('/');
    })
  );
});

// Enhanced push notifications for mobile screen wake (no vibration)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '🚨 Signal notification - Time to trade!',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'signal-notification',
    requireInteraction: true,
    silent: false,
    renotify: true,
    actions: [
      {
        action: 'view',
        title: 'View Signal'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🚨 Trading Signal Alert!', options)
  );
});
