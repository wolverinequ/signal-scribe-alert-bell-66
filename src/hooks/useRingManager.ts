
import { useState, useRef, useEffect, useCallback } from 'react';
import { Signal } from '@/types/signal';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { signalStateManager } from '@/utils/signalStateManager';

export const useRingManager = (
  customRingtone: string | null,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);

  // Subscribe to signal triggered events from background task
  useEffect(() => {
    const unsubscribe = signalStateManager.onSignalTriggered((signal) => {
      console.log('🔔 RingManager: Signal triggered from state manager');
      // If app is visible, show ring UI
      if (!document.hidden) {
        setIsRinging(true);
        setCurrentRingingSignal(signal);
      }
    });

    return unsubscribe;
  }, []);

  // Memoized triggerRing function to prevent infinite re-renders (Step 1 fix)
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: Triggering ring for signal:', signal.timestamp);
    
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    // Wake up screen on mobile by trying to focus the window
    if (document.hidden) {
      window.focus();
    }

    // Play custom ringtone or default beep and track audio instances
    const audio = await playCustomRingtone(customRingtone, audioContextsRef);
    if (audio instanceof HTMLAudioElement) {
      audioInstancesRef.current.push(audio);
    }

    // Mark signal as triggered through unified state manager
    signalStateManager.markSignalTriggered(signal);
  }, [customRingtone]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = useCallback(() => {
    console.log('🔔 RingManager: Ring off button pressed');
    
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop ALL audio instances immediately with error handling for invalid blob URLs
    audioInstancesRef.current.forEach((audio) => {
      if (audio) {
        try {
          // Remove error event listeners first to prevent triggering alerts
          audio.onerror = null;
          audio.onabort = null;
          
          audio.pause();
          audio.currentTime = 0;
          
          // Clear the source to prevent further errors
          audio.src = '';
          audio.load();
        } catch (error) {
          // Silently ignore errors when stopping audio (e.g., invalid blob URLs)
          console.log('🔔 RingManager: Audio cleanup error (ignored):', error);
        }
      }
    });
    audioInstancesRef.current = [];
    
    // Stop ALL Web Audio API contexts
    audioContextsRef.current.forEach((context) => {
      if (context && context.state !== 'closed') {
        context.close().catch(err => console.error('Audio context cleanup error:', err));
      }
    });
    audioContextsRef.current = [];
    
    // Additional cleanup: Stop any remaining audio elements on the page with error handling
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach((audio) => {
      try {
        // Remove error handlers to prevent alerts during cleanup
        audio.onerror = null;
        audio.onabort = null;
        
        audio.pause();
        audio.currentTime = 0;
        
        // Clear source to prevent blob URL errors
        audio.src = '';
        audio.load();
      } catch (error) {
        // Silently ignore cleanup errors
        console.log('🔔 RingManager: Global audio cleanup error (ignored):', error);
      }
    });
    
    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    handleRingOff,
    triggerRing
  };
};
