
// Enhanced Service Worker for signal tracking and inter-app communication
const SIGNAL_STORE = 'signal-tracker-store';
const SIGNAL_VERSION = 1;

self.addEventListener('install', (event) => {
  console.log('Signal Tracker Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Signal Tracker Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'STORE_SIGNALS':
      storeSignals(data.signals, data.antidelaySeconds);
      break;
    case 'SIGNAL_RINGING':
      broadcastToAllClients(event.data);
      sendPushNotification('Signal Ringing', data.signal);
      break;
    case 'SIGNAL_ABOUT_TO_RING':
      broadcastToAllClients(event.data);
      break;
    case 'RING_STOPPED':
      broadcastToAllClients(event.data);
      break;
  }
});

// Handle background sync for signal monitoring
self.addEventListener('sync', (event) => {
  if (event.tag === 'signal-check') {
    event.waitUntil(checkStoredSignals());
  }
});

// Store signals in IndexedDB for background processing
async function storeSignals(signals, antidelaySeconds) {
  try {
    const db = await openDB();
    const tx = db.transaction(['signals'], 'readwrite');
    const store = tx.objectStore('signals');
    
    await store.clear();
    await store.put({
      id: 1,
      signals,
      antidelaySeconds,
      timestamp: Date.now()
    });
    
    console.log('Signals stored in Service Worker');
  } catch (error) {
    console.log('Error storing signals:', error);
  }
}

// Check stored signals for timing
async function checkStoredSignals() {
  try {
    const db = await openDB();
    const tx = db.transaction(['signals'], 'readonly');
    const store = tx.objectStore('signals');
    const data = await store.get(1);
    
    if (data && data.signals) {
      const now = new Date();
      data.signals.forEach(signal => {
        if (shouldTriggerSignal(signal, data.antidelaySeconds, now)) {
          broadcastToAllClients({
            type: 'BACKGROUND_SIGNAL_TRIGGER',
            signal,
            timestamp: Date.now()
          });
        }
      });
    }
  } catch (error) {
    console.log('Error checking stored signals:', error);
  }
}

// Broadcast message to all app clients
async function broadcastToAllClients(message) {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window'
  });
  
  clients.forEach(client => {
    client.postMessage(message);
  });
  
  console.log('Broadcasted to clients:', message);
}

// Send push notification
async function sendPushNotification(title, signal) {
  const options = {
    body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [200, 100, 200],
    tag: 'signal-tracker-ring',
    requireInteraction: true,
    data: {
      type: 'SIGNAL_RING',
      signal,
      timestamp: Date.now()
    }
  };

  await self.registration.showNotification(title, options);
}

// Helper function to check if signal should trigger
function shouldTriggerSignal(signal, antidelaySeconds, now) {
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  
  const signalDate = new Date();
  signalDate.setHours(signalHours, signalMinutes, 0, 0);
  
  const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
  const targetHours = targetTime.getHours();
  const targetMinutes = targetTime.getMinutes();
  const targetSeconds = targetTime.getSeconds();
  
  return currentHours === targetHours && 
         currentMinutes === targetMinutes && 
         currentSeconds === targetSeconds &&
         !signal.triggered;
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SIGNAL_STORE, SIGNAL_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('signals')) {
        db.createObjectStore('signals', { keyPath: 'id' });
      }
    };
  });
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

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Signal notification from Signal Tracker',
    icon: '/placeholder.svg',
    badge: '/placeholder.svg',
    vibrate: [200, 100, 200],
    tag: 'signal-tracker-notification',
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification('Signal Tracker', options)
  );
});
