
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = true;
      audio.preload = 'auto';
      
      // Handle mobile audio restrictions
      const playAudio = async () => {
        try {
          // Enable audio context on mobile
          if (audio.play) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log('Custom ringtone playing successfully');
              resolve(audio);
            } else {
              console.log('Custom ringtone playing successfully (legacy)');
              resolve(audio);
            }
          }
        } catch (err) {
          console.log('Error playing custom ringtone:', err);
          
          // Try to enable audio context and retry
          try {
            // Create and resume audio context for mobile
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
              const audioContext = new AudioContext();
              if (audioContext.state === 'suspended') {
                await audioContext.resume();
              }
              audioContext.close();
            }
            
            // Retry playing
            const retryPromise = audio.play();
            if (retryPromise !== undefined) {
              await retryPromise;
              console.log('Custom ringtone playing after context resume');
              resolve(audio);
            } else {
              resolve(audio);
            }
          } catch (retryErr) {
            console.error('Failed to play custom ringtone after retry:', retryErr);
            reject(retryErr);
          }
        }
      };

      // Set up event listeners
      audio.addEventListener('canplaythrough', playAudio, { once: true });
      audio.addEventListener('error', (err) => {
        console.error('Audio error:', err);
        reject(err);
      });

      // Load the audio
      audio.load();
    } else {
      console.log('No custom ringtone available');
      reject(new Error('No custom ringtone available'));
    }
  });
};
