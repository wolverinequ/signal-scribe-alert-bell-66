
import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { useAudioManager } from './useAudioManager';

export const useRingManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  const [alreadyRangIds, setAlreadyRangIds] = useState<Set<string>>(new Set());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const { customRingtone, isRingtoneLoaded } = useAudioManager();

  // Helper: construct unique signal ID
  function getSignalId(signal: Signal): string {
    return `${signal.asset}-${signal.direction}-${signal.timestamp}`;
  }

  // Ring notification - only if MP3 is loaded
  const triggerRing = async (signal: Signal) => {
    if (!isRingtoneLoaded || !customRingtone) {
      console.log('Cannot ring - no MP3 file loaded');
      return;
    }

    setIsRinging(true);
    setCurrentRingingSignal(signal);

    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    if (document.hidden) {
      window.focus();
    }

    try {
      // Play custom ringtone and track audio instances
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
      }

      // Mark signal as triggered so we can't ring again for this timestamp
      onSignalTriggered(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(getSignalId(signal));
        return newSet;
      });
    } catch (error) {
      console.log('Failed to play ringtone:', error);
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  };

  // Check signals every second for precise timing - only if MP3 is loaded
  useEffect(() => {
    if (savedSignals.length > 0 && isRingtoneLoaded) {
      intervalRef.current = setInterval(() => {
        savedSignals.forEach(signal => {
          if (
            checkSignalTime(signal, antidelaySeconds) && 
            !alreadyRangIds.has(getSignalId(signal))
          ) {
            triggerRing(signal);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    // eslint-disable-next-line
  }, [savedSignals, customRingtone, antidelaySeconds, alreadyRangIds, isRingtoneLoaded]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = () => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    // Stop ALL audio instances immediately
    audioInstancesRef.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];

    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  };

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
