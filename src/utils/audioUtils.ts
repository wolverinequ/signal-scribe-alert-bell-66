
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 1.0; // Ensure full volume
      
      // Handle mobile audio restrictions
      const playAudio = async () => {
        try {
          console.log('🎵 Attempting to play audio...');
          
          // Enable audio context on mobile/web
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            console.log('🔊 Audio context state:', audioContext.state);
            
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              console.log('🔊 Audio context resumed');
            }
            audioContext.close();
          }
          
          // Play the audio
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ Custom ringtone playing successfully');
            resolve(audio);
          } else {
            console.log('✅ Custom ringtone playing successfully (legacy)');
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ Error playing custom ringtone:', err);
          
          // Try user interaction workaround
          const playOnInteraction = () => {
            audio.play().then(() => {
              console.log('✅ Audio started after user interaction');
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('touchstart', playOnInteraction);
              resolve(audio);
            }).catch((retryErr) => {
              console.error('❌ Failed to play even after user interaction:', retryErr);
              reject(retryErr);
            });
          };
          
          // Add event listeners for user interaction
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          
          console.log('⚠️ Audio requires user interaction, waiting for click/touch...');
          setTimeout(() => {
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            reject(new Error('Audio playback timeout - user interaction required'));
          }, 5000);
        }
      };

      // Set up event listeners
      audio.addEventListener('canplaythrough', playAudio, { once: true });
      audio.addEventListener('loadeddata', () => {
        console.log('🎵 Audio data loaded successfully');
      });
      audio.addEventListener('error', (err) => {
        console.error('❌ Audio loading error:', err);
        reject(err);
      });
      audio.addEventListener('ended', () => {
        console.log('🎵 Audio playback ended');
      });

      // Load the audio
      console.log('🎵 Loading audio file...');
      audio.load();
    } else {
      console.log('❌ No custom ringtone available');
      reject(new Error('No custom ringtone available'));
    }
  });
};
