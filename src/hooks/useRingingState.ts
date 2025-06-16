
import { useState, useCallback } from 'react';
import { Signal } from '@/types/signal';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';

export const useRingingState = () => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  const startRinging = useCallback(async (signal: Signal) => {
    console.log('🔔 RingingState: Starting ring for signal:', signal);
    setIsRinging(true);
    setCurrentRingingSignal(signal);

    const lock = await requestWakeLock();
    setWakeLock(lock);

    if (document.hidden) {
      try {
        window.focus();
      } catch (e) {
        console.log('⚠️ RingingState: Could not focus window:', e);
      }
    }
  }, []);

  const stopRinging = useCallback(() => {
    console.log('🔇 RingingState: Stopping ring');
    setIsRinging(false);
    setCurrentRingingSignal(null);
    if (wakeLock) {
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    startRinging,
    stopRinging
  };
};
