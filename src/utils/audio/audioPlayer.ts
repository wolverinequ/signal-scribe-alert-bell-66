
import { isValidAudioSource, isAppInBackground } from './audioValidation';
import { playCustomRingtoneWithWebAudio } from './webAudioPlayer';

export const playCustomRingtone = (
  customRingtone: string | null, 
  audioContextsRef?: React.MutableRefObject<AudioContext[]>,
  isCleanupMode: boolean = false
): Promise<HTMLAudioElement | AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtone called with:', {
    customRingtone: customRingtone ? `${customRingtone.substring(0, 50)}...` : null,
    hasCustomRingtone: !!customRingtone,
    ringtoneType: customRingtone ? (customRingtone.startsWith('data:') ? 'data-url' : 'blob-url') : 'none',
    isBackground: isAppInBackground(),
    isCleanupMode
  });

  // If no custom ringtone is provided, prompt user to select one (only if not in cleanup mode)
  if (!customRingtone) {
    if (!isCleanupMode) {
      console.log('🎵 AudioUtils: No custom ringtone provided, prompting user to select one');
      alert('Please select a custom ringtone first by clicking the Set Ring button.');
    }
    return Promise.resolve(null);
  }

  // Enhanced blob URL validation
  const isValidBlobUrl = (url: string): boolean => {
    if (!url.startsWith('blob:')) return false;
    
    try {
      // Check if the blob URL format is valid
      new URL(url);
      return true;
    } catch (error) {
      console.warn('🎵 AudioUtils: Invalid blob URL format:', url);
      return false;
    }
  };

  // Validate blob URL before proceeding
  if (!isValidBlobUrl(customRingtone)) {
    if (!isCleanupMode) {
      console.warn('🎵 AudioUtils: Invalid blob URL detected, prompting user to select new ringtone');
      alert('Audio file is no longer valid. Please select a new custom ringtone.');
    }
    return Promise.resolve(null);
  }

  // Choose audio API based on app state
  const isBackground = isAppInBackground();
  
  if (isBackground) {
    console.log('🎵 AudioUtils: App is in background, using Web Audio API with direct ArrayBuffer');
    return playCustomRingtoneWithWebAudio(customRingtone, audioContextsRef, isCleanupMode);
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
        const audioTarget = e.target as HTMLAudioElement;
        const error = audioTarget?.error;
        
        console.log('🎵 AudioUtils: Custom audio error event detected:', {
          error: error,
          code: error?.code,
          message: error?.message,
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          currentTime: audio.currentTime,
          isCleanupMode
        });
        
        // Map error codes to descriptions
        const errorMessages: { [key: number]: string } = {
          1: 'MEDIA_ERR_ABORTED - playback aborted',
          2: 'MEDIA_ERR_NETWORK - network error',
          3: 'MEDIA_ERR_DECODE - decoding error',
          4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - source not supported'
        };
        
        const errorMsg = error?.code ? errorMessages[error.code] || `Unknown error code: ${error.code}` : 'Unknown error';
        console.log('🎵 AudioUtils: Error description:', errorMsg);
        
        // Context-aware error handling - only show alert if not in cleanup mode
        if (!isCleanupMode) {
          // Check if this is a blob URL error (common during cleanup)
          if (error?.code === 2 && audio.src.startsWith('blob:')) {
            console.log('🎵 AudioUtils: Blob URL network error detected - likely outdated blob URL');
            alert('Audio file is no longer accessible. Please select a new custom ringtone.');
          } else {
            console.log('🎵 AudioUtils: General audio error - prompting user to select new ringtone');
            alert('Audio playback failed. Please select a new custom ringtone.');
          }
        } else {
          console.log('🎵 AudioUtils: Suppressing error alert - cleanup mode active');
        }
        
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
        
        // Context-aware error handling
        if (!isCleanupMode) {
          console.log('🎵 AudioUtils: Play error - prompting user to select new ringtone');
          alert('Failed to play custom ringtone. Please select a new one.');
        } else {
          console.log('🎵 AudioUtils: Suppressing play error alert - cleanup mode active');
        }
        
        resolve(null);
      });
    } else {
      if (!isCleanupMode) {
        console.warn('🎵 AudioUtils: Invalid or missing audio source, prompting user to select ringtone');
        alert('Please select a custom ringtone first by clicking the Set Ring button.');
      }
      resolve(null);
    }
  });
};
