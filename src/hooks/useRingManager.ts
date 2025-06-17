
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

  // Manual test function for custom ringtone
  const testCustomRingtone = async () => {
    console.log('🔔 RingManager: Manual ringtone test triggered with:', customRingtone);
    try {
      const audio = await playCustomRingtone(customRingtone, audioContextsRef);
      if (audio instanceof HTMLAudioElement) {
        audioInstancesRef.current.push(audio);
        console.log('🔔 RingManager: Manual test audio instance added to tracking array');
        
        // Stop after 3 seconds for testing
        setTimeout(() => {
          console.log('🔔 RingManager: Stopping manual test audio');
          audio.pause();
          audio.currentTime = 0;
          const index = audioInstancesRef.current.indexOf(audio);
          if (index > -1) {
            audioInstancesRef.current.splice(index, 1);
          }
        }, 3000);
      }
    } catch (error) {
      console.error('🔔 RingManager: Error during manual ringtone test:', error);
    }
  };

  // Check signals every second for precise timing using cached data
  useEffect(() => {
    if (savedSignals.length > 0) {
      console.log('🔔 RingManager: Starting signal monitoring interval with', savedSignals.length, 'signals');
      console.log('🔔 RingManager: Signals to monitor:', savedSignals.map(s => ({
        timestamp: s.timestamp,
        triggered: s.triggered,
        asset: s.asset,
        direction: s.direction
      })));
      console.log('🔔 RingManager: Using custom ringtone:', customRingtone);
      
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        console.log('🔔 RingManager: Checking signals at:', currentTime);
        
        // Use the savedSignals prop directly instead of loading from storage
        savedSignals.forEach((signal, index) => {
          const shouldTrigger = checkSignalTime(signal, antidelaySeconds);
          console.log(`🔔 RingManager: Signal ${index} (${signal.timestamp}) check result:`, {
            shouldTrigger,
            triggered: signal.triggered,
            currentTime,
            antidelaySeconds
          });
          
          if (shouldTrigger) {
            console.log('🔔 RingManager: Signal time matched, triggering ring:', signal);
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
    } else {
      console.log('🔔 RingManager: No signals to monitor');
    }
  }, [savedSignals, customRingtone, antidelaySeconds]);

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
    testCustomRingtone
  };
};
