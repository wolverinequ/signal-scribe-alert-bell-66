
// Service Worker for background notifications and mobile wake-up support
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
  try {
    console.log('Checking signals in service worker');
    
    // Get signals from IndexedDB or localStorage
    const signals = await getStoredSignals();
    const antidelaySeconds = await getStoredAntidelay();
    
    if (!signals || signals.length === 0) {
      console.log('No signals found in storage');
      return;
    }
    
    const now = new Date();
    
    for (const signal of signals) {
      if (shouldTriggerSignal(signal, antidelaySeconds, now)) {
        await showWakeUpNotification(signal);
        // Mark signal as triggered
        signal.triggered = true;
        await updateStoredSignals(signals);
      }
    }
  } catch (error) {
    console.error('Error checking signals in service worker:', error);
  }
}

function shouldTriggerSignal(signal, antidelaySeconds, now) {
  if (signal.triggered) return false;
  
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  const signalDate = new Date();
  signalDate.setHours(signalHours, signalMinutes, 0, 0);
  
  // Subtract antidelay seconds
  const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
  
  // Check if current time matches target time (within 1 second tolerance)
  const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
  return timeDiff < 1000;
}

async function getStoredSignals() {
  try {
    return new Promise((resolve) => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('binary_signals');
        resolve(stored ? JSON.parse(stored) : []);
      } else {
        resolve([]);
      }
    });
  } catch (error) {
    console.error('Failed to get stored signals:', error);
    return [];
  }
}

async function getStoredAntidelay() {
  try {
    return new Promise((resolve) => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('antidelay_seconds');
        resolve(stored ? parseInt(stored, 10) : 15);
      } else {
        resolve(15);
      }
    });
  } catch (error) {
    console.error('Failed to get stored antidelay:', error);
    return 15;
  }
}

async function updateStoredSignals(signals) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('binary_signals', JSON.stringify(signals));
    }
  } catch (error) {
    console.error('Failed to update stored signals:', error);
  }
}

async function showWakeUpNotification(signal) {
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
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'WAKE_UP_SIGNAL',
      signal: signal,
      timestamp: Date.now()
    });
  });

  return;
}

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

// Set up periodic background sync with enhanced wake-up
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

// Listen for visibility changes to enhance wake-up
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PAGE_VISIBLE') {
    console.log('Page became visible - canceling persistent notifications');
    // Cancel ongoing notifications when app becomes visible
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => {
        if (notification.tag && notification.tag.includes('wake-up')) {
          notification.close();
        }
      });
    });
  }
});
