
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced service worker registration with retry mechanism
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('SW registered successfully:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
              // Auto-update the service worker
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
      
      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
        window.location.reload();
      });
      
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      // Retry after 5 seconds
      setTimeout(registerServiceWorker, 5000);
    }
  }
};

// Enhanced notification permission request
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        console.log('Notifications enabled for background alerts');
        
        // Show a test notification to ensure it works
        new Notification('Signal Tracker Ready', {
          body: 'Background notifications are now enabled',
          icon: '/placeholder.svg',
          silent: true
        });
      } else {
        console.warn('Notification permission denied - background alerts may not work');
      }
    }
  }
};

// Initialize everything
const initializeApp = async () => {
  // Register service worker first
  await registerServiceWorker();
  
  // Then request notification permission
  await requestNotificationPermission();
  
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
  
  console.log('App initialization complete');
};

// Start initialization
initializeApp();

createRoot(document.getElementById("root")!).render(<App />);
