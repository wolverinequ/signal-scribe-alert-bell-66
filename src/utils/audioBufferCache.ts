
// Global audio buffer cache for instant playback without repeated decoding
let cachedAudioBuffer: AudioBuffer | null = null;
let cachedRingtoneHash: string | null = null;

export const audioBufferCache = {
  // Get cached audio buffer if available
  getCachedAudioBuffer(): AudioBuffer | null {
    console.log('🎵 AudioCache: Getting cached audio buffer:', cachedAudioBuffer ? 'FOUND' : 'NOT_FOUND');
    return cachedAudioBuffer;
  },

  // Set cached audio buffer with hash validation
  setCachedAudioBuffer(audioBuffer: AudioBuffer, ringtoneHash: string): void {
    cachedAudioBuffer = audioBuffer;
    cachedRingtoneHash = ringtoneHash;
    console.log('🎵 AudioCache: Audio buffer cached successfully:', {
      duration: audioBuffer.duration,
      channels: audioBuffer.numberOfChannels,
      sampleRate: audioBuffer.sampleRate,
      hash: ringtoneHash.substring(0, 16) + '...'
    });
  },

  // Check if cached buffer is valid for current ringtone
  isCacheValidForRingtone(ringtoneHash: string): boolean {
    const isValid = cachedAudioBuffer && cachedRingtoneHash === ringtoneHash;
    console.log('🎵 AudioCache: Cache validation:', {
      hasBuffer: !!cachedAudioBuffer,
      hashMatch: cachedRingtoneHash === ringtoneHash,
      isValid
    });
    return isValid;
  },

  // Clear cache (when ringtone changes or is deleted)
  clearCache(): void {
    console.log('🎵 AudioCache: Clearing audio buffer cache');
    cachedAudioBuffer = null;
    cachedRingtoneHash = null;
  },

  // Generate hash for ringtone data to detect changes
  generateRingtoneHash(arrayBuffer: ArrayBuffer): string {
    // Simple hash based on size and first/last bytes for quick validation
    const view = new Uint8Array(arrayBuffer);
    const size = arrayBuffer.byteLength;
    const firstBytes = view.slice(0, Math.min(16, size));
    const lastBytes = view.slice(Math.max(0, size - 16), size);
    
    const hash = `${size}_${Array.from(firstBytes).join('')}_${Array.from(lastBytes).join('')}`;
    return hash;
  }
};
