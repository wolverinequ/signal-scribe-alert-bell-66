
import { registerPlugin } from '@capacitor/core';

export interface ScreenControlPlugin {
  turnOffScreen(): Promise<void>;
  acquireWakeLock(): Promise<void>;
  releaseWakeLock(): Promise<void>;
  keepScreenOn(options: { enabled: boolean }): Promise<void>;
}

const ScreenControl = registerPlugin<ScreenControlPlugin>('ScreenControl', {
  web: () => import('./screenControlWeb').then(m => new m.ScreenControlWeb()),
});

export default ScreenControl;
