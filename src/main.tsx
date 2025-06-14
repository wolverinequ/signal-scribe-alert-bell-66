
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for background functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Register for background sync if supported
        if ('sync' in registration && registration.sync) {
          (registration.sync as any).register('signal-check').then(() => {
            console.log('Background sync registered');
          }).catch((err) => {
            console.log('Background sync registration failed:', err);
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Listen for messages from service worker for wake-up
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'WAKE_UP_SCREEN') {
      console.log('Wake-up signal received from service worker');
      
      // Try to wake up screen
      if (document.hidden) {
        window.focus();
      }
      
      // Trigger wake lock if available
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then((wakeLock) => {
          console.log('Wake lock acquired from service worker message');
          setTimeout(() => {
            wakeLock.release();
          }, 10000);
        }).catch((err) => {
          console.log('Wake lock from service worker failed:', err);
        });
      }
    }
  });
}

// Request notification permission on mobile
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}

// Handle visibility changes for background task management
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('App moved to background');
    // The background task will be started by the useSignalTracker hook
  } else {
    console.log('App returned to foreground');
    // Reload signals from storage to sync any changes made in background
    window.dispatchEvent(new CustomEvent('app-foreground'));
  }
});

// Listen for custom wake-up events
window.addEventListener('wakeup-screen', () => {
  console.log('Custom wake-up event received');
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then((wakeLock) => {
      console.log('Wake lock acquired from custom event');
      setTimeout(() => {
        wakeLock.release();
      }, 5000);
    }).catch((err) => {
      console.log('Wake lock from custom event failed:', err);
    });
  }
});

// Prevent zoom on mobile
document.addEventListener('touchstart', (event) => {
  if (event.touches.length > 1) {
    event.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

createRoot(document.getElementById("root")!).render(<App />);
