
export const createBeepAudio = (audioContextsRef?: React.MutableRefObject<AudioContext[]>) => {
  console.log('🎵 AudioUtils: Creating default beep audio');
  
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
      console.log('🎵 AudioUtils: Audio context added to tracking array');
    }
    
    console.log('🎵 AudioUtils: Default beep audio created successfully');
    return oscillator;
  } catch (error) {
    console.error('🎵 AudioUtils: Error creating beep audio:', error);
    return null;
  }
};

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | null> => {
  console.log('🎵 AudioUtils: playCustomRingtone called with:', {
    customRingtone,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? 'custom' : 'default'
  });
  
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      console.log('🎵 AudioUtils: Attempting to play custom ringtone:', customRingtone);
      
      const audio = new Audio(customRingtone);
      audio.loop = true; // Loop the ringtone
      
      // Add event listeners for debugging
      audio.addEventListener('loadstart', () => {
        console.log('🎵 AudioUtils: Custom audio load started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('🎵 AudioUtils: Custom audio can play');
      });
      
      audio.addEventListener('playing', () => {
        console.log('🎵 AudioUtils: Custom audio is playing');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('🎵 AudioUtils: Custom audio error event:', e);
        const audioTarget = e.target as HTMLAudioElement;
        console.error('🎵 AudioUtils: Audio error details:', {
          error: audioTarget?.error,
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState
        });
      });
      
      audio.play().then(() => {
        console.log('🎵 AudioUtils: Custom ringtone playback started successfully');
        resolve(audio);
      }).catch(err => {
        console.error('🎵 AudioUtils: Error playing custom ringtone:', err);
        console.log('🎵 AudioUtils: Falling back to default beep');
        // Fallback to default beep
        createBeepAudio(audioContextsRef);
        resolve(null);
      });
    } else {
      console.log('🎵 AudioUtils: No custom ringtone provided, playing default beep');
      // Play default beep
      createBeepAudio(audioContextsRef);
      resolve(null);
    }
  });
};
