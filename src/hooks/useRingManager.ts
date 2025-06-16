
import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';

const CUSTOM_RINGTONE_KEY = 'custom_ringtone_url';

export const useRingManager = (
  savedSignals: Signal[],
  antidelaySeconds: number,
  onSignalTriggered: (signal: Signal) => void
) => {
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);

  // Load custom ringtone from localStorage
  useEffect(() => {
    const savedRingtone = localStorage.getItem(CUSTOM_RINGTONE_KEY);
    if (savedRingtone) {
      setCustomRingtone(savedRingtone);
      console.log('🔔 RingManager loaded custom ringtone:', savedRingtone);
    } else {
      console.log('🔔 RingManager: No custom ringtone found');
    }
  }, []);

  // Ring notification
  const triggerRing = async (signal: Signal) => {
    console.log('🔔 Triggering ring for signal:', {
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
    console.log('🔔 About to play audio with ringtone:', customRingtone);
    const audio = await playCustomRingtone(customRingtone, audioContextsRef);
    if (audio instanceof HTMLAudioElement) {
      audioInstancesRef.current.push(audio);
      console.log('🔔 Audio instance added to tracking array');
    }

    // Mark signal as triggered
    onSignalTriggered(signal);
  };

  // Check signals every second for precise timing
  useEffect(() => {
    if (savedSignals.length > 0) {
      console.log('🔔 Starting signal monitoring interval with custom ringtone:', customRingtone);
      
      intervalRef.current = setInterval(() => {
        savedSignals.forEach(signal => {
          if (checkSignalTime(signal, antidelaySeconds)) {
            console.log('🔔 Signal time matched, triggering ring:', signal);
            triggerRing(signal);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          console.log('🔔 Signal monitoring interval cleared');
        }
      };
    }
  }, [savedSignals, customRingtone, antidelaySeconds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = () => {
    console.log('🔔 Ring off button pressed - stopping all audio');
    
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop ALL audio instances immediately
    console.log('🔔 Stopping', audioInstancesRef.current.length, 'audio instances');
    audioInstancesRef.current.forEach((audio, index) => {
      if (audio) {
        console.log('🔔 Stopping audio instance', index);
        audio.pause();
        audio.currentTime = 0;
      }
    });
    audioInstancesRef.current = [];
    
    // Stop ALL Web Audio API contexts
    console.log('🔔 Stopping', audioContextsRef.current.length, 'audio contexts');
    audioContextsRef.current.forEach((context, index) => {
      if (context && context.state !== 'closed') {
        console.log('🔔 Closing audio context', index);
        context.close().catch(err => console.log('🔔 Audio context cleanup error:', err));
      }
    });
    audioContextsRef.current = [];
    
    // Additional cleanup: Stop any remaining audio elements on the page
    const allAudioElements = document.querySelectorAll('audio');
    console.log('🔔 Found', allAudioElements.length, 'audio elements on page to stop');
    allAudioElements.forEach((audio, index) => {
      console.log('🔔 Stopping page audio element', index);
      audio.pause();
      audio.currentTime = 0;
    });
    
    // Stop ringing if currently ringing
    if (isRinging) {
      console.log('🔔 Stopping ringing state');
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
