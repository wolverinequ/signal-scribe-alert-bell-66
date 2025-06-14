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

export const playCustomRingtone = (
  customRingtone: string | null, 
  audioContextsRef?: React.MutableRefObject<AudioContext[]>
): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const isDataUrl = typeof customRingtone === 'string' && customRingtone.startsWith('data:audio');
      console.log('Attempting to play custom ringtone.');
      console.log('customRingtone.length:', customRingtone.length);
      console.log('customRingtone (start):', customRingtone.slice(0, 128));
      console.log('customRingtone is data url?', isDataUrl);

      const audio = new Audio(customRingtone);
      audio.loop = true;

      audio.onerror = (e) => {
        console.log('Audio element error:', e, audio.error);
      };

      audio.onplay = () => {
        console.log('Custom audio started playing successfully');
      };

      audio.play().then(() => {
        resolve(audio);
      }).catch(err => {
        console.log('Error playing custom ringtone:', err);
        alert(
          "Failed to play custom ringtone. The file format might not be supported, or there is a browser restriction.\n" + 
          "Please try uploading a small MP3 or WAV file."
        );
        // Fallback to default beep
        createBeepAudio(audioContextsRef);
        resolve(null);
      });
    } else {
      // Play default beep
      createBeepAudio(audioContextsRef);
      resolve(null);
    }
  });
};
