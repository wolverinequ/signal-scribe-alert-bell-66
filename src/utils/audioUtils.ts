
export const playCustomRingtone = (customRingtone: string, loop: boolean = false): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    console.log('🎵 AudioUtils: playCustomRingtone called with:', {
      ringtoneUrl: customRingtone.substring(0, 50) + '...',
      loop
    });

    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = loop;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      console.log('🎵 AudioUtils: Audio element created, setting up event listeners');
      
      const playAudio = async () => {
        try {
          console.log('🎵 AudioUtils: Attempting to play custom audio...');
          
          // Enable audio context on mobile/web
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            console.log('🎵 AudioUtils: AudioContext state:', audioContext.state);
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
              console.log('🎵 AudioUtils: AudioContext resumed');
            }
            audioContext.close();
          }
          
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('✅ AudioUtils: Custom ringtone playing successfully');
            resolve(audio);
          } else {
            console.log('✅ AudioUtils: Audio play() returned undefined, resolving anyway');
            resolve(audio);
          }
        } catch (err) {
          console.error('❌ AudioUtils: Error playing custom ringtone:', err);
          reject(err);
        }
      };

      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 AudioUtils: Audio can play through, starting playback');
        playAudio();
      }, { once: true });

      audio.addEventListener('loadstart', () => {
        console.log('🎵 AudioUtils: Audio load started');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('🎵 AudioUtils: Audio data loaded');
      });

      audio.addEventListener('canplay', () => {
        console.log('🎵 AudioUtils: Audio can play');
      });

      audio.addEventListener('error', (err) => {
        console.error('❌ AudioUtils: Audio loading error:', err);
        console.error('❌ AudioUtils: Audio error details:', {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        reject(err);
      });

      console.log('🎵 AudioUtils: Starting audio load...');
      audio.load();
    } else {
      console.error('❌ AudioUtils: No custom ringtone URL provided');
      reject(new Error('No custom ringtone available'));
    }
  });
};

export const playDefaultBeep = (): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔊 AudioUtils: Creating default beep sound...');
      
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 AudioUtils: AudioContext created, state:', audioContext.state);
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure beep sound (800Hz sine wave for 1 second)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      console.log('🔊 AudioUtils: Starting oscillator...');
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
      
      // Create a dummy audio element for consistency with the interface
      const dummyAudio = new Audio();
      setTimeout(() => {
        console.log('✅ AudioUtils: Default beep played successfully');
        resolve(dummyAudio);
      }, 1000);
      
    } catch (error) {
      console.error('❌ AudioUtils: Failed to create default beep:', error);
      reject(error);
    }
  });
};
