
export const createBeepAudio = () => {
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
  
  return oscillator;
};

export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = true; // Loop the ringtone
      audio.play().then(() => {
        resolve(audio);
      }).catch(err => {
        console.log('Error playing custom ringtone:', err);
        // Fallback to default beep
        createBeepAudio();
        resolve(null);
      });
    } else {
      // Play default beep
      createBeepAudio();
      resolve(null);
    }
  });
};
