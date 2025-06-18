
import { useState, useRef, useEffect } from 'react';
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
      console.log('🔔 RingManager: Received signal triggered from state manager:', signal.timestamp);
      // If app is visible, show ring UI
      if (!document.hidden) {
        setIsRinging(true);
        setCurrentRingingSignal(signal);
      }
    });

    return unsubscribe;
  }, []);

  // Ring notification - called from background task
  const triggerRing = async (signal: Signal) => {
    console.log('🔔 RingManager: Triggering ring for signal:', {
      signal,
      customRingtoneUrl: customRingtone,
      hasCustomRingtone: !!customRingtone
    });
    
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
    console.log('🔔 RingManager: About to play audio with ringtone:', customRingtone);
    const audio = await playCustomRingtone(customRingtone, audioContextsRef);
    if (audio instanceof HTMLAudioElement) {
      audioInstancesRef.current.push(audio);
      console.log('🔔 RingManager: Audio instance added to tracking array');
    }

    // Mark signal as triggered through unified state manager
    signalStateManager.markSignalTriggered(signal);
  };

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = () => {
    console.log('🔔 RingManager: Ring off button pressed - stopping all audio');
    
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop ALL audio instances immediately
    console.log('🔔 RingManager: Stopping', audioInstancesRef.current.length, 'audio instances');
    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log('🔔 RingManager: Stopping audio instance', index);
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];
    
    // Stop ALL Web Audio API contexts
    console.log('🔔 RingManager: Stopping', audioContextsRef.current.length, 'audio contexts');
    audioContextsRef.current.forEach((context, index) => {
      if (context && context.state !== 'closed') {
        console.log('🔔 RingManager: Closing audio context', index);
        context.close().catch(err => console.log('🔔 RingManager: Audio context cleanup error:', err));
      }
    });
    audioContextsRef.current = [];
    
    // Additional cleanup: Stop any remaining audio elements on the page
    const allAudioElements = document.querySelectorAll('audio');
    console.log('🔔 RingManager: Found', allAudioElements.length, 'audio elements on page to stop');
    allAudioElements.forEach((audio, index) => {
      console.log('🔔 RingManager: Stopping page audio element', index);
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop ringing if currently ringing
    if (isRinging) {
      console.log('🔔 RingManager: Stopping ringing state');
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
    handleRingOff,
    triggerRing // Export this for background task to call
  };
};
