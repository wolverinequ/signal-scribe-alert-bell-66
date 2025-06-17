
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
