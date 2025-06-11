
import { WebPlugin } from '@capacitor/core';
import { ScreenControlPlugin } from './screenControl';

export class ScreenControlWeb extends WebPlugin implements ScreenControlPlugin {
  async turnOffScreen(): Promise<void> {
    console.log('Web: Simulating screen off');
    // Simulate screen off in web environment
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#000';
    
    setTimeout(() => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }, 1000);
  }

  async acquireWakeLock(): Promise<void> {
    console.log('Web: Acquiring wake lock');
    if ('wakeLock' in navigator) {
      try {
        await navigator.wakeLock.request('screen');
      } catch (err) {
        console.log('Wake lock request failed:', err);
      }
    }
  }

  async releaseWakeLock(): Promise<void> {
    console.log('Web: Releasing wake lock');
    // Web wake lock is handled automatically
  }

  async keepScreenOn(options: { enabled: boolean }): Promise<void> {
    console.log('Web: Keep screen on:', options.enabled);
    if (options.enabled) {
      await this.acquireWakeLock();
    }
  }
}
