
import { useState, useRef } from 'react';
import { Signal } from '@/types/signal';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { triggerImmediateWakeUp } from '@/utils/enhancedBackgroundTaskManager';

export const useRingManager = (customRingtone: string | null) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);

  // Enhanced ring notification with native wake-up
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // ENHANCED: Use native wake-up first
    try {
      const wakeUpSuccess = await triggerImmediateWakeUp(signal);
      console.log('Native wake-up result:', wakeUpSuccess);
    } catch (error) {
      console.error('Native wake-up failed, falling back to web methods:', error);
    }
    
    // Fallback to web wake-up methods
    try {
      const { forceScreenWakeUp } = await import('@/utils/wakeLockUtils');
      await forceScreenWakeUp();
      
      const lock = await requestWakeLock();
      setWakeLock(lock);
    } catch (error) {
      console.error('Web wake-up failed:', error);
      const lock = await requestWakeLock();
      setWakeLock(lock);
    }

    // Send wake-up request to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'WAKE_UP_REQUEST',
        signal: signal
      });
    }

    // Play custom ringtone or default beep
    const audio = await playCustomRingtone(customRingtone, audioContextsRef);
    if (audio instanceof HTMLAudioElement) {
      audioInstancesRef.current.push(audio);
    }
  };

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
    
    // Stop ALL Web Audio API contexts
    audioContextsRef.current.forEach(context => {
      if (context && context.state !== 'closed') {
        context.close().catch(err => console.log('Audio context cleanup error:', err));
      }
    });
    audioContextsRef.current = [];
    
    // Additional cleanup: Stop any remaining audio elements on the page
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    
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
    triggerRing,
    handleRingOff
  };
};
