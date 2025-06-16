
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    // Validate audio URL
    if (!customRingtone) {
      console.log('❌ No custom ringtone available');
      reject(new Error('No custom ringtone available'));
      return;
    }

    // Validate blob URL format
    if (!customRingtone.startsWith('blob:')) {
      console.error('❌ Invalid audio URL format:', customRingtone.substring(0, 50));
      reject(new Error('Invalid audio URL format'));
      return;
    }

    console.log('🎵 Creating audio instance for URL:', customRingtone.substring(0, 50) + '...');
    
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

    // Set up event listeners with better error handling
    audio.addEventListener('canplaythrough', playAudio, { once: true });
    audio.addEventListener('loadeddata', () => {
      console.log('🎵 Audio data loaded successfully for URL:', customRingtone.substring(0, 50) + '...');
    });
    audio.addEventListener('error', (err) => {
      console.error('❌ Audio loading error for URL:', customRingtone.substring(0, 50) + '...', err);
      reject(new Error(`Audio loading failed: ${err}`));
    });
    audio.addEventListener('ended', () => {
      console.log('🎵 Audio playback ended');
    });

    // Validate audio source before loading
    try {
      console.log('🎵 Loading audio file from URL:', customRingtone.substring(0, 50) + '...');
      audio.load();
    } catch (loadError) {
      console.error('❌ Failed to load audio source:', loadError);
      reject(new Error(`Failed to load audio source: ${loadError}`));
    }
  });
};
