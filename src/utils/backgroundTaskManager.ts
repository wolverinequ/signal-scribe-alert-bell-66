
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import { checkSignalTime, hasSignalTimePassed } from './signalUtils';
import { indexedDBManager } from './indexedDBUtils';
import { playCustomRingtoneWithWebAudio, createBeepAudio } from './audioUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;

export const startBackgroundTask = async () => {
  try {
    // Request notification permissions first
    const permission = await LocalNotifications.requestPermissions();
    console.log('Notification permission:', permission);

    if (permission.display !== 'granted') {
      console.warn('Notification permissions not granted');
      return;
    }

    console.log('Background task started - using interval monitoring');
    
    // Start checking signals every second
    backgroundCheckInterval = setInterval(async () => {
      await checkSignalsInBackground();
    }, 1000);

  } catch (error) {
    console.error('Failed to start background task:', error);
  }
};

export const stopBackgroundTask = () => {
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
    backgroundCheckInterval = undefined;
    console.log('Background task stopped');
  }
};

const playBackgroundAudio = async (signal: Signal) => {
  try {
    console.log('🔔 BackgroundTask: Playing audio for signal in background');
    
    // Initialize IndexedDB if needed
    await indexedDBManager.init();
    
    // Try to get custom ringtone from IndexedDB
    const customRingtone = await indexedDBManager.getRingtone();
    
    if (customRingtone) {
      console.log('🔔 BackgroundTask: Custom ringtone found, playing with Web Audio API');
      await playCustomRingtoneWithWebAudio(customRingtone);
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
    // Use cached data to avoid repeated localStorage reads
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
        // Play background audio first
        await playBackgroundAudio(signal);
        
        // Then trigger notification
        await triggerLocalNotification(signal);
        
        // Mark signal as triggered and save back to storage
        signal.triggered = true;
        const updatedSignals = signals.map(s => 
          s.timestamp === signal.timestamp ? { ...s, triggered: true } : s
        );
        // Note: We can't import saveSignalsToStorage here due to circular dependency
        // The signal will be marked as triggered when app returns to foreground
      }
    }
  } catch (error) {
    console.error('Error checking signals in background:', error);
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
    
    console.log('Local notification scheduled for signal:', signal);
  } catch (error) {
    console.error('Failed to schedule local notification:', error);
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
      console.log(`Scheduled ${notifications.length} notifications for future signals`);
    } else {
      console.log('No future signals to schedule notifications for');
    }
  } catch (error) {
    console.error('Failed to schedule signal notifications:', error);
  }
};
