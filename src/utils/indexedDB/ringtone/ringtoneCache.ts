
export const clearAudioBufferCache = async (): Promise<void> => {
  console.log('🗄️ IndexedDB: Clearing audio buffer cache');
  const { audioBufferCache } = await import('../../audioBufferCache');
  audioBufferCache.clearCache();
};

export const preCacheAudioBuffer = async (fileData: ArrayBuffer): Promise<void> => {
  try {
    const { audioBufferCache } = await import('../../audioBufferCache');
    const ringtoneHash = audioBufferCache.generateRingtoneHash(fileData);
    
    console.log('🗄️ IndexedDB: Pre-decoding audio buffer for cache...');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(fileData.slice(0));
    
    audioBufferCache.setCachedAudioBuffer(audioBuffer, ringtoneHash);
    await audioContext.close();
    
    console.log('🗄️ IndexedDB: Audio buffer pre-decoded and cached for instant playback');
  } catch (error) {
    console.warn('🗄️ IndexedDB: Failed to pre-decode audio, will decode on first use:', error);
  }
};
