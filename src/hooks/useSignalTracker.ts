
import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals, checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { useAudioManager } from './useAudioManager';

export const useSignalTracker = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();

  // Ring notification
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    // Wake up screen on mobile by trying to focus the window
    if (document.hidden) {
      window.focus();
    }

    // Play custom ringtone or default beep
    const audio = await playCustomRingtone(customRingtone);
    if (audio instanceof HTMLAudioElement) {
      audioRef.current = audio;
    }

    // Mark signal as triggered
    setSavedSignals(prev => 
      prev.map(s => 
        s === signal ? { ...s, triggered: true } : s
      )
    );
  };

  // Check signals every minute
  useEffect(() => {
    if (savedSignals.length > 0) {
      intervalRef.current = setInterval(() => {
        savedSignals.forEach(signal => {
          if (checkSignalTime(signal)) {
            triggerRing(signal);
          }
        });
      }, 1000); // Check every second for accuracy

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [savedSignals, customRingtone]);

  // Ring off button handler - stops all audio immediately
  const handleRingOff = () => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop all audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Stop any Web Audio API sounds
    if (window.AudioContext || (window as any).webkitAudioContext) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.close();
      } catch (err) {
        console.log('Audio context cleanup error:', err);
      }
    }
    
    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  };

  // Save signals button handler
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    setSavedSignals(signals);
  };

  // Set Ring button handler
  const handleSetRing = () => {
    setSetRingButtonPressed(true);
    setTimeout(() => setSetRingButtonPressed(false), 200);
    
    triggerRingtoneSelection();
  };

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    setRingButtonPressed,
    handleRingOff,
    handleSaveSignals,
    handleSetRing
  };
};
