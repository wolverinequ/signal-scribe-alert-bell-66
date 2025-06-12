
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { LocalNotifications } from '@capacitor/local-notifications';

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

// Enhanced Android-specific initialization
const initializeAndroidWakeFeatures = async () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    console.log('🤖 Initializing Android-specific wake features');
    
    try {
      // Request local notification permissions for Android
      await LocalNotifications.requestPermissions();
      
      // Listen for app state changes to handle wake events
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('📱 App became active - Wake successful');
          // Notify the app that it's now active
          window.dispatchEvent(new CustomEvent('app-wake-success'));
        }
      });

      // Get device info to optimize wake strategy
      const info = await Device.getInfo();
      console.log('📱 Device platform:', info.platform, 'OS Version:', info.osVersion);
      
    } catch (error) {
      console.log('Android wake features initialization failed:', error);
    }
  }
};

// Initialize Android features
initializeAndroidWakeFeatures();

// Request notification permission with enhanced priority for Android
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

// Log available mobile wake features
console.log('Mobile wake features available:', {
  wakeLock: 'wakeLock' in navigator,
  notifications: 'Notification' in window,
  serviceWorker: 'serviceWorker' in navigator,
  fullscreen: 'requestFullscreen' in document.documentElement,
  capacitor: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform()
});

// Enhanced screen wake on page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Page became visible - Screen wake successful');
    // Dispatch custom event for app components
    window.dispatchEvent(new CustomEvent('screen-wake-success'));
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
