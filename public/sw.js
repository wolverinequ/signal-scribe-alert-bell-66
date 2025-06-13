
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
    event.waitUntil(checkSignalsBackground());
  }
});

// Store signals in IndexedDB for background access
const DB_NAME = 'SignalTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'signals';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function checkSignalsBackground() {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const getAllRequest = store.getAll();
    getAllRequest.onsuccess = () => {
      const signals = getAllRequest.result;
      const now = new Date();
      
      signals.forEach(async (signal) => {
        if (!signal.triggered && shouldTriggerSignal(signal, now)) {
          // Mark as triggered
          signal.triggered = true;
          store.put(signal);
          
          // Show notification
          await showSignalNotification(signal);
          
          // Try to wake up the main app
          const clients = await self.clients.matchAll({ type: 'window' });
          clients.forEach(client => {
            client.postMessage({
              type: 'TRIGGER_SIGNAL',
              signal: signal
            });
          });
        }
      });
    };
  } catch (error) {
    console.log('Background signal check error:', error);
  }
}

function shouldTriggerSignal(signal, now) {
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  // Parse signal timestamp
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  
  // Calculate target time with antidelay
  const signalDate = new Date();
  signalDate.setHours(signalHours, signalMinutes, 0, 0);
  
  // Subtract antidelay seconds (default 15 if not specified)
  const antidelaySeconds = signal.antidelaySeconds || 15;
  const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
  const targetHours = targetTime.getHours();
  const targetMinutes = targetTime.getMinutes();
  const targetSeconds = targetTime.getSeconds();
  
  // Check if current time matches target time (with 1-minute tolerance for background checks)
  const timeMatches = currentHours === targetHours && 
                     currentMinutes === targetMinutes;
  
  return timeMatches;
}

async function showSignalNotification(signal) {
  const options = {
    body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'signal-notification',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  await self.registration.showNotification('Binary Signal Alert!', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
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
  const options = {
    body: event.data ? event.data.text() : 'Signal notification',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    tag: 'signal-notification',
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification('Signal Tracker', options)
  );
});

// Background sync for regular signal checking
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_BACKGROUND_CHECK') {
    // Schedule background sync
    event.waitUntil(
      self.registration.sync.register('signal-check').catch(() => {
        // Fallback to periodic check if sync is not supported
        setInterval(checkSignalsBackground, 60000); // Check every minute
      })
    );
  }
});
