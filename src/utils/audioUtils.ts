
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

const isAppInBackground = (): boolean => {
  // Check if app is hidden or in background
  return document.hidden || document.visibilityState === 'hidden';
};

// New Web Audio API custom audio player
export const playCustomRingtoneWithWebAudio = async (
  customRingtone: string | null, 
  audioContextsRef?: React.MutableRefObject<AudioContext[]>
): Promise<AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtoneWithWebAudio called with:', {
    customRingtone: customRingtone ? `${customRingtone.substring(0, 50)}...` : null,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? (customRingtone.startsWith('data:') ? 'data-url' : 'blob-url') : 'none'
  });

  if (!customRingtone || !isValidAudioSource(customRingtone)) {
    console.warn('🎵 AudioUtils: Invalid or missing audio source for Web Audio API, falling back to beep');
    createBeepAudio(audioContextsRef);
    return null;
  }

  try {
    console.log('🎵 AudioUtils: Fetching audio data for Web Audio API playback');
    
    // Fetch the blob data
    const response = await fetch(customRingtone);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('🎵 AudioUtils: Audio data fetched, size:', arrayBuffer.byteLength);

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Decode audio data
    console.log('🎵 AudioUtils: Decoding audio buffer...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    console.log('🎵 AudioUtils: Audio buffer decoded successfully:', {
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate
    });

    // Create buffer source and connect to destination
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume
    gainNode.gain.value = 0.8;
    
    // Play audio
    source.start(0);
    console.log('🎵 AudioUtils: Custom ringtone playback started with Web Audio API');
    
    // Store audio context for cleanup tracking if ref is provided
    if (audioContextsRef) {
      audioContextsRef.current.push(audioContext);
      console.log('🎵 AudioUtils: Audio context added to tracking array');
    }
    
    return audioContext;
    
  } catch (error) {
    console.error('🎵 AudioUtils: Error playing custom ringtone with Web Audio API:', error);
    console.log('🎵 AudioUtils: Falling back to default beep');
    
    // Fallback to default beep
    createBeepAudio(audioContextsRef);
    return null;
  }
};

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtone called with:', {
    customRingtone: customRingtone ? `${customRingtone.substring(0, 50)}...` : null,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? (customRingtone.startsWith('data:') ? 'data-url' : 'blob-url') : 'none',
    isBackground: isAppInBackground()
  });

  // Choose audio API based on app state
  const isBackground = isAppInBackground();
  
  if (isBackground) {
    console.log('🎵 AudioUtils: App is in background, using Web Audio API');
    return playCustomRingtoneWithWebAudio(customRingtone, audioContextsRef);
  }

  console.log('🎵 AudioUtils: App is in foreground, using HTML5 Audio API');
  
  return new Promise((resolve, reject) => {
    if (customRingtone && isValidAudioSource(customRingtone)) {
      console.log('🎵 AudioUtils: Attempting to play custom ringtone from IndexedDB');
      
      const audio = new Audio();
      // Removed audio.loop = true to play only once
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
