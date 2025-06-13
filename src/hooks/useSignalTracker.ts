import { useState, useEffect, useRef } from 'react';
import { Signal } from '@/types/signal';
import { parseSignals, checkSignalTime } from '@/utils/signalUtils';
import { playCustomRingtone } from '@/utils/audioUtils';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLockUtils';
import { signalCommunicator } from '@/utils/communicationUtils';
import { sendToServiceWorker, scheduleBackgroundSignalCheck } from '@/utils/serviceWorkerUtils';
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
  const [antidelaySeconds, setAntidelaySeconds] = useState(15); // Changed default to 15
  const [showAntidelayDialog, setShowAntidelayDialog] = useState(false);
  const [antidelayInput, setAntidelayInput] = useState('');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioInstancesRef = useRef<HTMLAudioElement[]>([]);
  const audioContextsRef = useRef<AudioContext[]>([]);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const aboutToRingNotifiedRef = useRef<Set<string>>(new Set());
  const { customRingtone, triggerRingtoneSelection } = useAudioManager();

  // Ring notification
  const triggerRing = async (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Notify other apps that ringing is happening
    signalCommunicator.notifyRinging(signal);
    
    // Send to service worker
    sendToServiceWorker({
      type: 'SIGNAL_RINGING',
      data: { signal }
    });
    
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

    // Mark signal as triggered
    setSavedSignals(prev => 
      prev.map(s => 
        s === signal ? { ...s, triggered: true } : s
      )
    );
  };

  // Check for "about to ring" notifications (5 seconds before)
  const checkAboutToRing = (signal: Signal) => {
    const signalKey = `${signal.asset}-${signal.timestamp}`;
    if (aboutToRingNotifiedRef.current.has(signalKey)) {
      return;
    }

    const now = new Date();
    const [signalHours, signalMinutes] = signal.timestamp.split(':').map(Number);
    
    const signalDate = new Date();
    signalDate.setHours(signalHours, signalMinutes, 0, 0);
    
    const targetTime = new Date(signalDate.getTime() - (antidelaySeconds * 1000));
    const aboutToRingTime = new Date(targetTime.getTime() - 5000); // 5 seconds before ring time
    
    const timeDiff = Math.abs(now.getTime() - aboutToRingTime.getTime());
    
    if (timeDiff <= 1000 && !signal.triggered) { // Within 1 second of "about to ring" time
      aboutToRingNotifiedRef.current.add(signalKey);
      signalCommunicator.notifyAboutToRing(signal, 5);
      
      sendToServiceWorker({
        type: 'SIGNAL_ABOUT_TO_RING',
        data: { signal, secondsUntilRing: 5 }
      });
    }
  };

  // Check signals every second for precise timing
  useEffect(() => {
    if (savedSignals.length > 0) {
      intervalRef.current = setInterval(() => {
        savedSignals.forEach(signal => {
          // Check for about to ring notification
          checkAboutToRing(signal);
          
          // Check for actual ring time
          if (checkSignalTime(signal, antidelaySeconds)) {
            triggerRing(signal);
          }
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [savedSignals, customRingtone, antidelaySeconds]);

  // Ring off button handler - stops ALL audio immediately
  const handleRingOff = () => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Notify other apps that ringing stopped
    signalCommunicator.notifyRingStopped();
    
    sendToServiceWorker({
      type: 'RING_STOPPED',
      data: {}
    });
    
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
    
    // Store signals in service worker for background processing
    sendToServiceWorker({
      type: 'STORE_SIGNALS',
      data: { signals, antidelaySeconds }
    });
    
    // Schedule background sync
    scheduleBackgroundSignalCheck(signals);
    
    // Reset about to ring notifications
    aboutToRingNotifiedRef.current.clear();
  };

  // Set Ring button handlers
  const handleSetRingMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(true);
    isLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Long press detected - show antidelay dialog
      setShowAntidelayDialog(true);
      setAntidelayInput(antidelaySeconds.toString());
    }, 3000);
  };

  const handleSetRingMouseUp = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSetRingButtonPressed(false);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // If it wasn't a long press and dialog is not showing, trigger ringtone selection
    if (!isLongPressRef.current && !showAntidelayDialog) {
      triggerRingtoneSelection();
    }
  };

  const handleSetRingMouseLeave = () => {
    setSetRingButtonPressed(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Antidelay dialog handlers
  const handleAntidelaySubmit = () => {
    const seconds = parseInt(antidelayInput);
    if (!isNaN(seconds) && seconds >= 0 && seconds <= 99) {
      setAntidelaySeconds(seconds);
      setShowAntidelayDialog(false);
      setAntidelayInput('');
      
      // Update service worker with new antidelay setting
      if (savedSignals.length > 0) {
        sendToServiceWorker({
          type: 'STORE_SIGNALS',
          data: { signals: savedSignals, antidelaySeconds: seconds }
        });
      }
    }
  };

  const handleAntidelayCancel = () => {
    setShowAntidelayDialog(false);
    setAntidelayInput('');
  };

  // Cleanup communication on unmount
  useEffect(() => {
    return () => {
      signalCommunicator.cleanup();
    };
  }, []);

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    setRingButtonPressed,
    showAntidelayDialog,
    antidelayInput,
    setAntidelayInput,
    antidelaySeconds,
    handleRingOff,
    handleSaveSignals,
    handleSetRingMouseDown,
    handleSetRingMouseUp,
    handleSetRingMouseLeave,
    handleAntidelaySubmit,
    handleAntidelayCancel
  };
};
