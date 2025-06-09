import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BellOff, Save, PowerOff } from 'lucide-react';

interface Signal {
  timeframe: string;
  asset: string;
  timestamp: string;
  direction: string;
  triggered: boolean;
}

const Index = () => {
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main signals area - extended to fill more space */}
      <div className="flex-1 p-4 pb-2">
        <div className="mb-4">
          <h1 className="text-2xl font-bold mb-2">Binary Options Signal Tracker</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Enter signals in format: TIMEFRAME;ASSET;HH:MM;DIRECTION
          </p>
        </div>

        <Textarea
          value={signalsText}
          onChange={(e) => setSignalsText(e.target.value)}
          placeholder="Example:&#10;1H;EURUSD;14:30;CALL&#10;5M;GBPUSD;15:45;PUT&#10;15M;USDJPY;16:00;CALL"
          className="h-[calc(100vh-200px)] text-base font-mono resize-none"
        />
      </div>

      {/* Bottom control panel - no separator line */}
      <div className="bg-card p-4">
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          <Button
            onClick={handleRingOff}
            variant="outline"
            className={`h-16 flex flex-col gap-1 transition-all duration-200 ${
              ringOffButtonPressed ? 'scale-95 bg-muted' : 'hover:bg-accent'
            }`}
          >
            <BellOff className="h-6 w-6" />
            <span className="text-xs">Ring Off</span>
          </Button>

          <Button
            onClick={handleSaveSignals}
            variant="default"
            className={`h-16 flex flex-col gap-1 transition-all duration-200 ${
              saveButtonPressed ? 'scale-95 opacity-80' : 'hover:bg-primary/90'
            }`}
            disabled={!signalsText.trim()}
          >
            <Save className="h-6 w-6" />
            <span className="text-xs">Save</span>
          </Button>

          <Button
            onClick={handleScreenOff}
            variant="secondary"
            className="h-16 flex flex-col gap-1 transition-all duration-200 hover:bg-secondary/80"
          >
            <PowerOff className="h-6 w-6" />
            <span className="text-xs">Screen Off</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
