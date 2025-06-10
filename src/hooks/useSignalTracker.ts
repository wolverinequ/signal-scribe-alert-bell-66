
import { useState, useEffect, useRef } from 'react';

interface Signal {
  timeframe: string;
  asset: string;
  timestamp: string;
  direction: string;
  triggered: boolean;
}

export const useSignalTracker = () => {
  const [signalsText, setSignalsText] = useState('');
  const [savedSignals, setSavedSignals] = useState<Signal[]>([]);
  const [isRinging, setIsRinging] = useState(false);
  const [currentRingingSignal, setCurrentRingingSignal] = useState<Signal | null>(null);
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const [ringOffButtonPressed, setRingOffButtonPressed] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepAudio = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      const duration = 1000; // 1 second
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
      return oscillator;
    };

    // Store the audio creation function for later use
    audioRef.current = { play: createBeepAudio } as any;
  }, []);

  // Parse signals from text
  const parseSignals = (text: string): Signal[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const signals: Signal[] = [];
    
    lines.forEach(line => {
      const parts = line.split(';');
      if (parts.length === 4) {
        const [timeframe, asset, timestamp, direction] = parts;
        if (timestamp.match(/^\d{2}:\d{2}$/)) {
          signals.push({
            timeframe: timeframe.trim(),
            asset: asset.trim(),
            timestamp: timestamp.trim(),
            direction: direction.trim(),
            triggered: false
          });
        }
      }
    });
    
    return signals;
  };

  // Check if timestamp matches current time
  const checkSignalTime = (signal: Signal): boolean => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return signal.timestamp === currentTime && !signal.triggered;
  };

  // Ring notification
  const triggerRing = (signal: Signal) => {
    setIsRinging(true);
    setCurrentRingingSignal(signal);
    
    // Wake up screen if supported
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => {
        setWakeLock(lock);
      }).catch(err => {
        console.log('Wake lock not supported:', err);
      });
    }

    // Play sound
    if (audioRef.current && audioRef.current.play) {
      audioRef.current.play();
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
  }, [savedSignals]);

  // Ring off button handler - now always functional
  const handleRingOff = () => {
    setRingOffButtonPressed(true);
    setTimeout(() => setRingOffButtonPressed(false), 200);
    
    // Stop ringing if currently ringing
    if (isRinging) {
      setIsRinging(false);
      setCurrentRingingSignal(null);
      
      if (wakeLock) {
        wakeLock.release();
        setWakeLock(null);
      }
    }
  };

  // Save signals button handler
  const handleSaveSignals = () => {
    setSaveButtonPressed(true);
    setTimeout(() => setSaveButtonPressed(false), 200);
    
    const signals = parseSignals(signalsText);
    setSavedSignals(signals);
  };

  // Enhanced screen off button handler
  const handleScreenOff = async () => {
    try {
      console.log('Screen off button clicked - attempting to turn off screen');
      
      // Release any existing wake lock first
      if (wakeLock) {
        await wakeLock.release();
        setWakeLock(null);
        console.log('Wake lock released');
      }
      
      // Try to minimize the page visibility
      if (document.hidden !== undefined) {
        // Blur the window
        window.blur();
        console.log('Window blurred');
      }
      
      // Try to exit fullscreen if in fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        console.log('Exited fullscreen');
      }
      
      // For mobile browsers, try to minimize
      if ('userAgent' in navigator && /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
        // On mobile, blur the window and try to minimize
        window.blur();
        
        // Try to navigate away temporarily (this will minimize most mobile browsers)
        const currentUrl = window.location.href;
        window.location.href = 'about:blank';
        setTimeout(() => {
          window.location.href = currentUrl;
        }, 100);
        
        console.log('Mobile screen off attempt executed');
      }
      
      // Additional attempt: set page visibility to hidden
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      });
      
      // Dispatch visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
      
    } catch (error) {
      console.log('Screen control attempt failed:', error);
      
      // Fallback: at least blur the window and show a message
      window.blur();
      alert('Screen off functionality is limited in browsers. For full screen control, please use this app as a mobile app.');
    }
  };

  return {
    signalsText,
    setSignalsText,
    saveButtonPressed,
    ringOffButtonPressed,
    handleRingOff,
    handleSaveSignals,
    handleScreenOff
  };
};
