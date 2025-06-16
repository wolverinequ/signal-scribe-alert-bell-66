
export const createBeepAudio = (audioContextsRef?: React.MutableRefObject<AudioContext[]>) => {
  console.log('🎵 Creating default beep audio');
  
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    
    const duration = 1000; // 1 second
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
    
    // Store audio context for cleanup tracking if ref is provided
    if (audioContextsRef) {
      audioContextsRef.current.push(audioContext);
      console.log('🎵 Audio context added to tracking array');
    }
    
    console.log('🎵 Default beep audio created successfully');
    return oscillator;
  } catch (error) {
    console.error('🎵 Error creating beep audio:', error);
    return null;
  }
};

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | null> => {
  console.log('🎵 playCustomRingtone called with:', {
    customRingtone,
    hasCustomRingtone: !!customRingtone
  });
  
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      console.log('🎵 Attempting to play custom ringtone:', customRingtone);
      
      const audio = new Audio(customRingtone);
      audio.loop = true; // Loop the ringtone
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => {
        console.log('🎵 Audio load started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('🎵 Audio can play');
      });
      
      audio.addEventListener('playing', () => {
        console.log('🎵 Audio is playing');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('🎵 Audio error event:', e);
      });
      
      audio.play().then(() => {
        console.log('🎵 Custom ringtone playback started successfully');
        resolve(audio);
      }).catch(err => {
        console.error('🎵 Error playing custom ringtone:', err);
        console.log('🎵 Falling back to default beep');
        // Fallback to default beep
        createBeepAudio(audioContextsRef);
        resolve(null);
      });
    } else {
      console.log('🎵 No custom ringtone provided, playing default beep');
      // Play default beep
      createBeepAudio(audioContextsRef);
      resolve(null);
    }
  });
};
