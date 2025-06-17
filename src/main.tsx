
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SessionManager } from './utils/sessionManager'

// Initialize session management
console.log('🚀 App: Initializing session management');
const isFreshLaunch = SessionManager.isFreshLaunch();
console.log('🚀 App: Fresh launch status:', isFreshLaunch);

if (isFreshLaunch) {
  console.log('🚀 App: Fresh launch detected - app will start clean');
} else {
  console.log('🚀 App: Returning from background - preserving state');
}

// Mark session as active
SessionManager.markSessionActive();

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

// Request notification permission on mobile
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
  });
}

// Handle visibility changes for background task management
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('🚀 App: App moved to background');
    // The background task will be started by the useSignalTracker hook
  } else {
    console.log('🚀 App: App returned to foreground');
    // Mark session as active when returning from background
    SessionManager.markSessionActive();
    // Reload signals from storage to sync any changes made in background
    window.dispatchEvent(new CustomEvent('app-foreground'));
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
