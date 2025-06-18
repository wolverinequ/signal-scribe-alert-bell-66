import { Signal } from '@/types/signal';
import { indexedDBManager } from '@/utils/indexedDBUtils';
import { playCustomRingtoneWithWebAudio, createBeepAudio } from '@/utils/audioUtils';
import { getBackgroundTaskState } from './taskState';

export const playBackgroundAudio = async (signal: Signal) => {
  try {
    const { ringManagerCallback } = getBackgroundTaskState();
    
    // If we have a ring manager callback (app is visible), use it for better UI integration
    if (ringManagerCallback) {
      console.log('🔔 BackgroundTask: Using ring manager callback for foreground audio');
      ringManagerCallback(signal);
      return;
    }
    
    // Otherwise use background audio system
    console.log('🔔 BackgroundTask: Using background audio system');
    
    // Initialize IndexedDB if needed
    await indexedDBManager.init();
    
    // Try to get custom ringtone ArrayBuffer from IndexedDB directly
    const customRingtoneArrayBuffer = await indexedDBManager.getRingtoneAsArrayBuffer();
    
    if (customRingtoneArrayBuffer) {
      console.log('🔔 BackgroundTask: Playing custom ringtone');
      await playCustomRingtoneWithWebAudio('custom', undefined);
    } else {
      console.log('🔔 BackgroundTask: Playing default beep');
      createBeepAudio();
    }
  } catch (error) {
    console.error('🔔 BackgroundTask: Audio error:', error);
    // Fallback to default beep on any error
    createBeepAudio();
  }
};
