
import { isValidAudioSource, isAppInBackground } from './audioValidation';
import { playCustomRingtoneWithWebAudio } from './webAudioPlayer';

export const playCustomRingtone = (customRingtone: string | null, audioContextsRef?: React.MutableRefObject<AudioContext[]>): Promise<HTMLAudioElement | AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtone called with:', {
    customRingtone: customRingtone ? `${customRingtone.substring(0, 50)}...` : null,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? (customRingtone.startsWith('data:') ? 'data-url' : 'blob-url') : 'none',
    isBackground: isAppInBackground()
  });

  // If no custom ringtone is provided, prompt user to select one
  if (!customRingtone) {
    console.log('🎵 AudioUtils: No custom ringtone provided, prompting user to select one');
    alert('Please select a custom ringtone first by clicking the Set Ring button.');
    return Promise.resolve(null);
  }

  // Choose audio API based on app state
  const isBackground = isAppInBackground();
  
  if (isBackground) {
    console.log('🎵 AudioUtils: App is in background, using Web Audio API with direct ArrayBuffer');
    return playCustomRingtoneWithWebAudio(customRingtone, audioContextsRef);
  }

  console.log('🎵 AudioUtils: App is in foreground, using HTML5 Audio API');
  
  return new Promise((resolve, reject) => {
    if (customRingtone && isValidAudioSource(customRingtone)) {
      console.log('🎵 AudioUtils: Attempting to play custom ringtone from IndexedDB');
      
      const audio = new Audio();
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
        const maxDuration = 30; // 30 seconds limit
        const actualDuration = Math.min(audio.duration, maxDuration);
        
        console.log('🎵 AudioUtils: Custom audio metadata loaded:', {
          originalDuration: audio.duration,
          maxAllowedDuration: maxDuration,
          actualPlaybackDuration: actualDuration,
          isLimited: audio.duration > maxDuration,
          readyState: audio.readyState
        });
        
        // Set up automatic stop after 30 seconds if audio is longer
        if (audio.duration > maxDuration) {
          setTimeout(() => {
            if (!audio.paused && !audio.ended) {
              console.log('🎵 AudioUtils: Stopping audio after 30 second limit');
              audio.pause();
              audio.currentTime = 0;
            }
          }, maxDuration * 1000);
        }
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
        
        // Instead of fallback, prompt user to select a new ringtone
        console.log('🎵 AudioUtils: Audio playback failed, prompting user to select new ringtone');
        alert('Audio playback failed. Please select a new custom ringtone.');
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
        console.log('🎵 AudioUtils: Prompting user to select new ringtone');
        
        // Instead of fallback, prompt user to select a new ringtone
        alert('Failed to play custom ringtone. Please select a new one.');
        resolve(null);
      });
    } else {
      console.warn('🎵 AudioUtils: Invalid or missing audio source, prompting user to select ringtone');
      alert('Please select a custom ringtone first by clicking the Set Ring button.');
      resolve(null);
    }
  });
};
