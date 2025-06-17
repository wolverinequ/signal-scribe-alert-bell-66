
import { audioBufferCache } from '../audioBufferCache';
import { createBeepAudio } from './audioContext';

// Enhanced Web Audio API player using cached AudioBuffer for instant playback
export const playCustomRingtoneWithWebAudio = async (
  customRingtone: string | null, 
  audioContextsRef?: React.MutableRefObject<AudioContext[]>
): Promise<AudioContext | null> => {
  console.log('🎵 AudioUtils: playCustomRingtoneWithWebAudio called with cached buffer optimization');

  if (!customRingtone) {
    console.warn('🎵 AudioUtils: No custom ringtone provided, falling back to beep');
    createBeepAudio(audioContextsRef);
    return null;
  }

  try {
    // Import IndexedDB manager to get ArrayBuffer directly
    const { indexedDBManager } = await import('../indexedDBUtils');
    
    console.log('🎵 AudioUtils: Getting audio ArrayBuffer for cache validation');
    const audioArrayBuffer = await indexedDBManager.getRingtoneAsArrayBuffer();
    
    if (!audioArrayBuffer) {
      console.warn('🎵 AudioUtils: No ArrayBuffer found in IndexedDB, falling back to beep');
      createBeepAudio(audioContextsRef);
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
      
      // Decode audio data directly from ArrayBuffer
      console.log('🎵 AudioUtils: Decoding audio buffer from ArrayBuffer...');
      audioBuffer = await decodingContext.decodeAudioData(audioArrayBuffer.slice(0));
      
      // Cache the decoded buffer for future use
      audioBufferCache.setCachedAudioBuffer(audioBuffer, ringtoneHash);
      
      // Close the decoding context to free resources
      await decodingContext.close();
      
      console.log('🎵 AudioUtils: Audio buffer decoded and cached:', {
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate
      });
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
    
    // Play audio with original quality (instant start due to cached buffer)
    source.start(0);
    console.log('🎵 AudioUtils: Custom ringtone playback started with cached buffer (INSTANT - original quality preserved)');
    
    // Store audio context for cleanup tracking if ref is provided
    if (audioContextsRef) {
      audioContextsRef.current.push(playbackContext);
      console.log('🎵 AudioUtils: Audio context added to tracking array');
    }
    
    return playbackContext;
    
  } catch (error) {
    console.error('🎵 AudioUtils: Error playing custom ringtone with cached buffer:', error);
    console.log('🎵 AudioUtils: Falling back to default beep');
    
    // Fallback to default beep
    createBeepAudio(audioContextsRef);
    return null;
  }
};
