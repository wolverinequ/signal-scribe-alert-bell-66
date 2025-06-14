
// Signal checking and processing logic
import { getStoredSignals, getStoredAntidelay, updateStoredSignals } from './sw-storage.js';
import { showWakeUpNotification } from './sw-notifications.js';

export function shouldTriggerSignal(signal, antidelaySeconds, now) {
  if (signal.triggered) return false;
  
  const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
  const signalDate = new Date();
  signalDate.setHours(signalHours, signalMinutes, 0, 0);
  
  // Subtract antidelay seconds
  const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
  
  // Check if current time matches target time (within 1 second tolerance)
  const timeDiff = Math.abs(now.getTime() - targetTime.getTime());
  return timeDiff < 1000;
}

export async function checkSignals() {
  try {
    console.log('Checking signals in service worker');
    
    const signals = await getStoredSignals();
    const antidelaySeconds = await getStoredAntidelay();
    
    if (!signals || signals.length === 0) {
      console.log('No signals found in storage');
      return;
    }
    
    const now = new Date();
    
    for (const signal of signals) {
      if (shouldTriggerSignal(signal, antidelaySeconds, now)) {
        await showWakeUpNotification(signal);
        signal.triggered = true;
        await updateStoredSignals(signals);
      }
    }
  } catch (error) {
    console.error('Error checking signals in service worker:', error);
  }
}

export function setupSyncHandler() {
  self.addEventListener('sync', (event) => {
    if (event.tag === 'signal-check') {
      event.waitUntil(checkSignals());
    }
  });
}
