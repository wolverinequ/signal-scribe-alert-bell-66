
// Notification handling functionality
import { wakeClients } from './sw-core.js';

export async function showWakeUpNotification(signal) {
  const options = {
    body: `🚨 URGENT: ${signal.asset} - ${signal.direction} at ${signal.timestamp} 🚨`,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [1000, 500, 1000, 500, 1000, 500, 1000],
    tag: 'wake-up-signal-' + signal.timestamp,
    requireInteraction: true,
    silent: false,
    renotify: true,
    persistent: true,
    sticky: true,
    data: {
      signal: signal,
      timestamp: Date.now(),
      wakeup: true,
      priority: 'max',
      category: 'alarm',
      importance: 'max',
      ongoing: true,
      fullScreenIntent: true,
      showWhen: true,
      autoCancel: false,
      lights: true,
      lightColor: '#FF0000'
    },
    actions: [
      {
        action: 'view',
        title: 'VIEW SIGNAL NOW',
        icon: '/placeholder.svg'
      },
      {
        action: 'snooze',
        title: 'Snooze 1min',
        icon: '/placeholder.svg'
      }
    ]
  };

  // Show multiple notifications for better wake-up reliability
  await Promise.all([
    self.registration.showNotification('🚨 BINARY OPTIONS WAKE UP! 🚨', options),
    // Show a second notification after 1 second
    new Promise(resolve => {
      setTimeout(async () => {
        await self.registration.showNotification('⚠️ SIGNAL ALERT REPEAT ⚠️', {
          ...options,
          tag: 'wake-up-repeat-' + signal.timestamp,
          body: `REMINDER: ${signal.asset} - ${signal.direction} NOW!`
        });
        resolve();
      }, 1000);
    })
  ]);

  // Try to wake clients
  await wakeClients(signal);
  return;
}

export function setupNotificationHandlers() {
  // Enhanced notification click handler with wake-up focus
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
      event.waitUntil(
        self.clients.matchAll().then(async (clients) => {
          if (clients.length > 0) {
            const client = clients[0];
            await client.focus();
            // Send wake-up message to client
            client.postMessage({
              type: 'NOTIFICATION_WAKE_UP',
              action: 'focus',
              timestamp: Date.now()
            });
            return client;
          }
          return self.clients.openWindow('/');
        })
      );
    } else if (event.action === 'snooze') {
      // Reschedule notification in 1 minute
      const signal = event.notification.data?.signal;
      if (signal) {
        setTimeout(() => {
          showWakeUpNotification(signal);
        }, 60000);
      }
    }
  });

  // Enhanced push notifications for mobile wake-up
  self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    
    const options = {
      body: data.body || '🚨 Signal notification - WAKE UP! 🚨',
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      vibrate: [1000, 500, 1000, 500, 1000],
      tag: 'wake-up-push-signal',
      requireInteraction: true,
      silent: false,
      persistent: true,
      sticky: true,
      data: Object.assign(data, { 
        wakeup: true,
        priority: 'max',
        category: 'alarm',
        importance: 'max',
        ongoing: true,
        fullScreenIntent: true
      })
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '🚨 SIGNAL TRACKER WAKE UP! 🚨', options)
    );
  });
}

export function setupMessageHandlers() {
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
      console.log('Registering background sync');
      self.registration.sync.register('signal-check').then(() => {
        console.log('Background sync registered');
      }).catch((err) => {
        console.log('Background sync registration failed:', err);
      });
    } else if (event.data && event.data.type === 'WAKE_UP_REQUEST') {
      // Handle direct wake-up requests from the app
      const signal = event.data.signal;
      if (signal) {
        showWakeUpNotification(signal);
      }
    }
  });
}
