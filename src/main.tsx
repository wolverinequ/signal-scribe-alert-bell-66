import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSignalServiceWorker } from './utils/serviceWorkerUtils'

// Register enhanced service worker for signal tracking and communication
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Signal Tracker SW registered: ', registration);
        registerSignalServiceWorker();
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Request notification permission for inter-app communication
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission().then((permission) => {
    console.log('Notification permission for inter-app communication:', permission);
  });
}

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
