
// Enhanced Service Worker for aggressive Android screen wake
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with enhanced wake features');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating with wake capabilities');
  event.waitUntil(self.clients.claim());
});

// Handle background sync for signal monitoring with wake trigger
self.addEventListener('sync', (event) => {
  if (event.tag === 'signal-check') {
    event.waitUntil(checkSignalsAndWake());
  }
});

async function checkSignalsAndWake() {
  console.log('🔄 Checking signals in background and preparing wake');
  
  // Trigger aggressive wake notification
  await self.registration.showNotification('🚨 SIGNAL CHECK - WAKE UP! 🚨', {
    body: 'Checking for trading signals - Screen wake initiated',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'wake-signal-check',
    requireInteraction: true,
    silent: false,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  });
}

// Enhanced notification click handler with aggressive wake sequence
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked - Starting aggressive wake sequence');
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        // Focus existing client and trigger comprehensive wake
        return clients[0].focus().then(() => {
          // Send multiple wake commands to client
          clients[0].postMessage({
            type: 'AGGRESSIVE_WAKE_SCREEN',
            source: 'notification_click',
            timestamp: Date.now()
          });
          
          clients[0].postMessage({
            type: 'FORCE_SCREEN_ON',
            source: 'service_worker',
            timestamp: Date.now()
          });
          
          return clients[0];
        });
      }
      return self.clients.openWindow('/');
    })
  );
});

// Enhanced push notifications with maximum wake priority
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received - Triggering wake');
  
  const options = {
    body: event.data ? event.data.text() : '🚨 URGENT: Trading Signal Alert - WAKE UP!',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'urgent-wake-signal',
    requireInteraction: true,
    silent: false,
    timestamp: Date.now(),
    actions: [
      {
        action: 'view',
        title: 'View Signal Now'
      },
      {
        action: 'wake',
        title: 'Wake Screen'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🚨 TRADING SIGNAL ALERT! 🚨', options)
  );
});

// Add message listener for wake commands from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_WAKE_NOTIFICATION') {
    console.log('📱 Received wake trigger from main app');
    
    self.registration.showNotification('🚨 WAKE UP - SIGNAL ALERT! 🚨', {
      body: 'Important trading signal detected - Check immediately!',
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      tag: 'manual-wake-trigger',
      requireInteraction: true,
      silent: false,
      timestamp: Date.now()
    });
  }
});
