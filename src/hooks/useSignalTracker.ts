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
  const [setRingButtonPressed, setSetRingButtonPressed] = useState(false);
  const [customRingtone, setCustomRingtone] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

    // Create hidden file input for ringtone selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', handleRingtoneSelect);
    document.body.appendChild(fileInput);
    fileInputRef.current = fileInput;

    return () => {
      if (fileInputRef.current && document.body.contains(fileInputRef.current)) {
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, []);

  // Handle ringtone file selection
  const handleRingtoneSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomRingtone(url);
      console.log('Custom ringtone set:', file.name);
    }
  };

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

    // Play custom ringtone or default beep
    if (customRingtone) {
      const audio = new Audio(customRingtone);
      audio.play().catch(err => {
        console.log('Error playing custom ringtone:', err);
        // Fallback to default beep
        if (audioRef.current && audioRef.current.play) {
          audioRef.current.play();
        }
      });
    } else {
      // Play default beep
      if (audioRef.current && audioRef.current.play) {
        audioRef.current.play();
      }
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

  // Set Ring button handler
  const handleSetRing = () => {
    setSetRingButtonPressed(true);
    setTimeout(() => setSetRingButtonPressed(false), 200);
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
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
