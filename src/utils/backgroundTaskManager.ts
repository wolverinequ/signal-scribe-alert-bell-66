
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import { checkSignalTime } from './signalUtils';
import { wakeUpScreen } from './wakeLockUtils';

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
        await triggerWakeUpNotification(signal);
        
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

const triggerWakeUpNotification = async (signal: Signal) => {
  try {
    // Attempt to wake up screen first
    await wakeUpScreen();
    
    // Schedule high-priority wake-up notification
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '🚨 BINARY OPTIONS SIGNAL ALERT! 🚨',
          body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
          id: Date.now(),
          schedule: { at: new Date() },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            signal: JSON.stringify(signal),
            wakeup: true,
            priority: 'max',
            category: 'alarm',
            importance: 'max',
            ongoing: true,
            fullScreenIntent: true,
            showWhen: true,
            autoCancel: false,
            vibrate: true,
            lights: true,
            lightColor: '#FF0000'
          }
        }
      ]
    });
    
    // Add multiple notification attempts for better wake-up reliability
    setTimeout(async () => {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '⚠️ URGENT: Signal Alert Repeat ⚠️',
            body: `REMINDER: ${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
            id: Date.now() + 1,
            schedule: { at: new Date() },
            sound: 'default',
            attachments: undefined,
            actionTypeId: '',
            extra: {
              signal: JSON.stringify(signal),
              wakeup: true,
              priority: 'max',
              category: 'alarm',
              repeat: true
            }
          }
        ]
      });
    }, 2000);
    
    console.log('Wake-up notification with enhanced properties scheduled for signal:', signal);
  } catch (error) {
    console.error('Failed to schedule wake-up notification:', error);
  }
};

// Schedule notifications in advance for all signals with enhanced wake-up properties
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
            title: '🚨 BINARY OPTIONS SIGNAL ALERT! 🚨',
            body: `GET READY: ${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
            id: index + 1,
            schedule: { at: notificationTime },
            sound: 'default',
            attachments: undefined,
            actionTypeId: 'view-signal',
            extra: {
              signal: JSON.stringify(signal),
              wakeup: true,
              priority: 'max',
              category: 'alarm',
              importance: 'max',
              ongoing: true,
              fullScreenIntent: true,
              showWhen: true,
              autoCancel: false,
              vibrate: true,
              lights: true,
              lightColor: '#FF0000',
              largeIcon: 'ic_large_icon',
              bigText: `URGENT: ${signal.asset} ${signal.direction} signal at ${signal.timestamp}. Prepare your trade!`
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
      console.log(`Scheduled ${notifications.length} enhanced wake-up notifications`);
    }
  } catch (error) {
    console.error('Failed to schedule signal notifications:', error);
  }
};
