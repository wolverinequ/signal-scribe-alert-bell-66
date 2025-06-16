
import { LocalNotifications } from '@capacitor/local-notifications';
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import { checkSignalTime } from './signalUtils';

let backgroundCheckInterval: NodeJS.Timeout | undefined;
let isBackgroundTaskRunning = false;

// Cache signals and antidelay to avoid repeated storage reads
let cachedSignals: Signal[] = [];
let cachedAntidelaySeconds = 15;
let lastStorageLoadTime = 0;
const CACHE_DURATION = 5000; // Cache for 5 seconds

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
    
    // Load initial cache
    refreshCache();
    
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

const refreshCache = () => {
  const now = Date.now();
  if (now - lastStorageLoadTime > CACHE_DURATION) {
    cachedSignals = loadSignalsFromStorage();
    cachedAntidelaySeconds = loadAntidelayFromStorage();
    lastStorageLoadTime = now;
    console.log('🔄 BackgroundTask: Cache refreshed - signals:', cachedSignals.length, 'antidelay:', cachedAntidelaySeconds);
  }
};

const checkSignalsInBackground = async () => {
  try {
    // Refresh cache periodically instead of loading every second
    refreshCache();
    
    for (const signal of cachedSignals) {
      if (checkSignalTime(signal, cachedAntidelaySeconds)) {
        await triggerLocalNotification(signal);
        
        // Mark signal as triggered in cache
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
    
    const notifications = [];
    
    for (let index = 0; index < signals.length; index++) {
      const signal = signals[index];
      
      if (signal.triggered) continue;
      
      const [hours, minutes] = signal.timestamp.split(':').map(Number);
      const signalTime = new Date();
      signalTime.setHours(hours, minutes, 0, 0);
      
      // Subtract antidelay seconds
      const notificationTime = new Date(signalTime.getTime() - (antidelaySeconds * 1000));
      
      // Only schedule if notification time is in the future
      if (notificationTime > now) {
        notifications.push({
          title: 'Binary Options Signal Alert!',
          body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
          id: index + 1000, // Use safe integer IDs starting from 1000
          schedule: { at: notificationTime },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: {
            signal: JSON.stringify(signal)
          }
        });
      }
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({
        notifications: notifications
      });
      console.log(`📅 BackgroundTask: Scheduled ${notifications.length} notifications`);
    } else {
      console.log('📅 BackgroundTask: No future notifications to schedule');
    }
  } catch (error) {
    console.error('❌ BackgroundTask: Failed to schedule signal notifications:', error);
  }
};

// Function to refresh cache when signals are updated externally
export const refreshSignalCache = () => {
  lastStorageLoadTime = 0; // Force cache refresh on next check
  refreshCache();
};
