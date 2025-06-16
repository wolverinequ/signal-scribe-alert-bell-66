
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    console.log('🎵 AudioUtils: playCustomRingtone called with URL:', customRingtone?.substring(0, 50) + '...');
    
    // Validate audio URL
    if (!customRingtone) {
      console.log('❌ AudioUtils: No custom ringtone available');
      reject(new Error('No custom ringtone available'));
      return;
    }

    // Validate blob URL format
    if (!customRingtone.startsWith('blob:')) {
      console.error('❌ AudioUtils: Invalid audio URL format:', customRingtone.substring(0, 50));
      reject(new Error('Invalid audio URL format'));
      return;
    }

    // Additional validation - check if blob URL is still valid
    fetch(customRingtone, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          console.error('❌ AudioUtils: Blob URL is no longer valid:', customRingtone.substring(0, 50));
          reject(new Error('Blob URL is no longer valid'));
          return;
        }
        
        console.log('✅ AudioUtils: Blob URL validation passed');
        createAndPlayAudio();
      })
      .catch(error => {
        console.error('❌ AudioUtils: Blob URL validation failed:', error);
        reject(new Error('Blob URL validation failed'));
      });

    const createAndPlayAudio = () => {
      console.log('🎵 AudioUtils: Creating audio instance for URL:', customRingtone.substring(0, 50) + '...');
      
      const audio = new Audio(customRingtone);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 1.0; // Ensure full volume
      
      // Handle mobile audio restrictions
      const playAudio = async () => {
        try {
          console.log('🎵 AudioUtils: Attempting to play audio...');
          
          // Enable audio context on mobile/web
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            console.log('🔊 AudioUtils: Audio context state:', audioContext.state);
            
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              console.log('🔊 AudioUtils: Audio context resumed');
            }
            audioContext.close();
          }
          
          // Play the audio
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ AudioUtils: Custom ringtone playing successfully');
            resolve(audio);
          } else {
            console.log('✅ AudioUtils: Custom ringtone playing successfully (legacy)');
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ AudioUtils: Error playing custom ringtone:', err);
          
          // Try user interaction workaround
          const playOnInteraction = () => {
            audio.play().then(() => {
              console.log('✅ AudioUtils: Audio started after user interaction');
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('touchstart', playOnInteraction);
              resolve(audio);
            }).catch((retryErr) => {
              console.error('❌ AudioUtils: Failed to play even after user interaction:', retryErr);
              reject(retryErr);
            });
          };
          
          // Add event listeners for user interaction
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          
          console.log('⚠️ AudioUtils: Audio requires user interaction, waiting for click/touch...');
          setTimeout(() => {
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            reject(new Error('Audio playback timeout - user interaction required'));
          }, 5000);
        }
      };

      // Set up event listeners with better error handling
      audio.addEventListener('canplaythrough', playAudio, { once: true });
      audio.addEventListener('loadeddata', () => {
        console.log('🎵 AudioUtils: Audio data loaded successfully for URL:', customRingtone.substring(0, 50) + '...');
      });
      audio.addEventListener('error', (err) => {
        console.error('❌ AudioUtils: Audio loading error for URL:', customRingtone.substring(0, 50) + '...', err);
        reject(new Error(`Audio loading failed: ${err}`));
      });
      audio.addEventListener('ended', () => {
        console.log('🎵 AudioUtils: Audio playback ended');
      });

      // Validate audio source before loading
      try {
        console.log('🎵 AudioUtils: Loading audio file from URL:', customRingtone.substring(0, 50) + '...');
        audio.load();
      } catch (loadError) {
        console.error('❌ AudioUtils: Failed to load audio source:', loadError);
        reject(new Error(`Failed to load audio source: ${loadError}`));
      }
    };
  });
};
