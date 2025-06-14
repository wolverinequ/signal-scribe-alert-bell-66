// Enhanced Service Worker for reliable background notifications
let savedSignals = [];
let customRingtone = null;
let antidelaySeconds = 15;
let db = null;
let checkInterval = null;
let heartbeatInterval = null;

// IndexedDB setup
const DB_NAME = 'SignalTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'signals';

// Initialize IndexedDB with proper error handling
const initDB = () => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        resolve(null); // Resolve with null instead of rejecting
      };
      
      request.onsuccess = () => {
        db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB initialization failed:', error);
      resolve(null);
    }
  });
};

// Save signals to IndexedDB
const saveSignalsToDB = async (signals) => {
  if (!db) return;
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing signals
    await new Promise((resolve) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => resolve();
    });
    
    // Add new signals
    for (const signal of signals) {
      await new Promise((resolve) => {
        const addRequest = store.add({
          ...signal,
          savedAt: Date.now()
        });
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => resolve();
      });
    }
    
    console.log('Signals saved to IndexedDB:', signals.length);
  } catch (error) {
    console.error('Error saving signals to DB:', error);
  }
};

// Load signals from IndexedDB
const loadSignalsFromDB = async () => {
  if (!db) return [];
  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error loading signals from DB:', error);
    return [];
  }
};

// Enhanced signal checking with multiple timing strategies
const checkSignalTime = (signal, currentTime, antidelay = 15) => {
  if (!signal.timestamp || signal.triggered) return false;
  
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  if (isNaN(signalHours) || isNaN(signalMinutes)) return false;
  
  // Create target time
  const targetDate = new Date();
  targetDate.setHours(signalHours, signalMinutes, 0, 0);
  const targetTime = targetDate.getTime() - (antidelay * 1000);
  
  // Check with tolerance for missed signals (30 second window)
  const timeDiff = currentTime - targetTime;
  return timeDiff >= 0 && timeDiff <= 30000;
};

// Main signal checking function
const performSignalCheck = async () => {
  try {
    // Load signals from IndexedDB if not in memory
    if (savedSignals.length === 0) {
      savedSignals = await loadSignalsFromDB();
    }
    
    if (savedSignals.length === 0) return;
    
    const currentTime = Date.now();
    const now = new Date(currentTime);
    
    console.log(`SW: Checking signals at ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
    
    let hasTriggered = false;
    
    for (let i = 0; i < savedSignals.length; i++) {
      const signal = savedSignals[i];
      
      if (checkSignalTime(signal, currentTime, antidelaySeconds)) {
        await triggerSignal(signal, i);
        hasTriggered = true;
      }
    }
    
    if (hasTriggered) {
      await saveSignalsToDB(savedSignals);
    }
    
  } catch (error) {
    console.error('Error in performSignalCheck:', error);
  }
};

// Trigger signal notification with enhanced settings
const triggerSignal = async (signal, index) => {
  try {
    // Mark as triggered
    savedSignals[index].triggered = true;
    
    const title = 'Signal Alert';
    const body = signal.asset ? 
      `${signal.asset} - ${signal.direction} at ${signal.timestamp}` : 
      `Signal at ${signal.timestamp}`;
    
    // Enhanced notification with maximum alertness
    await self.registration.showNotification(title, {
      body: body,
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      tag: `signal-${Date.now()}-${Math.random()}`,
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [500, 200, 500, 200, 500, 200, 500],
      actions: [
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        signal: signal,
        timestamp: Date.now()
      }
    });
    
    console.log('SW: Signal notification triggered:', signal.timestamp);
    
  } catch (error) {
    console.error('Error triggering signal:', error);
  }
};

// Continuous checking mechanism
const startContinuousChecking = () => {
  // Clear existing intervals
  if (checkInterval) clearInterval(checkInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Primary check every second
  checkInterval = setInterval(() => {
    performSignalCheck();
  }, 1000);
  
  // Heartbeat every 15 seconds to keep service worker alive
  heartbeatInterval = setInterval(() => {
    console.log('SW: Heartbeat at', new Date().toLocaleTimeString());
    performSignalCheck(); // Also check on heartbeat
  }, 15000);
  
  console.log('SW: Continuous checking started');
};

// Stop continuous checking
const stopContinuousChecking = () => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  console.log('SW: Continuous checking stopped');
};

// Service Worker Event Listeners
self.addEventListener('install', (event) => {
  console.log('SW: Installing');
  event.waitUntil(initDB());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activating');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      initDB()
    ])
  );
});

// Enhanced message handling
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_SIGNALS':
      savedSignals = (data.signals || []).map(s => ({ ...s, triggered: false }));
      antidelaySeconds = data.antidelaySeconds || 15;
      
      await saveSignalsToDB(savedSignals);
      
      if (savedSignals.length > 0) {
        startContinuousChecking();
      } else {
        stopContinuousChecking();
      }
      
      console.log('SW: Updated signals:', savedSignals.length);
      break;
      
    case 'UPDATE_RINGTONE':
      customRingtone = data.ringtone;
      break;
      
    case 'CLEAR_SIGNALS':
      savedSignals = [];
      customRingtone = null;
      stopContinuousChecking();
      
      if (db) {
        try {
          const transaction = db.transaction([STORE_NAME], 'readwrite');
          transaction.objectStore(STORE_NAME).clear();
        } catch (error) {
          console.error('Error clearing DB:', error);
        }
      }
      console.log('SW: Cleared all signals');
      break;
      
    case 'PING':
      console.log('SW: Ping received');
      await performSignalCheck();
      break;
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'signal-check') {
    event.waitUntil(performSignalCheck());
  }
});

// Push event for additional reliability
self.addEventListener('push', (event) => {
  event.waitUntil(performSignalCheck());
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action !== 'dismiss') {
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

// Initialize on startup
initDB().then(() => {
  console.log('SW: Initialized');
  // Start checking immediately if we have signals
  loadSignalsFromDB().then((signals) => {
    if (signals.length > 0) {
      savedSignals = signals;
      startContinuousChecking();
    }
  });
});
