
// Database utilities for storing signals in IndexedDB
const DB_NAME = 'SignalTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'signals';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

export const storeSignalsInBackground = async (signals: any[], antidelaySeconds: number) => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear existing signals
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve(undefined);
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Store new signals with antidelay settings
    for (const signal of signals) {
      const signalWithSettings = {
        ...signal,
        antidelaySeconds,
        id: undefined // Let IndexedDB auto-generate
      };
      
      await new Promise((resolve, reject) => {
        const addRequest = store.add(signalWithSettings);
        addRequest.onsuccess = () => resolve(undefined);
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
    
    console.log('Signals stored in background:', signals.length);
  } catch (error) {
    console.error('Error storing signals in background:', error);
  }
};

export const scheduleBackgroundSync = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // Tell service worker to schedule background checks
      registration.active?.postMessage({
        type: 'SCHEDULE_BACKGROUND_CHECK'
      });
    }).catch(error => {
      console.log('Background sync scheduling failed:', error);
    });
  }
};
