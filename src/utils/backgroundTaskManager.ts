
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage, saveSignalsToStorage } from './signalStorage';
import { checkSignalTime, hasSignalTimePassed } from './signalUtils';
import { indexedDBManager } from './indexedDBUtils';
import { playCustomRingtoneWithWebAudio, createBeepAudio } from './audioUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;
let ringManagerCallback: ((signal: Signal) => void) | null = null;
let backgroundTaskRunning = false;
let lastSignalCheckTime = 0;

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

// Setup event-driven communication with UI (Step 4: reduce logging)
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
  // Prevent multiple instances (Step 1 & 4 fix)
  if (backgroundTaskRunning) {
    console.log('🎯 BackgroundTask: Already running, skipping start');
    return;
  }

  try {
    // Setup event communication first
    setupEventCommunication();

    // Request notification permissions first
    const permission = await LocalNotifications.requestPermissions();
    console.log('🎯 BackgroundTask: Notification permission:', permission.display);

    if (permission.display !== 'granted') {
      console.warn('🎯 BackgroundTask: Notification permissions not granted');
    }

    console.log('🎯 BackgroundTask: Starting unified background monitoring');
    
    // Stop any existing interval first (cleanup)
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
    }
    
    backgroundTaskRunning = true;
    
    // Start checking signals every second - ALWAYS ACTIVE (Step 3: signal detection)
    backgroundCheckInterval = setInterval(async () => {
      const currentTime = Date.now();
      lastSignalCheckTime = currentTime;
      
      // Debug logging to verify execution (Step 3)
      if (currentTime % 10000 < 1000) { // Log every 10 seconds to reduce spam
        console.log('🎯 BackgroundTask: Active - checking signals at', new Date().toLocaleTimeString());
      }
      
      await checkSignalsInBackground();
    }, 1000);

    // Failsafe mechanism - check if interval is still running every 30 seconds (Step 3)
    setInterval(() => {
      const timeSinceLastCheck = Date.now() - lastSignalCheckTime;
      if (timeSinceLastCheck > 5000) { // If no check in 5 seconds, restart
        console.warn('🎯 BackgroundTask: Failsafe triggered - restarting signal checking');
        if (backgroundCheckInterval) {
          clearInterval(backgroundCheckInterval);
        }
        // Restart the interval
        backgroundCheckInterval = setInterval(async () => {
          lastSignalCheckTime = Date.now();
          await checkSignalsInBackground();
        }, 1000);
      }
    }, 30000);

    console.log('🎯 BackgroundTask: Unified background monitoring started');

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
    
    // Debug logging for signal checking (Step 3)
    if (futureSignals.length > 0) {
      const currentTime = new Date().toLocaleTimeString();
      // Reduce logging frequency (Step 4)
      if (Date.now() % 30000 < 1000) { // Log every 30 seconds
        console.log('🎯 BackgroundTask: Checking', futureSignals.length, 'future signals at', currentTime);
      }
    }
    
    for (const signal of futureSignals) {
      if (checkSignalTime(signal, antidelaySeconds)) {
        console.log('🎯 BackgroundTask: Signal time matched!', signal.timestamp);
        
        // Play audio first
        await playBackgroundAudio(signal);
        
        // Then trigger notification
        await triggerLocalNotification(signal);
        
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
        
        console.log('🎯 BackgroundTask: Signal processed and UI notified');
      }
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Error checking signals:', error);
  }
};

const triggerLocalNotification = async (signal: Signal) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Binary Options Signal Alert!',
          body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
          id: Date.now(),
          schedule: { at: new Date() },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            signal: JSON.stringify(signal)
          }
        }
      ]
    });
    
    console.log('🎯 BackgroundTask: Local notification scheduled');
  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to schedule notification:', error);
  }
};

// Fixed notification scheduling format (Step 2 from plan)
export const scheduleAllSignalNotifications = async (signals: Signal[]) => {
  try {
    const antidelaySeconds = loadAntidelayFromStorage();
    const now = new Date();
    
    // Cancel existing notifications first
    await LocalNotifications.cancel({ notifications: [] });
    
    // Only schedule for future signals that haven't been triggered
    const futureSignals = signals.filter(signal => {
      const isPast = hasSignalTimePassed(signal, antidelaySeconds);
      return !isPast && !signal.triggered;
    });
    
    const notifications = futureSignals
      .map((signal, index) => {
        const [hours, minutes] = signal.timestamp.split(':').map(Number);
        const signalTime = new Date();
        signalTime.setHours(hours, minutes, 0, 0);
        
        // Subtract antidelay seconds
        const notificationTime = new Date(signalTime.getTime() - (antidelaySeconds * 1000));
        
        // Only schedule if notification time is in the future
        if (notificationTime > now) {
          return {
            title: 'Binary Options Signal Alert!',
            body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
            id: index + 1,
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              signal: JSON.stringify(signal)
            }
          };
        }
        return null;
      })
      .filter(notification => notification !== null);

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications: notifications as any[]
      });
      console.log(`🎯 BackgroundTask: Scheduled ${notifications.length} notifications`);
    } else {
      console.log('🎯 BackgroundTask: No future signals to schedule');
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to schedule notifications:', error);
  }
};
