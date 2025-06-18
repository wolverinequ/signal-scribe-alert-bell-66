
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
  const [isRingOffInProgress, setIsRingOffInProgress] = useState(false);
  
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);

  // Helper function to validate blob URL
  const isValidBlobUrl = useCallback((url: string | null): boolean => {
    if (!url) return false;
    if (!url.startsWith('blob:')) return false;
    
    // Additional validation - check if blob URL is still accessible
    try {
      // Create a temporary audio element to test the URL
      const testAudio = new Audio();
      testAudio.src = url;
      return true;
    } catch (error) {
      console.warn('🔔 RingManager: Invalid blob URL detected:', url);
      return false;
    }
  }, []);

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

  // Memoized triggerRing function to prevent infinite re-renders
  const triggerRing = useCallback(async (signal: Signal) => {
    console.log('🔔 RingManager: Triggering ring for signal:', signal.timestamp);
    
    // Don't trigger ring if ring off is in progress
    if (isRingOffInProgress) {
      console.log('🔔 RingManager: Ring off in progress, skipping ring trigger');
      return;
    }
    
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Wake up screen if supported
    const lock = await requestWakeLock();
    setWakeLock(lock);

    // Wake up screen on mobile by trying to focus the window
    if (document.hidden) {
      window.focus();
    }

    // Validate custom ringtone URL before playing
    if (customRingtone && !isValidBlobUrl(customRingtone)) {
      console.warn('🔔 RingManager: Invalid custom ringtone URL, skipping audio playback');
      signalStateManager.markSignalTriggered(signal);
      return;
    }

    // Play custom ringtone or default beep and track audio instances
    try {
      const audio = await playCustomRingtone(customRingtone, audioContextsRef, false); // Pass isCleanupMode = false
      if (audio instanceof HTMLAudioElement) {
        // Validate audio instance before adding to tracking
        if (audio.src && isValidBlobUrl(audio.src)) {
          audioInstancesRef.current.push(audio);
          console.log('🔔 RingManager: Audio instance tracked, total instances:', audioInstancesRef.current.length);
        }
      }
    } catch (error) {
      console.warn('🔔 RingManager: Error during audio playback:', error);
    }

    // Mark signal as triggered through unified state manager
    signalStateManager.markSignalTriggered(signal);
  }, [customRingtone, isValidBlobUrl, isRingOffInProgress]);

  // Enhanced ring off button handler with better error handling
  const handleRingOff = useCallback(() => {
    console.log('🔔 RingManager: Ring off button pressed');
    
    setIsRingOffInProgress(true);
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop ALL audio instances with graceful error handling
    console.log('🔔 RingManager: Cleaning up audio instances, count:', audioInstancesRef.current.length);
    
    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        try {
          // Validate audio instance before cleanup
          if (audio.src && !audio.paused) {
            audio.pause();
            audio.currentTime = 0;
            console.log(`🔔 RingManager: Audio instance ${index} stopped successfully`);
          }
        } catch (error) {
          // Suppress errors during cleanup - these are expected when blob URLs are invalid
          console.log(`🔔 RingManager: Expected cleanup error for audio instance ${index}:`, error.message);
        }
      }
    });
    audioInstancesRef.current = [];
    
    // Stop ALL Web Audio API contexts with graceful error handling
    console.log('🔔 RingManager: Cleaning up audio contexts, count:', audioContextsRef.current.length);
    
    audioContextsRef.current.forEach((context, index) => {
      if (context && context.state !== 'closed') {
        context.close().catch(err => {
          console.log(`🔔 RingManager: Expected cleanup error for audio context ${index}:`, err.message);
        });
      }
    });
    audioContextsRef.current = [];
    
    // Additional cleanup: Stop any remaining audio elements on the page with error suppression
    try {
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach((audio, index) => {
        try {
          if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
          }
        } catch (error) {
          console.log(`🔔 RingManager: Expected cleanup error for DOM audio ${index}:`, error.message);
        }
      });
    } catch (error) {
      console.log('🔔 RingManager: Expected DOM cleanup error:', error.message);
    }
    
    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      releaseWakeLock(wakeLock);
      setWakeLock(null);
    }
    
    // Reset ring off progress flag after cleanup
    setTimeout(() => {
      setIsRingOffInProgress(false);
      console.log('🔔 RingManager: Ring off cleanup completed');
    }, 100);
  }, [isRinging, wakeLock]);

  return {
    isRinging,
    currentRingingSignal,
    ringOffButtonPressed,
    isRingOffInProgress,
    handleRingOff,
    triggerRing
  };
};
