
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

// Enhanced wake-up methods specifically for mobile devices when screen is off
export const wakeUpScreen = async (): Promise<void> => {
  try {
    // Method 1: Request wake lock (works when app is in foreground)
    await requestWakeLock();
    
    // Method 2: Try to focus window and bring to foreground
    if (typeof window !== 'undefined') {
      window.focus();
      
      // Try to dispatch visibility change event
      if (document.hidden) {
        document.dispatchEvent(new Event('visibilitychange'));
      }
      
      // Method 3: Try to bring window to front on mobile with proper typing
      try {
        const navigatorWithScreen = navigator as any;
        if ('screen' in navigatorWithScreen && 'orientation' in navigatorWithScreen.screen) {
          await navigatorWithScreen.screen.wakeUpDisplay?.();
        }
      } catch (e) {
        console.log('Native wake up display not available');
      }
    }
    
    // Method 4: Aggressive vibration pattern to help wake device
    if ('vibrate' in navigator) {
      // Long vibration pattern designed to wake device
      navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
    }
    
    // Method 5: Use Notification API as additional wake-up trigger
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        // Create notification with proper typing for vibrate property
        const notificationOptions: NotificationOptions & { vibrate?: number[]; renotify?: boolean; tag?: string } = {
          body: 'Binary Options Signal is ready!',
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          vibrate: [1000, 500, 1000, 500, 1000],
          requireInteraction: true,
          silent: false,
          renotify: true,
          tag: 'wake-up-alert'
        };
        
        const wakeNotification = new Notification('🚨 SIGNAL ALERT - WAKE UP! 🚨', notificationOptions);
        
        // Auto-close after 5 seconds
        setTimeout(() => wakeNotification.close(), 5000);
      } catch (e) {
        console.log('Web notification wake-up failed:', e);
      }
    }
    
    // Method 6: Try to play silent audio to trigger system wake-up
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Very brief, almost silent tone
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
      
      setTimeout(() => {
        audioContext.close();
      }, 200);
    } catch (e) {
      console.log('Audio wake-up trigger failed:', e);
    }
    
    console.log('All screen wake-up methods executed');
  } catch (error) {
    console.error('Failed to wake up screen:', error);
  }
};

// Additional method specifically for notification wake-up
export const forceScreenWakeUp = async (): Promise<void> => {
  try {
    // Use multiple approaches simultaneously for maximum effectiveness
    await Promise.all([
      wakeUpScreen(),
      // Try to use screen wake API if available with proper typing
      new Promise<void>((resolve) => {
        try {
          const navigatorWithScreen = navigator as any;
          if ('screen' in navigatorWithScreen && 'keepAwake' in navigatorWithScreen.screen) {
            navigatorWithScreen.screen.keepAwake = true;
            setTimeout(() => {
              navigatorWithScreen.screen.keepAwake = false;
              resolve();
            }, 5000);
          } else {
            resolve();
          }
        } catch (e) {
          resolve();
        }
      }),
      // Flash screen brightness if possible
      new Promise<void>((resolve) => {
        if (document.body) {
          const originalFilter = document.body.style.filter;
          document.body.style.filter = 'brightness(2)';
          setTimeout(() => {
            document.body.style.filter = 'brightness(0.5)';
            setTimeout(() => {
              document.body.style.filter = originalFilter;
              resolve();
            }, 200);
          }, 200);
        } else {
          resolve();
        }
      })
    ]);
    
    console.log('Force screen wake-up completed');
  } catch (error) {
    console.error('Force screen wake-up failed:', error);
  }
};
