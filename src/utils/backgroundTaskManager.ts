import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage, saveSignalsToStorage } from './signalStorage';
import { checkSignalTime, hasSignalTimePassed } from './signalUtils';
import { indexedDBManager } from './indexedDBUtils';
import { playCustomRingtoneWithWebAudio, createBeepAudio } from './audioUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;
let ringManagerCallback: ((signal: Signal) => void) | null = null;
let backgroundTaskRunning = false;
let lastSignalCheckTime = 0;
let intervalCounter = 0;

// Register ring manager callback for direct communication
export const registerRingManagerCallback = (callback: (signal: Signal) => void) => {
  ringManagerCallback = callback;
  console.log('🎯 BackgroundTask: Ring manager callback registered');
};

// Unregister callback
export const unregisterRingManagerCallback = () => {
  ringManagerCallback = null;
  console.log('🎯 BackgroundTask: Ring manager callback unregistered');
};

// Setup event-driven communication with UI
const setupEventCommunication = () => {
  // Listen for UI signal updates
  window.addEventListener('ui-signals-updated', (event: CustomEvent) => {
    const updatedSignals = event.detail;
    console.log('🎯 BackgroundTask: UI signals update received:', updatedSignals.length);
  });

  // Listen for UI signal triggered events
  window.addEventListener('ui-signal-triggered', (event: CustomEvent) => {
    const triggeredSignal = event.detail;
    console.log('🎯 BackgroundTask: UI signal triggered event received');
  });
};

export const startBackgroundTask = async () => {
  // Prevent multiple instances
  if (backgroundTaskRunning) {
    console.log('🎯 BackgroundTask: Already running, skipping start');
    return;
  }

  try {
    // Setup event communication first
    setupEventCommunication();

    console.log('🎯 BackgroundTask: Starting unified background monitoring (audio only)');
    
    // Stop any existing interval first (cleanup)
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
    }
    
    backgroundTaskRunning = true;
    intervalCounter = 0;
    
    // Start checking signals every 1000ms (1 second)
    backgroundCheckInterval = setInterval(async () => {
      const currentTime = Date.now();
      lastSignalCheckTime = currentTime;
      intervalCounter++;
      
      // Heartbeat logging every 30 seconds to reduce console spam
      if (intervalCounter % 30 === 0) {
        console.log(`🎯 BackgroundTask: Active - checking signals at ${new Date().toLocaleTimeString()} (heartbeat #${intervalCounter})`);
      }
      
      await checkSignalsInBackground();
    }, 1000);

    // Failsafe mechanism - check if interval is still running every 30 seconds
    setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastSignalCheckTime;
      if (timeSinceLastCheck > 3000) { // If no check in 3 seconds, restart
        console.warn('🎯 BackgroundTask: Failsafe triggered - restarting signal checking');
        if (backgroundCheckInterval) {
          clearInterval(backgroundCheckInterval);
        }
        // Restart the interval
        intervalCounter = 0;
        backgroundCheckInterval = setInterval(async () => {
          lastSignalCheckTime = Date.now();
          intervalCounter++;
          await checkSignalsInBackground();
        }, 1000);
      }
    }, 30000);

    console.log('🎯 BackgroundTask: Unified background monitoring started (audio only)');

  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to start:', error);
    backgroundTaskRunning = false;
  }
};

export const stopBackgroundTask = () => {
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
    backgroundCheckInterval = undefined;
  }
  backgroundTaskRunning = false;
  console.log('🎯 BackgroundTask: Unified background task stopped');
};

const playBackgroundAudio = async (signal: Signal) => {
  try {
    // If we have a ring manager callback (app is visible), use it for better UI integration
    if (ringManagerCallback) {
      console.log('🔔 BackgroundTask: Using ring manager callback for foreground audio');
      ringManagerCallback(signal);
      return;
    }
    
    // Otherwise use background audio system
    console.log('🔔 BackgroundTask: Using background audio system');
    
    // Initialize IndexedDB if needed
    await indexedDBManager.init();
    
    // Try to get custom ringtone ArrayBuffer from IndexedDB directly
    const customRingtoneArrayBuffer = await indexedDBManager.getRingtoneAsArrayBuffer();
    
    if (customRingtoneArrayBuffer) {
      console.log('🔔 BackgroundTask: Playing custom ringtone');
      await playCustomRingtoneWithWebAudio('custom', undefined);
    } else {
      console.log('🔔 BackgroundTask: Playing default beep');
      createBeepAudio();
    }
  } catch (error) {
    console.error('🔔 BackgroundTask: Audio error:', error);
    // Fallback to default beep on any error
    createBeepAudio();
  }
};

const checkSignalsInBackground = async () => {
  try {
    // Load current signals and settings
    const signals = loadSignalsFromStorage();
    const antidelaySeconds = loadAntidelayFromStorage();
    
    // Only check future signals that haven't been triggered
    const futureSignals = signals.filter(signal => {
      const isPast = hasSignalTimePassed(signal, antidelaySeconds);
      const isTriggered = signal.triggered;
      return !isPast && !isTriggered;
    });
    
    // Enhanced debug logging every 30 seconds to reduce spam
    if (intervalCounter % 30 === 0 && futureSignals.length > 0) {
      console.log(`🎯 BackgroundTask: Checking ${futureSignals.length} future signals at ${new Date().toLocaleTimeString()}`);
    }
    
    for (const signal of futureSignals) {
      if (checkSignalTime(signal, antidelaySeconds)) {
        console.log('🔔 BackgroundTask: Signal time matched! Triggering audio:', signal.timestamp);
        
        // Play audio only (no notifications)
        await playBackgroundAudio(signal);
        
        // Mark signal as triggered and save back to storage immediately
        signal.triggered = true;
        const updatedSignals = signals.map(s => 
          s.timestamp === signal.timestamp ? { ...s, triggered: true } : s
        );
        saveSignalsToStorage(updatedSignals);
        
        // Dispatch event to notify UI about triggered signal
        window.dispatchEvent(new CustomEvent('signal-triggered', { 
          detail: signal 
        }));
        
        // Dispatch event to notify UI about updated signals
        window.dispatchEvent(new CustomEvent('signals-updated', { 
          detail: updatedSignals 
        }));
        
        console.log('🔔 BackgroundTask: Signal processed and UI notified (audio only)');
      }
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Error checking signals:', error);
  }
};

// Remove all notification-related functions - keeping only the stub for compatibility
export const scheduleAllSignalNotifications = async (signals: Signal[]) => {
  // Notification scheduling disabled - audio-only mode
  console.log('🎯 BackgroundTask: Notification scheduling disabled (audio-only mode)');
};
