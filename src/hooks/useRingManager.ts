
import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';

export const useRingManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  customRingtone: string | null,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);
  
  // Time-based tracking to prevent multiple rings for the same signal
  const recentlyTriggeredRef = useRef<Map<string, number>>(new Map());

  // Helper function to create unique signal identifier
  const getSignalId = (signal: Signal): string => {
    return `${signal.timestamp}-${signal.timeframe}-${signal.asset}-${signal.direction}`;
  };

  // Helper function to check if signal was recently triggered (within 5 minutes)
  const wasRecentlyTriggered = (signalId: string): boolean => {
    const triggeredTime = recentlyTriggeredRef.current.get(signalId);
    if (!triggeredTime) return false;
    
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    // Clean up old entries while checking
    if (now - triggeredTime > fiveMinutesInMs) {
      recentlyTriggeredRef.current.delete(signalId);
      console.log('🔔 RingManager: Cleaned up old tracking for signal:', signalId);
      return false;
    }
    
    return true;
  };

  // Helper function to mark signal as recently triggered
  const markAsTriggered = (signalId: string) => {
    const now = Date.now();
    recentlyTriggeredRef.current.set(signalId, now);
    console.log('🔔 RingManager: Marked signal as triggered:', signalId, 'at', new Date(now).toLocaleTimeString());
  };

  // Cleanup old tracking entries periodically
  const cleanupOldEntries = () => {
    const now = Date.now();
    const fiveMinutesInMs = 5 * 60 * 1000;
    
    for (const [signalId, triggeredTime] of recentlyTriggeredRef.current.entries()) {
      if (now - triggeredTime > fiveMinutesInMs) {
        recentlyTriggeredRef.current.delete(signalId);
        console.log('🔔 RingManager: Cleaned up expired tracking for signal:', signalId);
      }
    }
  };

  // Ring notification
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

    // Mark signal as triggered
    onSignalTriggered(signal);
  };

  // Check signals every second for precise timing using cached data
  useEffect(() => {
    // Clear previous interval and cleanup tracking on restart
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      console.log('🔔 RingManager: Previous signal monitoring interval cleared');
    }

    if (savedSignals.length > 0) {
      console.log('🔔 RingManager: Starting signal monitoring interval for', savedSignals.length, 'signals');
      
      // Clean up old tracking entries when starting new interval
      cleanupOldEntries();
      
      intervalRef.current = setInterval(() => {
        // Periodic cleanup of old entries
        cleanupOldEntries();
        
        // Use the savedSignals prop directly instead of loading from storage
        savedSignals.forEach(signal => {
          const signalId = getSignalId(signal);
          
          // Check if signal time matches and hasn't been recently triggered
          if (checkSignalTime(signal, antidelaySeconds) && !wasRecentlyTriggered(signalId)) {
            console.log('🔔 RingManager: Signal time matched, triggering ring:', signal);
            
            // Mark as triggered with timestamp
            markAsTriggered(signalId);
            
            // Trigger the ring
            triggerRing(signal);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          console.log('🔔 RingManager: Signal monitoring interval cleared');
        }
      };
    }
  }, [savedSignals, antidelaySeconds]); // Removed customRingtone from dependencies

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
    handleRingOff
  };
};
