
import { registerPlugin } from '@capacitor/core';

export interface ScreenWakePlugin {
  wakeUpScreen(): Promise<{ success: boolean }>;
  requestBatteryOptimizationExemption(): Promise<{ granted: boolean }>;
  checkBatteryOptimization(): Promise<{ optimized: boolean }>;
  requestOverlayPermission(): Promise<{ granted: boolean }>;
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  createNotificationChannel(): Promise<{ success: boolean }>;
  scheduleAlarmNotification(options: {
    id: number;
    title: string;
    body: string;
    timestamp: number;
    wakeUp: boolean;
  }): Promise<{ success: boolean }>;
}

const ScreenWake = registerPlugin<ScreenWakePlugin>('ScreenWake', {
  web: {
    async wakeUpScreen() {
      // Web fallback - limited effectiveness
      try {
        if ('wakeLock' in navigator) {
          const wakeLock = await navigator.wakeLock.request('screen');
          setTimeout(() => wakeLock.release(), 5000);
        }
        
        // Vibration for web
        if ('vibrate' in navigator) {
          navigator.vibrate([1000, 500, 1000, 500, 1000]);
        }
        
        // Flash screen
        if (document.body) {
          const originalFilter = document.body.style.filter;
          document.body.style.filter = 'brightness(2)';
          setTimeout(() => {
            document.body.style.filter = 'brightness(0.5)';
            setTimeout(() => {
              document.body.style.filter = originalFilter;
            }, 200);
          }, 200);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Web wake-up failed:', error);
        return { success: false };
      }
    },
    
    async requestBatteryOptimizationExemption() {
      console.log('Battery optimization exemption not available on web');
      return { granted: false };
    },
    
    async checkBatteryOptimization() {
      return { optimized: false };
    },
    
    async requestOverlayPermission() {
      console.log('Overlay permission not available on web');
      return { granted: false };
    },
    
    async checkOverlayPermission() {
      return { granted: false };
    },
    
    async createNotificationChannel() {
      console.log('Notification channel creation not needed on web');
      return { success: true };
    },
    
    async scheduleAlarmNotification(options) {
      console.log('Scheduling web notification:', options);
      
      if ('Notification' in window && Notification.permission === 'granted') {
        const delay = options.timestamp - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            new Notification(options.title, {
              body: options.body,
              icon: '/placeholder.svg',
              requireInteraction: true,
              tag: `alarm-${options.id}`
            });
          }, delay);
          return { success: true };
        }
      }
      
      return { success: false };
    }
  }
});

export default ScreenWake;
