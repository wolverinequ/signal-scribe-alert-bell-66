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

  // Enhanced mobile screen wake function for Android
  const wakeUpMobileScreen = async () => {
    try {
      console.log('Starting aggressive screen wake sequence...');
      
      // 1. Request wake lock immediately
      const lock = await requestWakeLock();
      setWakeLock(lock);

      // 2. Force document visibility change events
      if (document.hidden) {
        // Dispatch multiple visibility events
        document.dispatchEvent(new Event('visibilitychange'));
        document.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('focus'));
        
        // Try to focus the window aggressively
        window.focus();
        
        // Simulate user interaction to wake screen
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        document.body.dispatchEvent(clickEvent);
        
        // Simulate touch events for mobile
        const touchEvent = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [] as any
        });
        document.body.dispatchEvent(touchEvent);
      }

      // 3. Create fullscreen notification with high priority
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🚨 TRADING SIGNAL ALERT! 🚨', {
          body: 'Important trading signal is ready - Check now!',
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: 'urgent-signal-alert',
          requireInteraction: true,
          silent: false
        });

        // Keep notification visible longer
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      // 4. Try to request fullscreen to force screen activation
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          // Exit fullscreen after a moment
          setTimeout(() => {
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }, 1000);
        }
      } catch (fullscreenError) {
        console.log('Fullscreen wake attempt failed:', fullscreenError);
      }

      // 5. Create a temporary bright overlay to force screen brightness
      const wakeOverlay = document.createElement('div');
      wakeOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 999999;
        opacity: 1;
        pointer-events: none;
      `;
      document.body.appendChild(wakeOverlay);
      
      // Remove overlay after brief flash
      setTimeout(() => {
        if (document.body.contains(wakeOverlay)) {
          document.body.removeChild(wakeOverlay);
        }
      }, 200);

      // 6. Force page refresh if still hidden (last resort)
      setTimeout(() => {
        if (document.hidden) {
          console.log('Page still hidden, attempting location refresh...');
          window.location.href = window.location.href + '#wake';
        }
      }, 1000);

      console.log('Screen wake sequence completed');
      return lock;
    } catch (error) {
      console.log('Screen wake failed:', error);
      return null;
    }
  };

  // Ring notification with enhanced mobile wake
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    console.log('🚨 ALERT TRIGGERED - Attempting aggressive screen wake for Android');
    
    // Wake up mobile screen with maximum effort
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
