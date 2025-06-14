
// Core service worker functionality
export function setupServiceWorker() {
  self.addEventListener('install', (event) => {
    console.log('Service Worker installing');
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    console.log('Service Worker activating');
    event.waitUntil(self.clients.claim());
  });
}

export async function wakeClients(signal) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'WAKE_UP_SIGNAL',
      signal: signal,
      timestamp: Date.now()
    });
  });
}

export function handleVisibilityMessages() {
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'PAGE_VISIBLE') {
      console.log('Page became visible - canceling persistent notifications');
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => {
          if (notification.tag && notification.tag.includes('wake-up')) {
            notification.close();
          }
        });
      });
    }
  });
}
