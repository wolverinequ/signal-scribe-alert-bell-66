
import { useRef, useCallback, useEffect } from 'react';

export const useAudioInstances = (customRingtone: string | null) => {
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const lastRingtoneRef = useRef<string | null>(null);

  const addAudioInstance = useCallback((audio: HTMLAudioElement) => {
    audioInstancesRef.current.push(audio);
    console.log('🔊 AudioInstances: Audio instance added, total instances:', audioInstancesRef.current.length);
    console.log('🎵 AudioInstances: Audio URL:', audio.src?.substring(0, 50) + '...');
  }, []);

  const clearAllAudioInstances = useCallback(() => {
    console.log('🧹 AudioInstances: Clearing', audioInstancesRef.current.length, 'audio instances');
    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log(`🔇 AudioInstances: Stopping audio instance ${index + 1} with URL:`, audio.src?.substring(0, 50) + '...');
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load(); // Force cleanup
      }
    });
    audioInstancesRef.current = [];
    console.log('✅ AudioInstances: All audio instances cleared and cleaned up');
  }, []);

  // Clear audio instances when ringtone changes - this is crucial for MP3 switching
  useEffect(() => {
    if (customRingtone && customRingtone !== lastRingtoneRef.current) {
      console.log('🔄 AudioInstances: Ringtone changed, clearing cached instances');
      console.log('🆚 AudioInstances: Old URL:', lastRingtoneRef.current?.substring(0, 50) + '...');
      console.log('🆚 AudioInstances: New URL:', customRingtone?.substring(0, 50) + '...');
      
      // Clear all existing audio instances immediately
      clearAllAudioInstances();
      lastRingtoneRef.current = customRingtone;
      
      console.log('✅ AudioInstances: Audio instances cleared for new MP3');
    }
  }, [customRingtone, clearAllAudioInstances]);

  return {
    addAudioInstance,
    clearAllAudioInstances
  };
};
