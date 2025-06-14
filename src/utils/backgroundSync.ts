export const updateSignalsInServiceWorker = (signals: any[], antidelaySeconds: number) => {
  if ('serviceWorker' in navigator) {
    // Method 1: Direct message to active service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_SIGNALS',
        data: { signals, antidelaySeconds }
      });
    }
    
    // Method 2: Wait for service worker to be ready
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_SIGNALS',
          data: { signals, antidelaySeconds }
        });
      }
    });
    
    console.log('Signals sent to service worker:', signals.length);
  }
};

export const updateRingtoneInServiceWorker = (ringtone: string | null) => {
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_RINGTONE',
        data: { ringtone }
      });
    }
    
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'UPDATE_RINGTONE',
          data: { ringtone }
        });
      }
    });
  }
};

export const clearSignalsInServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_SIGNALS',
        data: {}
      });
    }
    
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'CLEAR_SIGNALS',
          data: {}
        });
      }
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

// Enhanced keep alive with multiple mechanisms
export const keepServiceWorkerActive = () => {
  if ('serviceWorker' in navigator) {
    const sendPing = () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PING',
          data: { timestamp: Date.now() }
        });
      }
      
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          registration.active.postMessage({
            type: 'PING',
            data: { timestamp: Date.now() }
          });
        }
      });
    };
    
    // Initial ping
    sendPing();
    
    // Regular pings every 10 seconds (more frequent)
    setInterval(sendPing, 10000);
    
    // Ping on visibility change
    document.addEventListener('visibilitychange', () => {
      sendPing();
    });
    
    // Ping on focus/blur
    window.addEventListener('focus', sendPing);
    window.addEventListener('blur', sendPing);
  }
};

export const forceSignalCheck = () => {
  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PING',
        data: { forceCheck: true, timestamp: Date.now() }
      });
    }
    
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.active) {
        registration.active.postMessage({
          type: 'PING',
          data: { forceCheck: true, timestamp: Date.now() }
        });
      }
    });
  }
  
  requestBackgroundSync();
};

// Enhanced notification permission handling
export const ensureNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }
  return false;
};

// Service worker registration helper
export const ensureServiceWorkerRegistration = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
};
