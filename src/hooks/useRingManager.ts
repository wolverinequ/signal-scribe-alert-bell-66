
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('Attempting to trigger ring for signal:', signal);
    console.log('Ringtone loaded:', isRingtoneLoaded);
    console.log('Custom ringtone URL:', customRingtone);

    if (!isRingtoneLoaded || !customRingtone) {
      console.log('Cannot ring - no MP3 file loaded');
      return;
    }

    setIsRinging(true);
    setCurrentRingingSignal(signal);

    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    // Focus window for visibility
    if (document.hidden) {
      try {
        window.focus();
      } catch (e) {
        console.log('Could not focus window:', e);
      }
    }

    try {
      console.log('Playing custom ringtone...');
      // Play custom ringtone and track audio instances
      const audio = await playCustomRingtone(customRingtone);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
        console.log('Audio instance added to tracking');
      }

      // Mark signal as triggered so we can't ring again for this timestamp
      onSignalTriggered(signal);
      setAlreadyRangIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(getSignalId(signal));
        return newSet;
      });
      
      console.log('Signal marked as triggered:', getSignalId(signal));
    } catch (error) {
      console.error('Failed to play ringtone:', error);
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [customRingtone, isRingtoneLoaded, onSignalTriggered]);

  // Check signals every second for precise timing - only if MP3 is loaded
  useEffect(() => {
    if (savedSignals.length > 0 && isRingtoneLoaded && customRingtone) {
      console.log('Starting signal monitoring with', savedSignals.length, 'signals');
      
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        savedSignals.forEach(signal => {
          const signalId = getSignalId(signal);
          const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
          const notAlreadyRang = !alreadyRangIds.has(signalId);
          
          if (shouldTrigger && notAlreadyRang) {
            console.log(`Signal should trigger at ${currentTime}:`, signal);
            triggerRing(signal);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          console.log('Signal monitoring stopped');
        }
      };
    } else {
      console.log('Signal monitoring not started - missing requirements:', {
        signalsCount: savedSignals.length,
        ringtoneLoaded: isRingtoneLoaded,
        hasCustomRingtone: !!customRingtone
      });
    }
  }, [savedSignals, customRingtone, antidelaySeconds, alreadyRangIds, isRingtoneLoaded, triggerRing]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = () => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);

    console.log('Ring off pressed - stopping', audioInstancesRef.current.length, 'audio instances');

    // Stop ALL audio instances immediately
    audioInstancesRef.current.forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        console.log('Audio instance stopped');
      }
    });
    audioInstancesRef.current = [];

    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
      console.log('Ringing state cleared');
    }
  };

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff
  };
};
