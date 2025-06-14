// Service Worker for background notifications and mobile support
let savedSignals = [];
let customRingtone = null;
let antidelaySeconds = 15;
let lastCheckTime = 0;
let db = null;

// IndexedDB setup for persistent storage
const DB_NAME = 'SignalTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'signals';

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Save signals to IndexedDB
const saveSignalsToDB = (signals) => {
  if (!db) return;
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Clear existing signals
  store.clear();
  
  // Add new signals
  signals.forEach(signal => {
    store.add({
      ...signal,
      savedAt: Date.now()
    });
  });
};

// Load signals from IndexedDB
const loadSignalsFromDB = () => {
  return new Promise((resolve) => {
    if (!db) {
      resolve([]);
      return;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const signals = request.result || [];
      resolve(signals);
    };
    
    request.onerror = () => resolve([]);
  });
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(initDB());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      initDB()
    ])
  );
});

// Listen for messages from the main app
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_SIGNALS':
      savedSignals = data.signals || [];
      antidelaySeconds = data.antidelaySeconds || 15;
      lastCheckTime = Date.now();
      console.log('Updated signals in SW:', savedSignals.length);
      
      // Reset all triggered flags and save to IndexedDB
      savedSignals = savedSignals.map(s => ({ ...s, triggered: false }));
      await saveSignalsToDB(savedSignals);
      
      // Schedule immediate check
      scheduleSignalCheck();
      break;
      
    case 'UPDATE_RINGTONE':
      customRingtone = data.ringtone;
      break;
      
    case 'CLEAR_SIGNALS':
      savedSignals = [];
      customRingtone = null;
      if (db) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        transaction.objectStore(STORE_NAME).clear();
      }
      console.log('Cleared signals in SW');
      break;
      
    case 'PING':
      // Keep alive ping - schedule a check
      scheduleSignalCheck();
      break;
  }
});

// Background sync for signal monitoring
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  if (event.tag === 'signal-check') {
    event.waitUntil(performSignalCheck());
  }
});

// Push event handler for additional reliability
self.addEventListener('push', (event) => {
  console.log('Push event received');
  event.waitUntil(performSignalCheck());
});

// Schedule a signal check using multiple methods
function scheduleSignalCheck() {
  // Method 1: Background Sync (most reliable)
  if (self.registration && self.registration.sync) {
    self.registration.sync.register('signal-check').catch(err => {
      console.log('Background sync registration failed:', err);
    });
  }
  
  // Method 2: Immediate check
  performSignalCheck();
}

// Main signal checking function
async function performSignalCheck() {
  try {
    // Load signals from IndexedDB if not in memory
    if (savedSignals.length === 0) {
      savedSignals = await loadSignalsFromDB();
    }
    
    if (savedSignals.length === 0) return;
    
    const now = new Date();
    const currentTime = now.getTime();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentSeconds = now.getSeconds();
    
    console.log(`Checking signals at ${currentHours}:${currentMinutes}:${currentSeconds}`);
    
    // Check for missed signals if we haven't checked in a while
    const timeSinceLastCheck = currentTime - lastCheckTime;
    if (timeSinceLastCheck > 5000) { // More than 5 seconds
      console.log('Checking for missed signals, gap:', timeSinceLastCheck);
      await checkMissedSignals(currentTime);
    }
    
    // Check current signals
    for (let i = 0; i < savedSignals.length; i++) {
      const signal = savedSignals[i];
      if (signal.triggered) continue;
      
      if (signal.timestamp && signal.timestamp.includes(':')) {
        const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
        
        // Calculate target time with antidelay
        const signalDate = new Date();
        signalDate.setHours(signalHours, signalMinutes, 0, 0);
        const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
        const targetHours = targetTime.getHours();
        const targetMinutes = targetTime.getMinutes();
        const targetSeconds = targetTime.getSeconds();
        
        // Check if current time matches target time (with 2-second tolerance)
        const timeMatches = currentHours === targetHours && 
                           currentMinutes === targetMinutes && 
                           Math.abs(currentSeconds - targetSeconds) <= 2;
        
        if (timeMatches) {
          await triggerSignal(signal, i);
        }
      }
    }
    
    lastCheckTime = currentTime;
    
    // Schedule next check if there are untriggered signals
    const hasUntriggeredSignals = savedSignals.some(s => !s.triggered);
    if (hasUntriggeredSignals) {
      setTimeout(() => scheduleSignalCheck(), 1000);
    }
    
  } catch (error) {
    console.error('Error in performSignalCheck:', error);
  }
}

// Check for missed signals
async function checkMissedSignals(currentTime) {
  for (let i = 0; i < savedSignals.length; i++) {
    const signal = savedSignals[i];
    if (signal.triggered || !signal.timestamp || !signal.timestamp.includes(':')) continue;
    
    const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
    
    // Calculate target time with antidelay
    const signalDate = new Date();
    signalDate.setHours(signalHours, signalMinutes, 0, 0);
    const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
    
    // Check if target time has passed (within last 5 minutes to avoid old signals)
    const timeDiff = currentTime - targetTime.getTime();
    
    if (timeDiff > 0 && timeDiff < 300000) { // Within last 5 minutes
      console.log('Triggering missed signal:', signal);
      await triggerSignal(signal, i);
    }
  }
}

// Trigger signal notification
async function triggerSignal(signal, index) {
  try {
    // Mark as triggered in memory and persist
    savedSignals[index].triggered = true;
    await saveSignalsToDB(savedSignals);
    
    const title = 'Signal Alert';
    const body = signal.asset ? 
      `${signal.asset} - ${signal.direction} at ${signal.timestamp}` : 
      `Signal at ${signal.timestamp}`;
    
    // Show notification with sound
    await self.registration.showNotification(title, {
      body: body,
      icon: '/placeholder.svg',
      badge: '/placeholder.svg',
      tag: `signal-${Date.now()}`,
      requireInteraction: true,
      silent: false,
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: {
        signal: signal,
        timestamp: Date.now()
      }
    });
    
    console.log('Signal notification triggered:', signal);
    
  } catch (error) {
    console.error('Error triggering signal:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked');
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Initialize on startup
initDB().then(() => {
  console.log('Service Worker database initialized');
  scheduleSignalCheck();
});
