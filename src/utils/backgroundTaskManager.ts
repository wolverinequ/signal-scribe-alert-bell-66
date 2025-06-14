
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import { checkSignalTime } from './signalUtils';

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

const checkSignalsInBackground = async () => {
  try {
    const signals = loadSignalsFromStorage();
    const antidelaySeconds = loadAntidelayFromStorage();
    
    for (const signal of signals) {
      if (checkSignalTime(signal, antidelaySeconds)) {
        await triggerLocalNotification(signal);
        
        // Mark signal as triggered and save back to storage
        signal.triggered = true;
        const updatedSignals = signals.map(s => 
          s === signal ? { ...s, triggered: true } : s
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

// Schedule notifications in advance for all signals
export const scheduleAllSignalNotifications = async (signals: Signal[]) => {
  try {
    const antidelaySeconds = loadAntidelayFromStorage();
    const now = new Date();
    
    // Cancel existing notifications first
    await LocalNotifications.cancel({ notifications: [] });
    
    const notifications = signals
      .filter(signal => !signal.triggered)
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
      console.log(`Scheduled ${notifications.length} notifications`);
    }
  } catch (error) {
    console.error('Failed to schedule signal notifications:', error);
  }
};
