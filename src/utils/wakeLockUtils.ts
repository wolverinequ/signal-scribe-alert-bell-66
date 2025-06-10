
export const requestWakeLock = async (): Promise<WakeLockSentinel | null> => {
  if ('wakeLock' in navigator) {
    try {
      const lock = await navigator.wakeLock.request('screen');
      return lock;
    } catch (err) {
      console.log('Wake lock not supported:', err);
      return null;
    }
  }
  return null;
};

export const releaseWakeLock = (wakeLock: WakeLockSentinel | null) => {
  if (wakeLock) {
    wakeLock.release();
  }
};
