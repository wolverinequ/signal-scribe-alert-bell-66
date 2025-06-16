
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    console.log('🎵 AudioUtils: ===== PLAY CUSTOM RINGTONE CALLED =====');
    console.log('🎵 AudioUtils: Received customRingtone URL:', customRingtone);
    
    if (customRingtone) {
      console.log('🎵 AudioUtils: Creating new Audio instance...');
      const audio = new Audio(customRingtone);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      console.log('🎵 AudioUtils: Audio instance created with URL:', audio.src);
      console.log('🎵 AudioUtils: Audio settings - loop:', audio.loop, 'volume:', audio.volume);
      
      // Handle mobile audio restrictions
      const playAudio = async () => {
        try {
          console.log('🎵 AudioUtils: Attempting to play audio...');
          console.log('🎵 AudioUtils: Audio src at play time:', audio.src);
          
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
          console.log('🎵 AudioUtils: Calling audio.play()...');
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ AudioUtils: Custom ringtone playing successfully');
            console.log('🎵 AudioUtils: Currently playing audio src:', audio.src);
            resolve(audio);
          } else {
            console.log('✅ AudioUtils: Custom ringtone playing successfully (legacy)');
            console.log('🎵 AudioUtils: Currently playing audio src:', audio.src);
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ AudioUtils: Error playing custom ringtone:', err);
          console.log('🎵 AudioUtils: Failed audio src:', audio.src);
          
          // Try user interaction workaround
          const playOnInteraction = () => {
            console.log('🎵 AudioUtils: Attempting play after user interaction...');
            audio.play().then(() => {
              console.log('✅ AudioUtils: Audio started after user interaction');
              console.log('🎵 AudioUtils: Playing audio src after interaction:', audio.src);
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

      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 AudioUtils: Audio can play through - calling playAudio');
        playAudio();
      }, { once: true });
      
      audio.addEventListener('loadeddata', () => {
        console.log('🎵 AudioUtils: Audio data loaded successfully for:', audio.src);
      });
      
      audio.addEventListener('error', (err) => {
        console.error('❌ AudioUtils: Audio loading error:', err);
        console.log('🎵 AudioUtils: Error occurred for audio src:', audio.src);
        reject(err);
      });
      
      audio.addEventListener('ended', () => {
        console.log('🎵 AudioUtils: Audio playback ended for:', audio.src);
      });

      // Load the audio
      console.log('🎵 AudioUtils: Loading audio file...');
      audio.load();
    } else {
      console.log('❌ AudioUtils: No custom ringtone available - rejecting');
      reject(new Error('No custom ringtone available'));
    }
  });
};
