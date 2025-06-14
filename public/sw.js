
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
    vibrate: [200, 100, 200, 100, 200],
    tag: 'signal-notification-' + signal.timestamp,
    requireInteraction: true,
    data: {
      signal: signal,
      timestamp: Date.now()
    },
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

  return self.registration.showNotification('🔔 Binary Options Signal Alert!', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          return clients[0].focus();
        }
        return self.clients.openWindow('/');
      })
    );
  }
});

// Handle push notifications for mobile
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Signal notification',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [200, 100, 200],
    tag: 'signal-notification',
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Signal Tracker', options)
  );
});

// Set up periodic background sync - with error handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REGISTER_BACKGROUND_SYNC') {
    console.log('Registering background sync');
    
    // Check if sync is supported and registration exists
    if ('sync' in self.registration && self.registration.sync) {
      try {
        self.registration.sync.register('signal-check').then(() => {
          console.log('Background sync registered successfully');
        }).catch((err) => {
          console.log('Background sync registration failed:', err.message);
          // Don't spam console with full error details
        });
      } catch (error) {
        console.log('Background sync not supported:', error.message);
      }
    } else {
      console.log('Background sync not supported in this browser');
    }
  }
});
