
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import { checkSignalTime } from './signalUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;
let isBackgroundTaskRunning = false;

export const startBackgroundTask = async () => {
  if (isBackgroundTaskRunning) {
    console.log('⚡ BackgroundTask: Already running, skipping start...');
    return;
  }

  try {
    // Request notification permissions first
    const permission = await LocalNotifications.requestPermissions();
    console.log('🔔 BackgroundTask: Notification permission:', permission);

    if (permission.display !== 'granted') {
      console.warn('⚠️ BackgroundTask: Notification permissions not granted');
      return;
    }

    isBackgroundTaskRunning = true;
    console.log('🚀 BackgroundTask: Started - using interval monitoring');
    
    // Start checking signals every second
    backgroundCheckInterval = setInterval(async () => {
      await checkSignalsInBackground();
    }, 1000);

  } catch (error) {
    console.error('❌ BackgroundTask: Failed to start:', error);
    isBackgroundTaskRunning = false;
  }
};

export const stopBackgroundTask = () => {
  if (backgroundCheckInterval) {
    clearInterval(backgroundCheckInterval);
    backgroundCheckInterval = undefined;
    isBackgroundTaskRunning = false;
    console.log('🛑 BackgroundTask: Stopped');
  }
};

const checkSignalsInBackground = async () => {
  try {
    // Load signals fresh each time for background checking (not for UI)
    const signals = loadSignalsFromStorage();
    const antidelaySeconds = loadAntidelayFromStorage();
    
    for (const signal of signals) {
      if (checkSignalTime(signal, antidelaySeconds)) {
        await triggerLocalNotification(signal);
        
        // Mark signal as triggered
        signal.triggered = true;
      }
    }
  } catch (error) {
    console.error('❌ BackgroundTask: Error checking signals:', error);
  }
};

const triggerLocalNotification = async (signal: Signal) => {
  try {
    // Use proper integer ID for notifications
    const notificationId = Math.floor(Math.random() * 1000000);
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: 'Binary Options Signal Alert!',
          body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
          id: notificationId,
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
    
    console.log('📱 BackgroundTask: Local notification scheduled for signal:', signal.timestamp);
  } catch (error) {
    console.error('❌ BackgroundTask: Failed to schedule local notification:', error);
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
            id: index + 1000, // Use safe integer IDs
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
      console.log(`📅 BackgroundTask: Scheduled ${notifications.length} notifications`);
    } else {
      console.log('📅 BackgroundTask: No future notifications to schedule');
    }
  } catch (error) {
    console.error('❌ BackgroundTask: Failed to schedule signal notifications:', error);
  }
};
