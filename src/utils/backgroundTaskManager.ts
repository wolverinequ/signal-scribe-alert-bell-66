import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage, saveSignalsToStorage } from './signalStorage';
import { checkSignalTime, hasSignalTimePassed } from './signalUtils';
import { indexedDBManager } from './indexedDBUtils';
import { playCustomRingtoneWithWebAudio, createBeepAudio } from './audioUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;
let ringManagerCallback: ((signal: Signal) => void) | null = null;

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

export const startBackgroundTask = async () => {
  try {
    // Request notification permissions first
    const permission = await LocalNotifications.requestPermissions();
    console.log('🎯 BackgroundTask: Notification permission:', permission);

    if (permission.display !== 'granted') {
      console.warn('🎯 BackgroundTask: Notification permissions not granted');
    }

    console.log('🎯 BackgroundTask: Starting unified background monitoring (always active)');
    
    // Stop any existing interval first
    if (backgroundCheckInterval) {
      clearInterval(backgroundCheckInterval);
    }
    
    // Start checking signals every second - ALWAYS ACTIVE regardless of app visibility
    backgroundCheckInterval = setInterval(async () => {
      await checkSignalsInBackground();
    }, 1000);

    console.log('🎯 BackgroundTask: Unified background monitoring started');

  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to start unified background task:', error);
  }
};

export const stopBackgroundTask = () => {
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
    backgroundCheckInterval = undefined;
    console.log('🎯 BackgroundTask: Unified background task stopped');
  }
};

const playBackgroundAudio = async (signal: Signal) => {
  try {
    console.log('🔔 BackgroundTask: Playing audio for signal in unified system');
    
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
      console.log('🔔 BackgroundTask: Custom ringtone ArrayBuffer found, playing with Web Audio API');
      await playCustomRingtoneWithWebAudio('custom', undefined);
    } else {
      console.log('🔔 BackgroundTask: No custom ringtone, playing default beep');
      createBeepAudio();
    }
  } catch (error) {
    console.error('🔔 BackgroundTask: Error playing audio:', error);
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
    
    for (const signal of futureSignals) {
      if (checkSignalTime(signal, antidelaySeconds)) {
        console.log('🎯 BackgroundTask: Signal time matched in unified system:', signal);
        
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
        
        console.log('🎯 BackgroundTask: Signal marked as triggered and saved');
      }
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Error checking signals in unified system:', error);
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
    
    console.log('🎯 BackgroundTask: Local notification scheduled for signal:', signal);
  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to schedule local notification:', error);
  }
};

// Schedule notifications in advance for future signals only
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
      .filter(Boolean);

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications: notifications as any[]
      });
      console.log(`🎯 BackgroundTask: Scheduled ${notifications.length} notifications for future signals`);
    } else {
      console.log('🎯 BackgroundTask: No future signals to schedule notifications for');
    }
  } catch (error) {
    console.error('🎯 BackgroundTask: Failed to schedule signal notifications:', error);
  }
};
