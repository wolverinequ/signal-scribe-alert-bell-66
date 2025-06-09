
// Service Worker for background notifications
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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
