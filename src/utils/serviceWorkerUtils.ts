
// Service Worker communication utilities
export const registerSignalServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      console.log('Service Worker ready for signal communication');
    });
  }
};

export const sendToServiceWorker = (message: any) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage(message);
      console.log('Message sent to Service Worker:', message);
    } catch (error) {
      console.log('Service Worker message error:', error);
    }
  }
};

export const scheduleBackgroundSignalCheck = (signals: any[]) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.sync) {
        try {
          return registration.sync.register('signal-check');
        } catch (error) {
          console.log('Background sync registration failed:', error);
        }
      }
    });
  }
};
