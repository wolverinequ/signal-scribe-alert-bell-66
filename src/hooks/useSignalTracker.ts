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
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();

  // Enhanced mobile screen wake function
  const wakeUpMobileScreen = async () => {
    try {
      // Request wake lock to keep screen on
      const lock = await requestWakeLock();
      setWakeLock(lock);

      // Additional mobile wake-up techniques
      if (document.hidden) {
        // Try to focus the window
        window.focus();
        
        // Trigger user interaction events that might wake the screen
        document.dispatchEvent(new Event('visibilitychange'));
        document.dispatchEvent(new Event('touchstart', { bubbles: true }));
        document.dispatchEvent(new Event('click', { bubbles: true }));
      }

      // For mobile browsers, try to make the page visible
      if ('wakeLock' in navigator) {
        console.log('Wake lock requested for screen activation');
      }

      // Vibration to help wake the device (if supported)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      // Show notification to wake screen
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Signal Alert!', {
          body: 'Trading signal notification',
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: 'signal-alert',
          requireInteraction: true
        });

        // Auto-close notification after a few seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return lock;
    } catch (error) {
      console.log('Wake lock request failed:', error);
      return null;
    }
  };

  // Ring notification with enhanced mobile wake
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    console.log('Alert triggered - attempting to wake mobile screen');
    
    // Wake up mobile screen immediately
    await wakeUpMobileScreen();

    // Play custom ringtone or default beep and track audio instances
    const audio = await playCustomRingtone(customRingtone, audioContextsRef);
    if (audio instanceof HTMLAudioElement) {
      audioInstancesRef.current.push(audio);
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
