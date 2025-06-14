export const updateSignalsInServiceWorker = (signals: any[], antidelaySeconds: number) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'UPDATE_SIGNALS',
      data: { signals, antidelaySeconds }
    });
    
    console.log('Signals sent to service worker:', signals.length);
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
      if ('sync' in registration) {
        return (registration as any).sync.register('signal-check');
      }
    }).catch((err) => {
      console.log('Background sync registration failed:', err);
    });
  }
};

// Enhanced keep alive mechanism
export const keepServiceWorkerActive = () => {
  if ('serviceWorker' in navigator) {
    // Send periodic pings to keep service worker active and trigger checks
    const sendPing = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PING',
          data: { timestamp: Date.now() }
        });
      }
    };
    
    // Initial ping
    sendPing();
    
    // Regular pings every 15 seconds
    setInterval(sendPing, 15000);
    
    // Also send ping when visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        sendPing();
      }
    });
  }
};

// Force service worker to check signals immediately
export const forceSignalCheck = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PING',
      data: { forceCheck: true, timestamp: Date.now() }
    });
  }
  
  requestBackgroundSync();
};
