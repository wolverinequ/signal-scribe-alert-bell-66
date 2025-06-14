
// Service Worker for background notifications and mobile support
let savedSignals = [];
let customRingtone = null;
let antidelaySeconds = 15;
let lastCheckTime = 0;

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'UPDATE_SIGNALS':
      savedSignals = data.signals || [];
      antidelaySeconds = data.antidelaySeconds || 15;
      lastCheckTime = Date.now();
      console.log('Updated signals in SW:', savedSignals.length);
      // Reset all triggered flags when new signals are loaded
      savedSignals = savedSignals.map(s => ({ ...s, triggered: false }));
      break;
    case 'UPDATE_RINGTONE':
      customRingtone = data.ringtone;
      break;
    case 'CLEAR_SIGNALS':
      savedSignals = [];
      customRingtone = null;
      console.log('Cleared signals in SW');
      break;
  }
});

// Background sync for signal monitoring
self.addEventListener('sync', (event) => {
  if (event.tag === 'signal-check') {
    event.waitUntil(checkSignals());
  }
});

// Enhanced periodic check with multiple timing mechanisms
function startPeriodicCheck() {
  // Primary interval - runs every second when possible
  setInterval(() => {
    if (savedSignals.length > 0) {
      checkSignals();
    }
  }, 1000);
  
  // Backup interval - runs every 5 seconds as fallback
  setInterval(() => {
    if (savedSignals.length > 0) {
      checkSignalsWithCatchup();
    }
  }, 5000);
  
  // Long-term backup - runs every 30 seconds for very long screen-off periods
  setInterval(() => {
    if (savedSignals.length > 0) {
      checkSignalsWithCatchup();
    }
  }, 30000);
}

// Start the periodic checks
startPeriodicCheck();

function checkSignals() {
  const now = new Date();
  const currentTime = now.getTime();
  lastCheckTime = currentTime;
  
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  savedSignals.forEach((signal, index) => {
    if (signal.triggered) return;
    
    const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
    
    // Calculate target time with antidelay
    const signalDate = new Date();
    signalDate.setHours(signalHours, signalMinutes, 0, 0);
    const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
    const targetHours = targetTime.getHours();
    const targetMinutes = targetTime.getMinutes();
    const targetSeconds = targetTime.getSeconds();
    
    // Check if current time matches target time (exact match)
    if (currentHours === targetHours && 
        currentMinutes === targetMinutes && 
        currentSeconds === targetSeconds) {
      
      triggerSignal(signal, index);
    }
  });
}

function checkSignalsWithCatchup() {
  const now = new Date();
  const currentTime = now.getTime();
  
  // If we haven't checked in a while, check for missed signals
  const timeSinceLastCheck = currentTime - lastCheckTime;
  if (timeSinceLastCheck > 10000) { // More than 10 seconds
    console.log('Checking for missed signals due to long gap:', timeSinceLastCheck);
    
    savedSignals.forEach((signal, index) => {
      if (signal.triggered) return;
      
      const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
      
      // Calculate target time with antidelay
      const signalDate = new Date();
      signalDate.setHours(signalHours, signalMinutes, 0, 0);
      const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
      
      // Check if target time has passed (with some tolerance for missed signals)
      const timeDiff = currentTime - targetTime.getTime();
      
      // If target time was within the last 2 minutes and we missed it, trigger it now
      if (timeDiff > 0 && timeDiff < 120000) { // Within last 2 minutes
        console.log('Triggering missed signal:', signal);
        triggerSignal(signal, index);
      }
    });
  }
  
  lastCheckTime = currentTime;
  
  // Also do regular check
  checkSignals();
}

function triggerSignal(signal, index) {
  // Mark as triggered
  savedSignals[index].triggered = true;
  
  // Show notification that will play sound
  self.registration.showNotification('Signal Alert', {
    body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
    icon: '/placeholder.svg',
    tag: `signal-notification-${Date.now()}`, // Unique tag to allow multiple notifications
    requireInteraction: true,
    silent: false, // This ensures sound plays
    actions: [
      { action: 'dismiss', title: 'Dismiss' }
    ]
  });
  
  console.log('Signal triggered:', signal);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Handle push events for additional reliability
self.addEventListener('push', (event) => {
  console.log('Push event received');
  if (savedSignals.length > 0) {
    event.waitUntil(checkSignalsWithCatchup());
  }
});
