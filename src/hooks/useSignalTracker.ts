
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
  const [screenOffButtonPressed, setScreenOffButtonPressed] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();

  // Ring notification
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    // Play custom ringtone or default beep
    await playCustomRingtone(customRingtone);

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

  // Ring off button handlers
  const handleRingOffStart = () => {
    setRingOffButtonPressed(true);
    
    // Start long press timer for ringtone selection (3 seconds)
    longPressTimerRef.current = setTimeout(() => {
      triggerRingtoneSelection();
    }, 3000);
  };

  const handleRingOffEnd = () => {
    setRingOffButtonPressed(false);
    
    // Clear long press timer if it hasn't fired yet
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If it was a short press, stop ringing
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

  // Screen off button handler
  const handleScreenOff = () => {
    setScreenOffButtonPressed(true);
    setTimeout(() => setScreenOffButtonPressed(false), 200);
    
    // Turn off the screen by requesting screen wake lock and then releasing it
    // This is a workaround as there's no direct API to turn off screen
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        // Immediately release to simulate screen off
        lock.release();
        
        // Also try to minimize/blur the window
        if (window.blur) {
          window.blur();
        }
        
        // Hide the page content as a visual cue
        document.body.style.backgroundColor = '#000';
        document.body.style.color = '#000';
        
        // Restore after a short delay
        setTimeout(() => {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }, 1000);
      }).catch(() => {
        // Fallback: just hide content briefly
        document.body.style.backgroundColor = '#000';
        document.body.style.color = '#000';
        
        setTimeout(() => {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }, 1000);
      });
    }
  };

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    screenOffButtonPressed,
    handleRingOffStart,
    handleRingOffEnd,
    handleSaveSignals,
    handleScreenOff
  };
};
