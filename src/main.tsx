
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for background functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Request notification permission immediately
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().then((permission) => {
            console.log('Notification permission:', permission);
          });
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Enhanced page visibility handling for mobile
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('App went to background');
  } else {
    console.log('App came to foreground');
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
