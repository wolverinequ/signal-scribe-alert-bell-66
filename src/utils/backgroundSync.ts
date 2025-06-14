export const updateSignalsInServiceWorker = (signals: any[], antidelaySeconds: number) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_SIGNALS',
      data: { signals, antidelaySeconds }
    });
    
    // Also request background sync to ensure signals are monitored
    requestBackgroundSync();
  }
};

export const updateRingtoneInServiceWorker = (ringtone: string | null) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_RINGTONE',
      data: { ringtone }
    });
  }
};

export const clearSignalsInServiceWorker = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_SIGNALS',
      data: {}
    });
  }
};

export const requestBackgroundSync = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // Type guard for Background Sync API
      if ('sync' in registration && typeof (registration as any).sync.register === 'function') {
        return (registration as any).sync.register('signal-check');
      } else {
        console.log('Background sync not supported, using service worker intervals');
      }
    }).catch((err) => {
      console.log('Background sync registration failed:', err);
    });
  }
};

// Additional function to keep service worker active
export const keepServiceWorkerActive = () => {
  if ('serviceWorker' in navigator) {
    // Send periodic messages to keep service worker active
    setInterval(() => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PING',
          data: { timestamp: Date.now() }
        });
      }
    }, 25000); // Every 25 seconds to prevent service worker from sleeping
  }
};
