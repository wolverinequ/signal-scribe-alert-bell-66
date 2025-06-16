
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
    console.log('🧹 AudioInstances: FORCE CLEARING', audioInstancesRef.current.length, 'audio instances');
    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log(`🔇 AudioInstances: FORCE STOPPING audio instance ${index + 1} with URL:`, audio.src?.substring(0, 50) + '...');
        try {
          audio.pause();
          audio.currentTime = 0;
          // Force disconnect from source
          audio.removeAttribute('src');
          audio.load();
          // Additional cleanup
          audio.volume = 0;
        } catch (error) {
          console.log('⚠️ AudioInstances: Error stopping audio:', error);
        }
      }
    });
    audioInstancesRef.current = [];
    console.log('✅ AudioInstances: ALL AUDIO FORCEFULLY STOPPED AND CLEARED');
  }, []);

  // IMMEDIATELY clear ALL audio when ringtone changes - this is the key fix
  useEffect(() => {
    console.log('🔄 AudioInstances: Checking ringtone change...');
    console.log('🆚 AudioInstances: Current ringtone:', customRingtone?.substring(0, 50) + '...');
    console.log('🆚 AudioInstances: Last ringtone:', lastRingtoneRef.current?.substring(0, 50) + '...');
    
    if (customRingtone !== lastRingtoneRef.current) {
      console.log('🚨 AudioInstances: RINGTONE CHANGED - FORCE CLEARING ALL AUDIO');
      
      // IMMEDIATE force clear - no delays
      clearAllAudioInstances();
      
      // Update reference AFTER clearing
      lastRingtoneRef.current = customRingtone;
      
      console.log('✅ AudioInstances: Ringtone reference updated to:', customRingtone?.substring(0, 50) + '...');
    }
  }, [customRingtone, clearAllAudioInstances]);

  return {
    addAudioInstance,
    clearAllAudioInstances
  };
};
