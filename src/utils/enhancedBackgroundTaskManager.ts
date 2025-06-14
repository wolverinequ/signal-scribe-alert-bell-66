
import { Signal } from '@/types/signal';
import { loadSignalsFromStorage, loadAntidelayFromStorage } from './signalStorage';
import ScreenWake from '@/plugins/ScreenWakePlugin';

let isInitialized = false;

export const initializeEnhancedBackgroundTasks = async () => {
  if (isInitialized) return;
  
  try {
    // Create notification channel
    await ScreenWake.createNotificationChannel();
    
    // Check and request permissions
    const batteryCheck = await ScreenWake.checkBatteryOptimization();
    if (batteryCheck.optimized) {
      console.log('Battery optimization is enabled - requesting exemption');
      await ScreenWake.requestBatteryOptimizationExemption();
    }
    
    const overlayCheck = await ScreenWake.checkOverlayPermission();
    if (!overlayCheck.granted) {
      console.log('Overlay permission not granted - requesting permission');
      await ScreenWake.requestOverlayPermission();
    }
    
    isInitialized = true;
    console.log('Enhanced background tasks initialized');
  } catch (error) {
    console.error('Failed to initialize enhanced background tasks:', error);
  }
};

export const scheduleEnhancedSignalAlarms = async (signals: Signal[]) => {
  try {
    const antidelaySeconds = loadAntidelayFromStorage();
    const now = new Date();
    
    for (const signal of signals) {
      if (signal.triggered) continue;
      
      const [hours, minutes] = signal.timestamp.split(':').map(Number);
      const signalTime = new Date();
      signalTime.setHours(hours, minutes, 0, 0);
      
      // Subtract antidelay seconds
      const alarmTime = new Date(signalTime.getTime() - (antidelaySeconds * 1000));
      
      // Only schedule if alarm time is in the future
      if (alarmTime > now) {
        await ScreenWake.scheduleAlarmNotification({
          id: Date.now() + Math.random(),
          title: '🚨 BINARY OPTIONS SIGNAL ALERT! 🚨',
          body: `${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
          timestamp: alarmTime.getTime(),
          wakeUp: true
        });
        
        console.log(`Scheduled enhanced alarm for ${signal.asset} at ${alarmTime}`);
      }
    }
  } catch (error) {
    console.error('Failed to schedule enhanced signal alarms:', error);
  }
};

export const triggerImmediateWakeUp = async (signal: Signal) => {
  try {
    console.log('Triggering immediate wake-up for signal:', signal);
    
    // Use native wake-up functionality
    const result = await ScreenWake.wakeUpScreen();
    
    if (result.success) {
      // Schedule immediate alarm notification
      await ScreenWake.scheduleAlarmNotification({
        id: Date.now(),
        title: '🚨 SIGNAL ALERT - WAKE UP! 🚨',
        body: `URGENT: ${signal.asset} - ${signal.direction} at ${signal.timestamp}`,
        timestamp: Date.now() + 1000, // 1 second from now
        wakeUp: true
      });
      
      console.log('Immediate wake-up triggered successfully');
      return true;
    } else {
      console.error('Native wake-up failed');
      return false;
    }
  } catch (error) {
    console.error('Failed to trigger immediate wake-up:', error);
    return false;
  }
};
