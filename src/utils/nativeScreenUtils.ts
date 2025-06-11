
import { Capacitor } from '@capacitor/core';

export const turnOffScreen = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      // For native platforms, we'll use a custom plugin or native code
      // This will need to be implemented in the native layer
      await (window as any).NativeScreenControl?.turnOffScreen();
      return true;
    } catch (error) {
      console.log('Native screen control not available:', error);
      return false;
    }
  } else {
    // Fallback for web - simulate screen off
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#000';
    
    setTimeout(() => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }, 1000);
    
    return false;
  }
};

export const requestWakeLockNative = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await (window as any).NativeScreenControl?.acquireWakeLock();
      return true;
    } catch (error) {
      console.log('Native wake lock not available:', error);
      return false;
    }
  }
  return false;
};

export const releaseWakeLockNative = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await (window as any).NativeScreenControl?.releaseWakeLock();
    } catch (error) {
      console.log('Native wake lock release failed:', error);
    }
  }
};
