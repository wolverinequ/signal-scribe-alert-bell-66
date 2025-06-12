
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';

export const triggerAndroidScreenWake = async (): Promise<boolean> => {
  console.log('🤖 Starting Android-specific screen wake sequence');
  
  try {
    // Check if we're on Android native platform
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      console.log('📱 Native Android detected - Using Capacitor wake methods');
      
      // Schedule immediate local notification with highest priority
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🚨 TRADING SIGNAL ALERT! 🚨',
            body: 'URGENT: Check your trading signals NOW!',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) }, // 100ms delay
            sound: 'default',
            attachments: [],
            actionTypeId: 'WAKE_ACTION',
            extra: {
              wake: true,
              urgent: true
            }
          }
        ]
      });
      
      // Get device info for wake optimization
      const deviceInfo = await Device.getInfo();
      console.log('📱 Device info for wake:', deviceInfo);
      
      return true;
    } else {
      console.log('🌐 Web platform detected - Using web wake methods');
      return false;
    }
  } catch (error) {
    console.error('❌ Android wake failed:', error);
    return false;
  }
};

export const sendWakeMessageToServiceWorker = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    console.log('📡 Sending wake message to service worker');
    navigator.serviceWorker.controller.postMessage({
      type: 'TRIGGER_WAKE_NOTIFICATION',
      timestamp: Date.now(),
      source: 'main_app'
    });
  }
};

export const requestAndroidPermissions = async () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    try {
      console.log('🔐 Requesting Android permissions for wake functionality');
      
      // Request local notifications permission
      const notificationPermission = await LocalNotifications.requestPermissions();
      console.log('🔔 Notification permission:', notificationPermission);
      
      return notificationPermission;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return null;
    }
  }
  return null;
};
