
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      const lock = await navigator.wakeLock.request('screen');
      console.log('Screen wake lock acquired');
      return lock;
    } catch (err) {
      console.log('Wake lock not supported:', err);
      return null;
    }
  }
  return null;
};

export const releaseWakeLock = (wakeLock: WakeLockSentinel | null) => {
  if (wakeLock) {
    wakeLock.release();
    console.log('Screen wake lock released');
  }
};

// Additional wake-up methods for mobile devices
export const wakeUpScreen = async (): Promise<void> => {
  try {
    // Primary method: Request wake lock
    await requestWakeLock();
    
    // Secondary method: Try to focus window
    if (typeof window !== 'undefined') {
      window.focus();
      
      // Try to bring window to front on mobile
      if (document.hidden) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
    }
    
    // Tertiary method: Vibrate if supported (helps wake device)
    if ('vibrator' in navigator || 'vibrate' in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
    
    console.log('Screen wake-up methods executed');
  } catch (error) {
    console.error('Failed to wake up screen:', error);
  }
};
