
export const playCustomRingtone = (customRingtone: string | null): Promise<HTMLAudioElement | null> => {
  return new Promise((resolve, reject) => {
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.loop = true;
      audio.play().then(() => {
        console.log('Custom ringtone playing successfully');
        resolve(audio);
      }).catch(err => {
        console.log('Error playing custom ringtone:', err);
        reject(err);
      });
    } else {
      console.log('No custom ringtone available');
      reject(new Error('No custom ringtone available'));
    }
  });
};
