
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

  // Screen off button handler
  const handleScreenOff = async () => {
    try {
      if ('wakeLock' in navigator && wakeLock) {
        await wakeLock.release();
        setWakeLock(null);
      }
      
      // Request screen to turn off (this is limited in browsers)
      // The best we can do is minimize or blur the window
      if (document.documentElement.requestFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      
      // Blur the window to simulate screen off
      window.blur();
    } catch (error) {
      console.log('Screen control limited');
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
