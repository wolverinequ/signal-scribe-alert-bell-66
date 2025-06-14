
export const playCustomRingtone = (customRingtone: string, loop: boolean = false): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = loop;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      const playAudio = async () => {
        try {
          console.log('🎵 Attempting to play custom audio...');
          
          // Enable audio context on mobile/web
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
            audioContext.close();
          }
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ Custom ringtone playing successfully');
            resolve(audio);
          } else {
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ Error playing custom ringtone:', err);
          reject(err);
        }
      };

      audio.addEventListener('canplaythrough', playAudio, { once: true });
      audio.addEventListener('error', (err) => {
        console.error('❌ Audio loading error:', err);
        reject(err);
      });

      audio.load();
    } else {
      reject(new Error('No custom ringtone available'));
    }
  });
};

export const playDefaultBeep = (): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔊 Creating default beep sound...');
      
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure beep sound (800Hz sine wave for 1 second)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      // Create a dummy audio element for consistency with the interface
      const dummyAudio = new Audio();
      setTimeout(() => {
        console.log('✅ Default beep played successfully');
        resolve(dummyAudio);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to create default beep:', error);
      reject(error);
    }
  });
};
