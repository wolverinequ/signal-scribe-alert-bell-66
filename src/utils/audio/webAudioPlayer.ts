
import { audioBufferCache } from '../audioBufferCache';

// Enhanced Web Audio API player using cached AudioBuffer for instant playback
export const playCustomRingtoneWithWebAudio = async (
  customRingtone: string | null, 
  audioContextsRef?: React.MutableRefObject<AudioContext[]>,
  isCleanupMode: boolean = false
): Promise<AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtoneWithWebAudio called with cached buffer optimization', {
    isCleanupMode
  });

  if (!customRingtone) {
    if (!isCleanupMode) {
      console.warn('🎵 AudioUtils: No custom ringtone provided, prompting user to select one');
      alert('Please select a custom ringtone first by clicking the Set Ring button.');
    }
    return null;
  }

  try {
    // Import IndexedDB manager to get ArrayBuffer directly
    const { indexedDBManager } = await import('../indexedDBUtils');
    
    console.log('🎵 AudioUtils: Getting audio ArrayBuffer for cache validation');
    const audioArrayBuffer = await indexedDBManager.getRingtoneAsArrayBuffer();
    
    if (!audioArrayBuffer) {
      if (!isCleanupMode) {
        console.warn('🎵 AudioUtils: No ArrayBuffer found in IndexedDB, prompting user to select ringtone');
        alert('No custom ringtone found. Please select one by clicking the Set Ring button.');
      }
      return null;
    }

    // Generate hash for current ringtone
    const ringtoneHash = audioBufferCache.generateRingtoneHash(audioArrayBuffer);
    console.log('🎵 AudioUtils: Ringtone hash generated:', ringtoneHash.substring(0, 32) + '...');

    // Check if we have a valid cached audio buffer
    let audioBuffer: AudioBuffer;
    
    if (audioBufferCache.isCacheValidForRingtone(ringtoneHash)) {
      console.log('🎵 AudioUtils: Using cached audio buffer - INSTANT PLAYBACK!');
      audioBuffer = audioBufferCache.getCachedAudioBuffer()!;
    } else {
      console.log('🎵 AudioUtils: Cache miss - decoding and caching audio buffer');
      
      // Create audio context for decoding
      const decodingContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      try {
        // Decode audio data directly from ArrayBuffer
        console.log('🎵 AudioUtils: Decoding audio buffer from ArrayBuffer...');
        audioBuffer = await decodingContext.decodeAudioData(audioArrayBuffer.slice(0));
        
        // Cache the decoded buffer for future use
        audioBufferCache.setCachedAudioBuffer(audioBuffer, ringtoneHash);
        
        console.log('🎵 AudioUtils: Audio buffer decoded and cached:', {
          duration: audioBuffer.duration,
          channels: audioBuffer.numberOfChannels,
          sampleRate: audioBuffer.sampleRate
        });
      } catch (decodeError) {
        console.error('🎵 AudioUtils: Audio decoding error:', decodeError);
        
        if (!isCleanupMode) {
          alert('Failed to decode audio file. Please select a new custom ringtone.');
        }
        
        await decodingContext.close();
        return null;
      }
      
      // Close the decoding context to free resources
      await decodingContext.close();
    }

    // Create new audio context for playback (always fresh for each playback)
    const playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create buffer source and connect to destination
    const source = playbackContext.createBufferSource();
    const gainNode = playbackContext.createGain();
    
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(playbackContext.destination);
    
    // Set volume to match HTML5 Audio API levels
    gainNode.gain.value = 0.8;
    
    // Calculate playback duration - limit to 30 seconds if audio is longer
    const maxDuration = 30; // 30 seconds limit
    const playbackDuration = Math.min(audioBuffer.duration, maxDuration);
    
    console.log('🎵 AudioUtils: Audio duration limits:', {
      originalDuration: audioBuffer.duration,
      maxAllowedDuration: maxDuration,
      actualPlaybackDuration: playbackDuration,
      isLimited: audioBuffer.duration > maxDuration
    });
    
    // Play audio with duration limit
    source.start(0);
    source.stop(playbackContext.currentTime + playbackDuration);
    
    console.log('🎵 AudioUtils: Custom ringtone playback started with cached buffer (INSTANT - original quality preserved) - Duration limited to', playbackDuration, 'seconds');
    
    // Store audio context for cleanup tracking if ref is provided
    if (audioContextsRef) {
      audioContextsRef.current.push(playbackContext);
      console.log('🎵 AudioUtils: Audio context added to tracking array');
    }
    
    return playbackContext;
    
  } catch (error) {
    console.error('🎵 AudioUtils: Error playing custom ringtone with cached buffer:', error);
    
    // Context-aware error handling
    if (!isCleanupMode) {
      console.log('🎵 AudioUtils: Prompting user to select new ringtone');
      alert('Failed to play custom ringtone. Please select a new one by clicking the Set Ring button.');
    } else {
      console.log('🎵 AudioUtils: Suppressing error alert - cleanup mode active');
    }
    
    return null;
  }
};
