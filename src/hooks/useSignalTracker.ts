import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals, checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { useAudioManager } from './useAudioManager';
import ScreenControl from '@/plugins/screenControl';

export const useSignalTracker = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  const [screenOffButtonPressed, setScreenOffButtonPressed] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();

  // Ring notification with native wake lock
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Use native wake lock
    try {
      await ScreenControl.acquireWakeLock();
    } catch (error) {
      console.log('Failed to acquire native wake lock:', error);
    }

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

  // Ring off button handlers with native functionality
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
      
      // Release native wake lock
      try {
        ScreenControl.releaseWakeLock();
      } catch (error) {
        console.log('Failed to release native wake lock:', error);
      }
    }
  };

  // Save signals button handler
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    setSavedSignals(signals);
  };

  // Native screen off button handler
  const handleScreenOff = async () => {
    setScreenOffButtonPressed(true);
    setTimeout(() => setScreenOffButtonPressed(false), 200);
    
    try {
      await ScreenControl.turnOffScreen();
      console.log('Screen turned off successfully');
    } catch (error) {
      console.log('Failed to turn off screen:', error);
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
