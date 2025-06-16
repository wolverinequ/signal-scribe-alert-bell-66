
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

const isValidAudioSource = (source: string): boolean => {
  // Check for data URL format
  if (source.startsWith('data:audio/')) {
    return source.includes('base64,') && source.split(',')[1]?.length > 0;
  }
  // Check for blob URL format
  if (source.startsWith('blob:')) {
    return true;
  }
  return false;
};

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | null> => {
  console.log('🎵 AudioUtils: playCustomRingtone called with:', {
    customRingtone: customRingtone ? `${customRingtone.substring(0, 50)}...` : null,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? (customRingtone.startsWith('data:') ? 'data-url' : 'blob-url') : 'none'
  });
  
  return new Promise((resolve, reject) => {
    if (customRingtone && isValidAudioSource(customRingtone)) {
      console.log('🎵 AudioUtils: Attempting to play custom ringtone from IndexedDB');
      
      const audio = new Audio();
      audio.loop = true; // Loop the ringtone
      audio.preload = 'auto';
      
      // Add event listeners for debugging and error handling
      audio.addEventListener('loadstart', () => {
        console.log('🎵 AudioUtils: Custom audio load started');
      });
      
      audio.addEventListener('canplay', () => {
        console.log('🎵 AudioUtils: Custom audio can play');
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 AudioUtils: Custom audio can play through');
      });
      
      audio.addEventListener('loadedmetadata', () => {
        console.log('🎵 AudioUtils: Custom audio metadata loaded:', {
          duration: audio.duration,
          readyState: audio.readyState
        });
      });
      
      audio.addEventListener('playing', () => {
        console.log('🎵 AudioUtils: Custom audio is playing');
      });
      
      audio.addEventListener('error', (e) => {
        console.error('🎵 AudioUtils: Custom audio error event:', e);
        const audioTarget = e.target as HTMLAudioElement;
        const error = audioTarget?.error;
        
        console.error('🎵 AudioUtils: Audio error details:', {
          error: error,
          code: error?.code,
          message: error?.message,
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          currentTime: audio.currentTime
        });
        
        // Map error codes to descriptions
        const errorMessages: { [key: number]: string } = {
          1: 'MEDIA_ERR_ABORTED - playback aborted',
          2: 'MEDIA_ERR_NETWORK - network error',
          3: 'MEDIA_ERR_DECODE - decoding error',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - source not supported'
        };
        
        const errorMsg = error?.code ? errorMessages[error.code] || `Unknown error code: ${error.code}` : 'Unknown error';
        console.error('🎵 AudioUtils: Error description:', errorMsg);
        
        // Fall back to default beep on error
        console.log('🎵 AudioUtils: Falling back to default beep due to error');
        createBeepAudio(audioContextsRef);
        resolve(null);
      });
      
      // Set the audio source (blob URL from IndexedDB)
      audio.src = customRingtone;
      audio.load(); // Explicitly load the audio
      
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
      if (customRingtone) {
        console.warn('🎵 AudioUtils: Invalid audio source provided, falling back to beep');
      } else {
        console.log('🎵 AudioUtils: No custom ringtone provided, playing default beep');
      }
      
      // Play default beep
      createBeepAudio(audioContextsRef);
      resolve(null);
    }
  });
};
