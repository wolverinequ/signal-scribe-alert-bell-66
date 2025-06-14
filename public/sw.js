
// Service Worker for background notifications and mobile support
let savedSignals = [];
let customRingtone = null;
let antidelaySeconds = 15;

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
      console.log('Updated signals in SW:', savedSignals.length);
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

// Periodic background check
setInterval(() => {
  if (savedSignals.length > 0) {
    checkSignals();
  }
}, 1000);

function checkSignals() {
  const now = new Date();
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
    
    // Check if current time matches target time
    if (currentHours === targetHours && 
        currentMinutes === targetMinutes && 
        currentSeconds === targetSeconds) {
      
      // Mark as triggered
      savedSignals[index].triggered = true;
      
      // Show notification that will play sound
      self.registration.showNotification('Signal Alert', {
        body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
        icon: '/placeholder.svg',
        tag: 'signal-notification',
        requireInteraction: true,
        silent: false // This ensures sound plays
      });
      
      console.log('Signal triggered in background:', signal);
    }
  });
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
