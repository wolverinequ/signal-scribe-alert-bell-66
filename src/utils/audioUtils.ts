
export const createBeepAudio = (audioContextsRef?: React.MutableRefObject<AudioContext[]>) => {
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
  }
  
  return oscillator;
};

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    console.log('playCustomRingtone called with:', customRingtone ? 'Custom ringtone data (length: ' + customRingtone.length + ')' : 'No custom ringtone');
    
    if (customRingtone) {
      // Validate the data URL format
      if (!customRingtone.startsWith('data:audio/')) {
        console.error('Invalid custom ringtone format - not a valid audio data URL:', customRingtone.substring(0, 100));
        console.log('Falling back to default beep due to invalid format');
        createBeepAudio(audioContextsRef);
        resolve(null);
        return;
      }

      // Check data URL size (should be reasonable for audio file)
      const sizeInMB = (customRingtone.length * 0.75) / (1024 * 1024); // Rough base64 to binary size conversion
      console.log('Custom ringtone data size:', sizeInMB.toFixed(2), 'MB');
      
      if (sizeInMB > 10) { // Limit to 10MB
        console.error('Custom ringtone file too large:', sizeInMB.toFixed(2), 'MB');
        console.log('Falling back to default beep due to file size');
        createBeepAudio(audioContextsRef);
        resolve(null);
        return;
      }

      console.log('Creating audio element for custom ringtone...');
      const audio = new Audio();
      
      // Set up detailed error logging
      audio.addEventListener('error', (e) => {
        console.error('Audio element error event:', e);
        console.error('Audio error details:', {
          error: audio.error,
          code: audio.error?.code,
          message: audio.error?.message,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
      });

      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded successfully');
      });

      audio.addEventListener('canplay', () => {
        console.log('Audio can start playing');
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through without stopping');
      });

      // Set audio properties
      audio.loop = true;
      audio.preload = 'auto';
      
      console.log('Setting audio source to custom ringtone data URL...');
      audio.src = customRingtone;

      // Attempt to play with detailed error handling
      console.log('Attempting to play custom ringtone...');
      const playPromise = audio.play();
      
      playPromise.then(() => {
        console.log('✅ Custom ringtone started playing successfully!');
        resolve(audio);
      }).catch(err => {
        console.error('❌ Error playing custom ringtone:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Audio state when error occurred:', {
          readyState: audio.readyState,
          networkState: audio.networkState,
          paused: audio.paused,
          ended: audio.ended,
          duration: audio.duration,
          currentTime: audio.currentTime
        });
        
        // For mobile devices, user interaction might be required
        if (err.name === 'NotAllowedError') {
          console.log('Audio play blocked - likely due to autoplay policy on mobile');
          console.log('This might require user interaction first');
        }
        
        console.log('Falling back to default beep due to playback error');
        createBeepAudio(audioContextsRef);
        resolve(null);
      });
    } else {
      console.log('No custom ringtone set, playing default beep');
      createBeepAudio(audioContextsRef);
      resolve(null);
    }
  });
};
