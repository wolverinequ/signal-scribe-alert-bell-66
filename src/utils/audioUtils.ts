
// Create a default beep sound using Web Audio API
const createDefaultBeep = (): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎵 [createDefaultBeep] Starting default beep creation...');
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 [createDefaultBeep] Audio context created, state:', audioContext.state);
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Create a buffer for the beep sound
      const duration = 0.5; // 500ms beep
      const sampleRate = audioContext.sampleRate;
      console.log('🎵 [createDefaultBeep] Creating buffer - duration:', duration, 'sampleRate:', sampleRate);
      
      const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate a simple beep tone (800 Hz sine wave)
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(2 * Math.PI * 800 * i / sampleRate) * 0.3;
        // Apply fade out to avoid clicking
        if (i > buffer.length * 0.8) {
          data[i] *= (buffer.length - i) / (buffer.length * 0.2);
        }
      }
      
      console.log('🎵 [createDefaultBeep] Buffer generated with', buffer.length, 'samples');
      
      // Create audio element from buffer
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        console.log('🎵 [createDefaultBeep] Data chunk available, size:', e.data.size);
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        console.log('🎵 [createDefaultBeep] MediaRecorder stopped, creating blob from', chunks.length, 'chunks');
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.loop = true;
        console.log('✅ [createDefaultBeep] Default beep audio element created successfully');
        resolve(audio);
      };
      
      console.log('🎵 [createDefaultBeep] Starting recording and playback...');
      mediaRecorder.start();
      source.start();
      source.stop(audioContext.currentTime + duration);
      
      setTimeout(() => {
        console.log('🎵 [createDefaultBeep] Stopping recorder and closing context...');
        mediaRecorder.stop();
        audioContext.close();
      }, duration * 1000 + 100);
      
    } catch (error) {
      console.error('❌ [createDefaultBeep] Failed to create default beep, falling back to simple beep:', error);
      // Fallback: create a simple audio element with a data URL
      const audio = new Audio();
      audio.loop = true;
      // This is a very simple beep sound encoded as base64
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBC2E1O/LfC0HL';
      console.log('✅ [createDefaultBeep] Fallback beep audio element created');
      resolve(audio);
    }
  });
};

export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🎵 [playCustomRingtone] Starting ringtone playback...');
      console.log('🎵 [playCustomRingtone] Custom ringtone provided:', !!customRingtone);
      console.log('🎵 [playCustomRingtone] Ringtone source type:', customRingtone ? 'custom' : 'default');
      
      let audio: HTMLAudioElement;
      
      if (customRingtone) {
        console.log('🎵 [playCustomRingtone] Creating audio element with custom ringtone...');
        console.log('🎵 [playCustomRingtone] Custom ringtone URL length:', customRingtone.length);
        console.log('🎵 [playCustomRingtone] Custom ringtone URL preview:', customRingtone.substring(0, 50) + '...');
        audio = new Audio(customRingtone);
      } else {
        console.log('🎵 [playCustomRingtone] Creating default beep sound...');
        audio = await createDefaultBeep();
      }
      
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      console.log('🎵 [playCustomRingtone] Audio element configured - loop:', audio.loop, 'volume:', audio.volume);
      
      // Handle mobile audio restrictions
      const playAudio = async () => {
        try {
          console.log('🎵 [playCustomRingtone] Attempting to play audio...');
          console.log('🎵 [playCustomRingtone] Audio ready state:', audio.readyState);
          console.log('🎵 [playCustomRingtone] Audio duration:', audio.duration);
          
          // Enable audio context on mobile/web
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            console.log('🔊 [playCustomRingtone] Audio context state:', audioContext.state);
            
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              console.log('🔊 [playCustomRingtone] Audio context resumed');
            }
            audioContext.close();
          }
          
          // Play the audio
          console.log('🎵 [playCustomRingtone] Calling audio.play()...');
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ [playCustomRingtone] Ringtone playing successfully (promise resolved)');
            resolve(audio);
          } else {
            console.log('✅ [playCustomRingtone] Ringtone playing successfully (legacy mode)');
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ [playCustomRingtone] Error playing ringtone:', err);
          console.error('❌ [playCustomRingtone] Error details:', {
            name: (err as Error).name,
            message: (err as Error).message,
            audioSrc: audio.src.substring(0, 100) + '...',
            audioReadyState: audio.readyState,
            audioNetworkState: audio.networkState
          });
          
          // Try user interaction workaround
          const playOnInteraction = () => {
            console.log('🎵 [playCustomRingtone] Attempting play after user interaction...');
            audio.play().then(() => {
              console.log('✅ [playCustomRingtone] Audio started after user interaction');
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('touchstart', playOnInteraction);
              resolve(audio);
            }).catch((retryErr) => {
              console.error('❌ [playCustomRingtone] Failed to play even after user interaction:', retryErr);
              reject(retryErr);
            });
          };
          
          // Add event listeners for user interaction
          document.addEventListener('click', playOnInteraction, { once: true });
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          
          console.log('⚠️ [playCustomRingtone] Audio requires user interaction, waiting for click/touch...');
          setTimeout(() => {
            console.log('⏰ [playCustomRingtone] User interaction timeout reached');
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('touchstart', playOnInteraction);
            reject(new Error('Audio playback timeout - user interaction required'));
          }, 5000);
        }
      };

      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 [playCustomRingtone] Audio can play through - calling playAudio()');
        playAudio();
      }, { once: true });
      
      audio.addEventListener('loadeddata', () => {
        console.log('🎵 [playCustomRingtone] Audio data loaded successfully');
        console.log('🎵 [playCustomRingtone] Loaded audio duration:', audio.duration);
        console.log('🎵 [playCustomRingtone] Loaded audio ready state:', audio.readyState);
      });
      
      audio.addEventListener('error', (err) => {
        console.error('❌ [playCustomRingtone] Audio loading error:', err);
        console.error('❌ [playCustomRingtone] Audio error details:', {
          error: audio.error,
          src: audio.src.substring(0, 100) + '...',
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        reject(err);
      });
      
      audio.addEventListener('ended', () => {
        console.log('🎵 [playCustomRingtone] Audio playback ended');
      });

      audio.addEventListener('playing', () => {
        console.log('✅ [playCustomRingtone] Audio is now playing');
      });

      audio.addEventListener('pause', () => {
        console.log('⏸️ [playCustomRingtone] Audio paused');
      });

      // Load the audio
      console.log('🎵 [playCustomRingtone] Loading audio file...');
      audio.load();
    } catch (error) {
      console.error('❌ [playCustomRingtone] Error in playCustomRingtone:', error);
      reject(error);
    }
  });
};
