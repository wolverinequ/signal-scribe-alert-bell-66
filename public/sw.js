
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
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    for (const signal of signals) {
      if (shouldTriggerSignal(signal, antidelaySeconds, now)) {
        await showNotification(signal);
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
    // Try to get from IndexedDB first, fallback to localStorage
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

async function showNotification(signal) {
  const options = {
    body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    tag: 'signal-notification-' + signal.timestamp,
    requireInteraction: true,
    persistent: true,
    sticky: true,
    data: {
      signal: signal,
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'view',
        title: 'View Signal',
        icon: '/placeholder.svg'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    // Enhanced wake-up properties
    silent: false,
    renotify: true,
    timestamp: Date.now(),
    // Additional properties for better wake-up behavior
    image: '/placeholder.svg',
    dir: 'auto',
    lang: 'en'
  };

  // Show the notification
  const notification = await self.registration.showNotification('🔔 Binary Options Signal Alert!', options);
  
  // Attempt to wake up screen through clients
  await wakeUpAllClients();
  
  return notification;
}

// Enhanced wake-up functionality for service worker
async function wakeUpAllClients() {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    
    // Focus all available clients
    clients.forEach(client => {
      if (client.focus) {
        client.focus();
      }
      
      // Send wake-up message to client
      client.postMessage({
        type: 'WAKE_UP_SCREEN',
        timestamp: Date.now()
      });
    });
    
    console.log(`Wake-up signal sent to ${clients.length} clients`);
  } catch (error) {
    console.error('Failed to wake up clients:', error);
  }
}

// Handle notification clicks with enhanced wake-up
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clients) => {
        if (clients.length > 0) {
          const client = clients[0];
          if (client.focus) {
            client.focus();
          }
          // Send wake-up message
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            signal: event.notification.data.signal
          });
          return client;
        }
        return self.clients.openWindow('/');
      })
    );
  }
});

// Handle push notifications for mobile with wake-up
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Signal notification',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [500, 200, 500, 200, 500],
    tag: 'signal-notification',
    requireInteraction: true,
    persistent: true,
    data: data,
    silent: false,
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 Signal Tracker', options)
      .then(() => wakeUpAllClients())
  );
});

// Set up periodic background sync
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    console.log('Registering background sync');
    // Register for background sync
    self.registration.sync.register('signal-check').then(() => {
      console.log('Background sync registered');
    }).catch((err) => {
      console.log('Background sync registration failed:', err);
    });
  }
});
