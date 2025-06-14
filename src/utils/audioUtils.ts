
// Create a default beep sound using Web Audio API
const createDefaultBeep = (): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Create a buffer for the beep sound
      const duration = 0.5; // 500ms beep
      const sampleRate = audioContext.sampleRate;
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
      
      // Create audio element from buffer
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.loop = true;
        resolve(audio);
      };
      
      mediaRecorder.start();
      source.start();
      source.stop(audioContext.currentTime + duration);
      
      setTimeout(() => {
        mediaRecorder.stop();
        audioContext.close();
      }, duration * 1000 + 100);
      
    } catch (error) {
      console.error('❌ Failed to create default beep, falling back to simple beep:', error);
      // Fallback: create a simple audio element with a data URL
      const audio = new Audio();
      audio.loop = true;
      // This is a very simple beep sound encoded as base64
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBC2E1O/LfC0HL';
      resolve(audio);
    }
  });
};

export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      let audio: HTMLAudioElement;
      
      if (customRingtone) {
        console.log('🎵 Playing custom ringtone...');
        audio = new Audio(customRingtone);
      } else {
        console.log('🎵 Playing default beep sound...');
        audio = await createDefaultBeep();
      }
      
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
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
            console.log('✅ Ringtone playing successfully');
            resolve(audio);
          } else {
            console.log('✅ Ringtone playing successfully (legacy)');
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ Error playing ringtone:', err);
          
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
    } catch (error) {
      console.error('❌ Error in playCustomRingtone:', error);
      reject(error);
    }
  });
};
