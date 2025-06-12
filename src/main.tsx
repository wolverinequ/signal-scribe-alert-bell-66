
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for background functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Request notification permission on mobile with enhanced priority
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission:', permission);
    if (permission === 'granted') {
      console.log('✅ Notifications enabled - Screen wake alerts will work');
    } else {
      console.log('❌ Notifications denied - Screen wake may not work properly');
    }
  });
}

// Request wake lock permission (will be granted automatically on user interaction)
if ('wakeLock' in navigator) {
  console.log('✅ Wake Lock API is supported - Screen will stay awake during alerts');
} else {
  console.log('❌ Wake Lock API not supported - Screen may turn off during alerts');
}

// Log available mobile wake features (removed vibration)
console.log('Mobile wake features available:', {
  wakeLock: 'wakeLock' in navigator,
  notifications: 'Notification' in window,
  serviceWorker: 'serviceWorker' in navigator,
  fullscreen: 'requestFullscreen' in document.documentElement
});

// Enhanced screen wake on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Page became visible - Screen wake successful');
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
