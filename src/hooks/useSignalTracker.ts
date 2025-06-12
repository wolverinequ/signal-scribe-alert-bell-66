import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals, checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { triggerAndroidScreenWake, sendWakeMessageToServiceWorker, requestAndroidPermissions } from '@/utils/androidWakeUtils';
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

  // Initialize Android permissions on component mount
  useEffect(() => {
    requestAndroidPermissions();
  }, []);

  // Enhanced comprehensive screen wake function
  const comprehensiveScreenWake = async (): Promise<boolean> => {
    console.log('🚨 Starting COMPREHENSIVE screen wake sequence');
    let wakeSuccess = false;
    
    try {
      // Step 1: Try Android native wake first
      const androidWakeResult = await triggerAndroidScreenWake();
      if (androidWakeResult) {
        console.log('✅ Android native wake triggered');
        wakeSuccess = true;
      }
      
      // Step 2: Service worker wake notification
      sendWakeMessageToServiceWorker();
      
      // Step 3: Request wake lock immediately
      const lock = await requestWakeLock();
      setWakeLock(lock);
      if (lock) {
        console.log('✅ Wake lock acquired');
        wakeSuccess = true;
      }

      // Step 4: High-priority browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('🚨 TRADING SIGNAL ALERT! 🚨', {
          body: 'URGENT: Important trading signal detected - Check NOW!',
          icon: '/placeholder.svg',
          badge: '/placeholder.svg',
          tag: 'urgent-signal-alert',
          requireInteraction: true,
          silent: false
        });

        // Keep notification visible longer
        setTimeout(() => {
          notification.close();
        }, 15000);
        
        console.log('✅ Browser notification triggered');
        wakeSuccess = true;
      }

      // Step 5: Multiple document/window focus attempts
      if (document.hidden) {
        // Dispatch multiple visibility and focus events
        document.dispatchEvent(new Event('visibilitychange'));
        document.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('focus'));
        
        // Force window focus
        window.focus();
        
        // Simulate user interactions
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(eventType => {
          const event = new Event(eventType, { bubbles: true, cancelable: true });
          document.body.dispatchEvent(event);
        });
        
        console.log('✅ Focus events dispatched');
      }

      // Step 6: Fullscreen wake attempt
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setTimeout(() => {
            if (document.exitFullscreen) {
              document.exitFullscreen().catch(() => {});
            }
          }, 1500);
          console.log('✅ Fullscreen wake attempted');
        }
      } catch (fullscreenError) {
        console.log('⚠️ Fullscreen wake failed:', fullscreenError);
      }

      // Step 7: Bright flash overlay for maximum wake effect
      const wakeOverlay = document.createElement('div');
      wakeOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(45deg, #fff, #ff0000, #fff, #ff0000);
        z-index: 9999999;
        opacity: 1;
        pointer-events: none;
        animation: flash 0.5s ease-in-out 3;
      `;
      
      // Add flash animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes flash {
          0%, 100% { opacity: 1; background: white; }
          50% { opacity: 0.8; background: red; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(wakeOverlay);
      
      // Remove overlay and style after flashing
      setTimeout(() => {
        if (document.body.contains(wakeOverlay)) {
          document.body.removeChild(wakeOverlay);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 2000);

      // Step 8: Audio-based wake (loud beeps)
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000; // High frequency for wake
        oscillator.type = 'sawtooth';
        gainNode.gain.value = 0.8; // Loud volume
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
        
        console.log('✅ Audio wake beep triggered');
      } catch (audioError) {
        console.log('⚠️ Audio wake failed:', audioError);
      }

      console.log(`🎯 Comprehensive wake sequence completed. Success: ${wakeSuccess}`);
      return wakeSuccess;
      
    } catch (error) {
      console.error('❌ Comprehensive screen wake failed:', error);
      return false;
    }
  };

  // Ring notification with enhanced wake sequence
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    console.log('🚨 SIGNAL ALERT TRIGGERED - Starting comprehensive wake sequence');
    
    // Execute comprehensive wake sequence
    await comprehensiveScreenWake();

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
